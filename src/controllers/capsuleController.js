import { getDb } from '../config/database.js';
import { generateUnlockCode } from '../utils/generateCode.js';

// Create a new capsule
export const createCapsule = async (req, res, next) => {
  try {
    const { message, unlock_at } = req.body;
    const userId = req.user.id;
    
    if (!message || !unlock_at) {
      return res.status(400).json({ error: 'Message and unlock time are required' });
    }
    
    // Validate unlock_at is in the future
    const unlockDate = new Date(unlock_at);
    const now = new Date();
    
    if (isNaN(unlockDate.getTime()) || unlockDate <= now) {
      return res.status(400).json({ error: 'Unlock time must be a valid date in the future' });
    }
    
    // Generate unique unlock code
    const unlockCode = generateUnlockCode(10);
    
    const db = await getDb();
    
    // Insert new capsule
    const result = await db.run(
      `INSERT INTO capsules (user_id, message, unlock_at, unlock_code)
       VALUES (?, ?, ?, ?)`,
      [userId, message, unlock_at, unlockCode]
    );
    
    const capsuleId = result.lastID;
    
    res.status(201).json({
      message: 'Capsule created successfully',
      capsule: {
        id: capsuleId,
        unlock_code: unlockCode,
        unlock_at
      }
    });
    
    await db.close();
  } catch (error) {
    next(error);
  }
};

// Get a specific capsule
export const getCapsule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code } = req.query;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(401).json({ error: 'Unlock code is required' });
    }
    
    const db = await getDb();
    
    // Find capsule by id and user_id
    const capsule = await db.get(
      `SELECT * FROM capsules WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found' });
    }
    
    // Check if capsule is expired (more than 30 days past unlock time)
    const unlockDate = new Date(capsule.unlock_at);
    const thirtyDaysAfterUnlock = new Date(unlockDate);
    thirtyDaysAfterUnlock.setDate(thirtyDaysAfterUnlock.getDate() + 30);
    
    if (capsule.is_expired || new Date() > thirtyDaysAfterUnlock) {
      return res.status(410).json({ error: 'Capsule has expired' });
    }
    
    // Verify unlock code
    if (capsule.unlock_code !== code) {
      return res.status(401).json({ error: 'Invalid unlock code' });
    }
    
    // Check if it's time to unlock
    const now = new Date();
    if (now < unlockDate) {
      return res.status(403).json({
        error: 'Capsule is not yet unlocked',
        unlock_at: capsule.unlock_at
      });
    }
    
    // Return capsule data
    res.status(200).json({
      id: capsule.id,
      message: capsule.message,
      unlock_at: capsule.unlock_at,
      created_at: capsule.created_at,
      updated_at: capsule.updated_at
    });
    
    await db.close();
  } catch (error) {
    next(error);
  }
};

// List all capsules for the user with pagination
export const listCapsules = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const db = await getDb();
    
    // Get total count for pagination
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM capsules WHERE user_id = ?`,
      [userId]
    );
    
    // Get capsules with pagination
    const capsules = await db.all(
      `SELECT id, unlock_at, is_expired, created_at, updated_at,
       CASE
         WHEN datetime('now') >= unlock_at AND is_expired = 0 THEN message
         ELSE NULL
       END as message
       FROM capsules
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    
    const totalPages = Math.ceil(countResult.total / limit);
    
    res.status(200).json({
      capsules,
      pagination: {
        total: countResult.total,
        page,
        limit,
        totalPages
      }
    });
    
    await db.close();
  } catch (error) {
    next(error);
  }
};

// Update a capsule
export const updateCapsule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code } = req.query;
    const { message, unlock_at } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(401).json({ error: 'Unlock code is required' });
    }
    
    if (!message && !unlock_at) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    const db = await getDb();
    
    // Find capsule by id and user_id
    const capsule = await db.get(
      `SELECT * FROM capsules WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found' });
    }
    
    // Verify unlock code
    if (capsule.unlock_code !== code) {
      return res.status(401).json({ error: 'Invalid unlock code' });
    }
    
    // Check if it's already unlocked
    const unlockDate = new Date(capsule.unlock_at);
    const now = new Date();
    
    if (now >= unlockDate) {
      return res.status(403).json({ error: 'Cannot update an unlocked capsule' });
    }
    
    // Validate new unlock_at if provided
    let newUnlockAt = unlock_at ? new Date(unlock_at) : null;
    
    if (newUnlockAt && (isNaN(newUnlockAt.getTime()) || newUnlockAt <= now)) {
      return res.status(400).json({ error: 'Unlock time must be a valid date in the future' });
    }
    
    // Update capsule
    const updateFields = [];
    const updateValues = [];
    
    if (message) {
      updateFields.push('message = ?');
      updateValues.push(message);
    }
    
    if (newUnlockAt) {
      updateFields.push('unlock_at = ?');
      updateValues.push(unlock_at);
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add required parameters for WHERE clause
    updateValues.push(id, userId, code);
    
    const result = await db.run(
      `UPDATE capsules
       SET ${updateFields.join(', ')}
       WHERE id = ? AND user_id = ? AND unlock_code = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Capsule not found or not updated' });
    }
    
    res.status(200).json({
      message: 'Capsule updated successfully',
      id: parseInt(id)
    });
    
    await db.close();
  } catch (error) {
    next(error);
  }
};

// Delete a capsule
export const deleteCapsule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code } = req.query;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(401).json({ error: 'Unlock code is required' });
    }
    
    const db = await getDb();
    
    // Find capsule by id and user_id
    const capsule = await db.get(
      `SELECT * FROM capsules WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!capsule) {
      return res.status(404).json({ error: 'Capsule not found' });
    }
    
    // Verify unlock code
    if (capsule.unlock_code !== code) {
      return res.status(401).json({ error: 'Invalid unlock code' });
    }
    
    // Check if it's already unlocked
    const unlockDate = new Date(capsule.unlock_at);
    const now = new Date();
    
    if (now >= unlockDate) {
      return res.status(403).json({ error: 'Cannot delete an unlocked capsule' });
    }
    
    // Delete capsule
    const result = await db.run(
      `DELETE FROM capsules WHERE id = ? AND user_id = ? AND unlock_code = ?`,
      [id, userId, code]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Capsule not found or not deleted' });
    }
    
    res.status(200).json({
      message: 'Capsule deleted successfully',
      id: parseInt(id)
    });
    
    await db.close();
  } catch (error) {
    next(error);
  }
};