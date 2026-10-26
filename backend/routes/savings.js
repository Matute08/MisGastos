import express from 'express';
import { SavingsService } from '../services/savingsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.list(req.user.id);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// --- Frascos (Jars) Endpoints ---
router.get('/jars', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.listJars(req.user.id);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/jars', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.createJar(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.put('/jars/:id', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.updateJar(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.delete('/jars/:id', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.deleteJar(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/jars/:id/deposit', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.depositToJar(req.user.id, req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/jars/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.withdrawFromJar(req.user.id, req.params.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.get('/jars/:id/movements', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.getJarMovements(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.create(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.update(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsService.delete(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

export default router;
