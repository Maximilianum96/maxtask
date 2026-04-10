const request = require('supertest');
const app = require('../src/server');

// Mock the Claude service
jest.mock('../src/services/claude', () => ({
  chat: jest.fn().mockResolvedValue('Great question! I recommend a classic navy blazer paired with cream chinos.'),
}));

const claude = require('../src/services/claude');

describe('FashionGPT API', () => {
  let sessionId;

  describe('POST /api/session', () => {
    it('creates a new session with default mode', async () => {
      const res = await request(app).post('/api/session').send({});
      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBeDefined();
      expect(res.body.mode).toBe('style-advisor');
      sessionId = res.body.sessionId;
    });

    it('creates a session with specified mode', async () => {
      const res = await request(app).post('/api/session').send({ mode: 'outfit-generator' });
      expect(res.status).toBe(201);
      expect(res.body.mode).toBe('outfit-generator');
    });

    it('rejects invalid mode', async () => {
      const res = await request(app).post('/api/session').send({ mode: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/session/:id', () => {
    it('returns session info', async () => {
      const res = await request(app).get(`/api/session/${sessionId}`);
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.mode).toBe('style-advisor');
      expect(res.body.messages).toEqual([]);
    });

    it('returns 404 for unknown session', async () => {
      const res = await request(app).get('/api/session/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/session/:id/mode', () => {
    it('switches mode and clears messages', async () => {
      const res = await request(app)
        .put(`/api/session/${sessionId}/mode`)
        .send({ mode: 'wardrobe-assistant' });
      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('wardrobe-assistant');
    });

    it('rejects invalid mode', async () => {
      const res = await request(app)
        .put(`/api/session/${sessionId}/mode`)
        .send({ mode: 'bad-mode' });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown session', async () => {
      const res = await request(app)
        .put('/api/session/nonexistent/mode')
        .send({ mode: 'style-advisor' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/chat', () => {
    it('returns a fashion response', async () => {
      const res = await request(app).post('/api/chat').send({
        sessionId,
        message: 'What should I wear to a job interview?',
      });
      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(res.body.sessionId).toBe(sessionId);
      expect(claude.chat).toHaveBeenCalled();
    });

    it('rejects missing sessionId', async () => {
      const res = await request(app).post('/api/chat').send({ message: 'hello' });
      expect(res.status).toBe(400);
    });

    it('rejects empty message', async () => {
      const res = await request(app).post('/api/chat').send({ sessionId, message: '' });
      expect(res.status).toBe(400);
    });

    it('rejects missing message', async () => {
      const res = await request(app).post('/api/chat').send({ sessionId });
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown session', async () => {
      const res = await request(app).post('/api/chat').send({
        sessionId: 'nonexistent',
        message: 'hello',
      });
      expect(res.status).toBe(404);
    });

    it('stores messages in session history', async () => {
      const sessionRes = await request(app).get(`/api/session/${sessionId}`);
      expect(sessionRes.body.messages.length).toBe(2); // user + assistant from previous test
      expect(sessionRes.body.messages[0].role).toBe('user');
      expect(sessionRes.body.messages[1].role).toBe('assistant');
    });
  });

  describe('DELETE /api/session/:id', () => {
    it('deletes a session', async () => {
      const res = await request(app).delete(`/api/session/${sessionId}`);
      expect(res.status).toBe(204);
    });

    it('session is gone after deletion', async () => {
      const res = await request(app).get(`/api/session/${sessionId}`);
      expect(res.status).toBe(404);
    });
  });
});
