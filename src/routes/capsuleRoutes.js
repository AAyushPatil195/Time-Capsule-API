import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createCapsule,
  getCapsule,
  listCapsules,
  updateCapsule,
  deleteCapsule
} from '../controllers/capsuleController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new capsule
router.post('/', createCapsule);

// Get a specific capsule
router.get('/:id', getCapsule);

// List all capsules for the user
router.get('/', listCapsules);

// Update a capsule
router.put('/:id', updateCapsule);

// Delete a capsule
router.delete('/:id', deleteCapsule);

export default router;