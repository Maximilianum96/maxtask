const express = require('express');
const sessionStore = require('../session/store');
const claude = require('../services/claude');

const router = express.Router();

const VALID_MODES = ['style-advisor', 'outfit-generator', 'wardrobe-assistant'];

// Create a new session
router.post('/session', (req, res) => {
  const mode = req.body.mode || 'style-advisor';
  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` });
  }
  const session = sessionStore.create(mode);
  res.status(201).json({ sessionId: session.id, mode: session.mode });
});

// Get session info
router.get('/session/:id', (req, res) => {
  const session = sessionStore.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ sessionId: session.id, mode: session.mode, messages: session.messages });
});

// Switch mode
router.put('/session/:id/mode', (req, res) => {
  const { mode } = req.body;
  if (!mode || !VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` });
  }
  const session = sessionStore.setMode(req.params.id, mode);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ sessionId: session.id, mode: session.mode });
});

// Chat
router.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'sessionId and a non-empty message are required' });
  }

  const session = sessionStore.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  sessionStore.addMessage(sessionId, 'user', message.trim());

  try {
    const reply = await claude.chat(session.mode, session.messages);
    sessionStore.addMessage(sessionId, 'assistant', reply);
    res.json({ reply, sessionId });
  } catch (err) {
    // Remove the user message if Claude call failed
    session.messages.pop();
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Failed to get a response. Please try again.' });
  }
});

// Delete session
router.delete('/session/:id', (req, res) => {
  sessionStore.destroy(req.params.id);
  res.status(204).end();
});

module.exports = router;
