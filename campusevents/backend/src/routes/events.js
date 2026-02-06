import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES (sans authentification)
// ════════════════════════════════════════════════════════════

/**
 * GET /api/events
 * Liste tous les événements avec filtres optionnels
 * Query params: tags, location, startDate, endDate, search
 */
router.get('/', async (req, res) => {
  try {
    const { tags, location, startDate, endDate, search } = req.query;

    // Construction du filtre dynamique
    const where = {
      AND: [
        // Filtre par tags (ex: ?tags=sport,tech)
        tags && tags.length > 0
          ? {
              tags: {
                hasSome: typeof tags === 'string' ? tags.split(',') : tags,
              },
            }
          : {},
        
        // Filtre par localisation (recherche partielle insensible à la casse)
        location
          ? {
              location: {
                contains: location,
                mode: 'insensitive',
              },
            }
          : {},
        
        // Filtre par date de début
        startDate
          ? {
              startAt: {
                gte: new Date(startDate),
              },
            }
          : {},
        
        // Filtre par date de fin
        endDate
          ? {
              startAt: {
                lte: new Date(endDate),
              },
            }
          : {},
        
        // Recherche textuelle (titre ou description)
        search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {},
      ].filter((filter) => Object.keys(filter).length > 0), // Enlever les filtres vides
    };

    const events = await prisma.event.findMany({
      where: where.AND.length > 0 ? where : {},
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    // Ajouter les informations calculées
    const eventsWithDetails = events.map((event) => ({
      ...event,
      attendeesCount: event._count.registrations,
      availableSpots: event.capacity - event._count.registrations,
      isFull: event._count.registrations >= event.capacity,
    }));

    res.json(eventsWithDetails);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/:id
 * Détail d'un événement
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Ajouter les informations calculées
    const eventWithDetails = {
      ...event,
      attendeesCount: event._count.registrations,
      availableSpots: event.capacity - event._count.registrations,
      isFull: event._count.registrations >= event.capacity,
    };

    res.json(eventWithDetails);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// ════════════════════════════════════════════════════════════
// ROUTES ADMIN (création, modification, suppression)
// ════════════════════════════════════════════════════════════

/**
 * POST /api/events
 * Créer un nouvel événement (admin seulement)
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, location, tags, capacity, startAt, endAt } = req.body;

    // Validation
    if (!title || !location || !capacity || !startAt) {
      return res.status(400).json({
        error: 'Missing required fields: title, location, capacity, startAt',
      });
    }

    if (capacity < 1) {
      return res.status(400).json({ error: 'Capacity must be at least 1' });
    }

    const startDate = new Date(startAt);
    const endDate = endAt ? new Date(endAt) : null;

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start date' });
    }

    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid end date' });
    }

    if (endDate && endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        location,
        tags: tags || [],
        capacity: parseInt(capacity),
        startAt: startDate,
        endAt: endDate,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/events/:id
 * Modifier un événement (admin seulement)
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, tags, capacity, startAt, endAt } = req.body;

    // Vérifier que l'événement existe
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Si on réduit la capacité, vérifier qu'on ne passe pas en dessous du nombre d'inscrits
    if (capacity && parseInt(capacity) < existingEvent._count.registrations) {
      return res.status(400).json({
        error: `Cannot reduce capacity below current registrations (${existingEvent._count.registrations})`,
      });
    }

    // Validation des dates
    const startDate = startAt ? new Date(startAt) : existingEvent.startAt;
    const endDate = endAt ? new Date(endAt) : existingEvent.endAt;

    if (endDate && endDate <= startDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Mise à jour
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(location && { location }),
        ...(tags && { tags }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(startAt && { startAt: startDate }),
        ...(endAt !== undefined && { endAt: endDate }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { registrations: true },
        },
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/events/:id
 * Supprimer un événement (admin seulement)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Supprimer l'événement (les registrations seront supprimées en cascade)
    await prisma.event.delete({
      where: { id },
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ════════════════════════════════════════════════════════════
// ROUTES UTILISATEURS (inscription, désinscription)
// ════════════════════════════════════════════════════════════

/**
 * POST /api/events/:id/register
 * S'inscrire à un événement
 */
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Vérifier si l'événement est déjà passé
    if (event.startAt < new Date()) {
      return res.status(400).json({ error: 'Cannot register to past events' });
    }

    // Vérifier la capacité
    if (event._count.registrations >= event.capacity) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Créer l'inscription (unique constraint empêche les doublons)
    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId: id,
      },
    });

    res.status(201).json({
      message: 'Successfully registered to event',
      registration,
    });
  } catch (error) {
    // Gestion de l'erreur de doublon
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Already registered to this event' });
    }
    console.error('Error registering to event:', error);
    res.status(500).json({ error: 'Failed to register to event' });
  }
});

/**
 * DELETE /api/events/:id/register
 * Se désinscrire d'un événement
 */
router.delete('/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Chercher l'inscription
    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId: id,
        },
      },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Not registered to this event' });
    }

    // Supprimer l'inscription
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

/**
 * GET /api/events/:id/attendees
 * Liste des participants à un événement
 */
router.get('/:id/attendees', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Récupérer les inscrits
    const registrations = await prisma.registration.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const attendees = registrations.map((reg) => ({
      registrationId: reg.id,
      registeredAt: reg.createdAt,
      user: reg.user,
    }));

    res.json({
      eventId: id,
      count: attendees.length,
      capacity: event.capacity,
      attendees,
    });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

/**
 * GET /api/events/my/registrations
 * Liste des événements auxquels l'utilisateur est inscrit
 */
router.get('/my/registrations', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const registrations = await prisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: { registrations: true },
            },
          },
        },
      },
      orderBy: {
        event: {
          startAt: 'asc',
        },
      },
    });

    const events = registrations.map((reg) => ({
      registrationId: reg.id,
      registeredAt: reg.createdAt,
      event: {
        ...reg.event,
        attendeesCount: reg.event._count.registrations,
        availableSpots: reg.event.capacity - reg.event._count.registrations,
      },
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

export default router;
