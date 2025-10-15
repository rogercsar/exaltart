import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  birthDate: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        role: validatedData.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        birthDate: true,
        ministryEntryDate: true,
        photoUrl: true,
        createdAt: true
      }
    })

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User created successfully',
      user,
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to create user' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Return user data (without password)
    const { password, ...userWithoutPassword } = user

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to login' })
  }
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User data is already available from auth middleware
    res.json({
      user: req.user
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user data' })
  }
})

export default router

