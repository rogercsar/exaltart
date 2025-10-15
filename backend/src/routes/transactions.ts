import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be either INCOME or EXPENSE' })
  }),
  category: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  proofUrl: z.string().optional()
})

const updateTransactionSchema = createTransactionSchema.partial()

// GET /api/transactions - Get all transactions (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = '1', limit = '10', type, category, startDate, endDate } = req.query

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type
    }

    if (category) {
      where.category = {
        contains: category as string,
        mode: 'insensitive'
      }
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string)
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.financialTransaction.count({ where })
    ])

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// GET /api/transactions/summary - Get financial summary (All authenticated users)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const where: any = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string)
      }
    }

    const [income, expenses] = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.financialTransaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: { id: true }
      })
    ])

    const totalIncome = income._sum.amount || 0
    const totalExpenses = expenses._sum.amount || 0
    const balance = totalIncome - totalExpenses

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        balance,
        incomeCount: income._count.id,
        expenseCount: expenses._count.id
      }
    })
  } catch (error) {
    console.error('Get summary error:', error)
    res.status(500).json({ error: 'Failed to fetch financial summary' })
  }
})

// GET /api/transactions/:id - Get transaction by ID (All authenticated users)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    res.json({ transaction })
  } catch (error) {
    console.error('Get transaction error:', error)
    res.status(500).json({ error: 'Failed to fetch transaction' })
  }
})

// POST /api/transactions - Create transaction (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createTransactionSchema.parse(req.body)

    const transaction = await prisma.financialTransaction.create({
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        type: validatedData.type,
        category: validatedData.category,
        date: new Date(validatedData.date),
        proofUrl: validatedData.proofUrl,
        authorId: req.user!.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

// PUT /api/transactions/:id - Update transaction (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateTransactionSchema.parse(req.body)

    // Check if transaction exists
    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const updatedTransaction = await prisma.financialTransaction.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

// DELETE /api/transactions/:id - Delete transaction (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if transaction exists
    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    await prisma.financialTransaction.delete({
      where: { id }
    })

    res.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Delete transaction error:', error)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

export default router