import request from 'supertest';
import app from '../app.js';
import { getDb } from '../config/database.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

let authToken;
let testCapsuleId;
let testUnlockCode;

// Setup and teardown
beforeAll(async () => {
  const db = await getDb();
  
  // Clear capsules table
  await db.run('DELETE FROM capsules');
  
  // Create a test user if not exists
  const testUser = await db.get('SELECT * FROM users WHERE username = ?', ['testuser']);
  let userId;
  
  if (!testUser) {
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      ['testuser', 'hashedpassword']
    );
    userId = result.lastID;
  } else {
    userId = testUser.id;
  }
  
  // Generate auth token for tests
  authToken = jwt.sign(
    { id: userId, username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  await db.close();
});

afterAll(async () => {
  const db = await getDb();
  await db.run('DELETE FROM capsules');
  await db.close();
});

describe('Capsule Endpoints', () => {
  describe('POST /capsules', () => {
    it('should create a new capsule', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const res = await request(app)
        .post('/capsules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Test capsule message',
          unlock_at: futureDate.toISOString()
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('capsule');
      expect(res.body.capsule).toHaveProperty('id');
      expect(res.body.capsule).toHaveProperty('unlock_code');
      
      // Save for later tests
      testCapsuleId = res.body.capsule.id;
      testUnlockCode = res.body.capsule.unlock_code;
    });
    
    it('should return 400 if message or unlock_at is missing', async () => {
      const res = await request(app)
        .post('/capsules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Incomplete capsule'
        });
      
      expect(res.statusCode).toEqual(400);
    });
    
    it('should return 400 if unlock_at is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const res = await request(app)
        .post('/capsules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Past capsule',
          unlock_at: pastDate.toISOString()
        });
      
      expect(res.statusCode).toEqual(400);
    });
  });
  
  describe('GET /capsules', () => {
    it('should list capsules with pagination', async () => {
      const res = await request(app)
        .get('/capsules')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('capsules');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.capsules)).toBe(true);
    });
  });
  
  describe('GET /capsules/:id', () => {
    it('should return 403 if capsule is not yet unlocked', async () => {
      const res = await request(app)
        .get(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: testUnlockCode });
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('not yet unlocked');
    });
    
    it('should return 401 if unlock code is invalid', async () => {
      const res = await request(app)
        .get(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: 'wrongcode' });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('Invalid unlock code');
    });
  });
  
  describe('PUT /capsules/:id', () => {
    it('should update a capsule', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // Day after tomorrow
      
      const res = await request(app)
        .put(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: testUnlockCode })
        .send({
          message: 'Updated test message',
          unlock_at: futureDate.toISOString()
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('updated successfully');
    });
    
    it('should return 401 if unlock code is invalid', async () => {
      const res = await request(app)
        .put(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: 'wrongcode' })
        .send({
          message: 'This should fail'
        });
      
      expect(res.statusCode).toEqual(401);
    });
  });
  
  describe('DELETE /capsules/:id', () => {
    it('should return 401 if unlock code is invalid', async () => {
      const res = await request(app)
        .delete(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: 'wrongcode' });
      
      expect(res.statusCode).toEqual(401);
    });
    
    it('should delete a capsule', async () => {
      const res = await request(app)
        .delete(`/capsules/${testCapsuleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ code: testUnlockCode });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('deleted successfully');
    });
  });
});