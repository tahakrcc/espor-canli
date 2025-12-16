const express = require('express');
const router = express.Router();
const eventService = require('../services/eventService');
const { authenticate, adminCheck } = require('../middleware/auth');

// Tüm etkinlikleri getir
router.get('/', async (req, res) => {
  try {
    const events = await eventService.getActiveEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tüm etkinlikleri getir (admin için)
router.get('/all', authenticate, adminCheck, async (req, res) => {
  try {
    const events = await eventService.getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etkinlik oluştur (admin)
router.post('/', authenticate, adminCheck, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const event = await eventService.createEvent(name, req.user.userId);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etkinlik bitir (admin)
router.post('/:eventId/finish', authenticate, adminCheck, async (req, res) => {
  try {
    const { eventId } = req.params;
    await eventService.finishEvent(eventId);
    res.json({ message: 'Event finished successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etkinlik detayları
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const details = await eventService.getEventDetails(eventId);

    if (!details) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etkinliğe katıl
router.post('/:eventId/join', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    await eventService.joinEvent(eventId, req.user.userId);
    res.json({ message: 'Joined event successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Etkinlikten ayrıl
router.post('/:eventId/leave', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    await eventService.leaveEvent(eventId, req.user.userId);
    res.json({ message: 'Left event successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

