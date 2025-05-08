import request from 'supertest';
import app from '../app.js';
import { getDb } from '../config/database.js';
import bcrypt from 'bcrypt';

// Setup and teardown
beforeAll(async () => {
  const db = await getDb();
  
  // Clear users table
  await db.run('DELETE FROM users');
  
  // Add a test user
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  await db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    ['testuser', hashedPassword]
  );
  
  await db.close();
});

afterAll(async () => {
  const db = await getDb();
  await db.run('DELETE FROM users');
  await db.close();
});

describe('Authentication Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'newuser',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('userId');
      expect(res.body.message).toEqual('User registered successfully');
    });
    
    it('should return 409 if username already exists', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(409);
      expect(res.body.error).toEqual('Username already exists');
    });
    
    it('should return 400 if username or password is missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'incomplete'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Username and password are required');
    });
  });
  
  describe('POST /auth/login', () => {
    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.message).toEqual('Login successful');
    });
    
    it('should return 401 if credentials are invalid', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid credentials');
    });
    
    it('should return 400 if username or password is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Username and password are required');
    });
  });
});