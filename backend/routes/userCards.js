import express from 'express';
import { UserCardsService } from '../services/userCardsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/user-cards - Obtener tarjetas vinculadas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await UserCardsService.getUserCards(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo tarjetas del usuario:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/user-cards - Vincular tarjeta disponible al usuario
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { available_card_id } = req.body;
    
    if (!available_card_id) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarjeta disponible es requerido'
      });
    }

    const result = await UserCardsService.linkCardToUser(req.user.id, available_card_id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error vinculando tarjeta al usuario:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/user-cards/:id - Desvincular tarjeta del usuario
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UserCardsService.unlinkCardFromUser(req.user.id, id);
    res.json(result);
  } catch (error) {
    console.error('Error desvinculando tarjeta del usuario:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/user-cards/stats - Obtener estadísticas de tarjetas del usuario
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await UserCardsService.getUserCardStats(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estadísticas de tarjetas del usuario:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/user-cards/check/:availableCardId - Verificar si una tarjeta está vinculada
router.get('/check/:availableCardId', authenticateToken, async (req, res) => {
  try {
    const { availableCardId } = req.params;
    const result = await UserCardsService.isCardLinkedToUser(req.user.id, availableCardId);
    res.json(result);
  } catch (error) {
    console.error('Error verificando vinculación de tarjeta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
