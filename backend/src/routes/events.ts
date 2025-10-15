import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = express.Router()

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format')
})

const updateEventSchema = createEventSchema.partial()

// GET /api/events - Get all events (All authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
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
        startTime: 'asc'
      }
    })

    res.json({ events })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

// GET /api/events/:id - Get event by ID (All authenticated users)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const event = await prisma.event.findUnique({
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

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json({ event })
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({ error: 'Failed to fetch event' })
  }
})

// POST /api/events - Create event (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createEventSchema.parse(req.body)

    // Validate that end time is after start time
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)

    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' })
    }

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        startTime,
        endTime,
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
      message: 'Event created successfully',
      event
    })
  } catch (error) {
    console.error('Create event error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to create event' })
  }
})

// PUT /api/events/:id - Update event (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateEventSchema.parse(req.body)

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Validate times if provided
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)

      if (endTime <= startTime) {
        return res.status(400).json({ error: 'End time must be after start time' })
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData }
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
    }

    const updatedEvent = await prisma.event.update({
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
      message: 'Event updated successfully',
      event: updatedEvent
    })
  } catch (error) {
    console.error('Update event error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      })
    }

    res.status(500).json({ error: 'Failed to update event' })
  }
})

// DELETE /api/events/:id - Delete event (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }

    await prisma.event.delete({
      where: { id }
    })

    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

export default router