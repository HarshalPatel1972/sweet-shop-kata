import request from 'supertest';
import app from '../../src/app';
import { prisma, cleanDatabase } from '../helpers/prisma';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

describe('POST /api/restocks - Create Restock', () => {
  let adminToken: string;
  let userToken: string;
  let sweetId: number;
  const testId = Date.now();

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    const hashedAdminPassword = await bcryptjs.hash('AdminPassword123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: `admin-restock-${testId}@example.com`,
        password: hashedAdminPassword,
        role: 'Admin',
      },
    });

    adminToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Create regular user
    const hashedUserPassword = await bcryptjs.hash('UserPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `user-restock-${testId}@example.com`,
        password: hashedUserPassword,
        role: 'User',
      },
    });

    userToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Create a test sweet
    const sweet = await prisma.sweet.create({
      data: {
        name: `Test Sweet ${testId}`,
        price: 10.99,
        quantity: 20,
        description: 'A test sweet',
      },
    });
    sweetId = sweet.id;
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should create a restock and increase sweet quantity', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId,
        quantity: 30,
        restockDate: '2025-12-14',
        notes: 'Regular restock',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.sweetId).toBe(sweetId);
    expect(res.body.quantity).toBe(30);
    expect(res.body.restockDate).toBe('2025-12-14');

    // Verify sweet quantity was increased
    const updatedSweet = await prisma.sweet.findUnique({
      where: { id: sweetId },
    });
    expect(updatedSweet?.quantity).toBe(50); // 20 + 30
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId,
        // missing quantity
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 when sweetId is missing', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        quantity: 30,
        restockDate: '2025-12-14',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 when quantity is not a positive number', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId,
        quantity: -5,
        restockDate: '2025-12-14',
      });

    expect(res.status).toBe(400);
  });

  it('should return 404 when sweet does not exist', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId: 99999,
        quantity: 30,
        restockDate: '2025-12-14',
      });

    expect(res.status).toBe(404);
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .send({
        sweetId,
        quantity: 30,
        restockDate: '2025-12-14',
      });

    expect(res.status).toBe(401);
  });

  it('should return 403 when user is not admin', async () => {
    const res = await request(app)
      .post('/api/restocks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sweetId,
        quantity: 30,
        restockDate: '2025-12-14',
      });

    expect(res.status).toBe(403);
  });
});
