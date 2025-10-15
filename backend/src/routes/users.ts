import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  birthDate: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
  photoUrl: z.string().optional()
})

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  birthDate: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  photoUrl: z.string().optional()
})

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        birthDate: true,
        ministryEntryDate: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// POST /api/users - Create user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        role: validatedData.role,
        photoUrl: validatedData.photoUrl,
        ministryEntryDate: new Date(), // Set current date as ministry entry date
        password: 'temp-password' // Temporary password, user should change on first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        birthDate: true,
        ministryEntryDate: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.status(201).json({
      message: 'User created successfully',
      user
    })
  } catch (error) {
    console.error('Create user error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to create user' })
  }
})

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        birthDate: true,
        ministryEntryDate: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateUserSchema.parse(req.body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' })
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    if (validatedData.birthDate) {
      updateData.birthDate = new Date(validatedData.birthDate)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        birthDate: true,
        ministryEntryDate: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update user error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to update user' })
  }
})

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router