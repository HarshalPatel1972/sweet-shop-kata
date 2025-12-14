import request from 'supertest';
import app from '../../src/app';
import { prisma, cleanDatabase } from '../helpers/prisma';

describe('POST /api/purchases', () => {
  let adminToken: string;
  const testId = Date.now();

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    const hashedPassword = await require('bcryptjs').hash('AdminPassword123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `purchase-admin-${testId}@example.com`,
        password: hashedPassword,
        role: 'Admin',
      },
    });

    // Generate admin token manually
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a purchase successfully with 201', async () => {
    // Create a sweet
    const sweet = await prisma.sweet.create({
      data: {
        name: `Purchase Test Sweet ${testId}`,
        price: 5.99,
        quantity: 100,
        description: 'Test sweet for purchases',
      },
    });

    // Create purchase
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId: sweet.id,
        quantity: 10,
        customerName: `Customer ${testId}`,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.sweetId).toBe(sweet.id);
    expect(res.body.quantity).toBe(10);
    expect(res.body.customerName).toBe(`Customer ${testId}`);

    // Verify sweet quantity was decreased
    const updatedSweet = await prisma.sweet.findUnique({
      where: { id: sweet.id },
    });
    expect(updatedSweet?.quantity).toBe(90);
  });

  it('should return 400 if required fields are missing', async () => {
    // Missing quantity
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId: 1,
        customerName: 'Test Customer',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('quantity');
  });

  it('should return 404 if sweet does not exist', async () => {
    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId: 99999,
        quantity: 10,
        customerName: 'Test Customer',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Sweet not found');
  });

  it('should return 400 if quantity exceeds available inventory', async () => {
    const sweet = await prisma.sweet.create({
      data: {
        name: `Limited Sweet ${testId}`,
        price: 2.99,
        quantity: 5,
        description: 'Limited inventory',
      },
    });

    const res = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sweetId: sweet.id,
        quantity: 10,
        customerName: 'Test Customer',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('insufficient');
  });

  it('should return 401 if user is not authenticated', async () => {
    const res = await request(app).post('/api/purchases').send({
      sweetId: 1,
      quantity: 10,
      customerName: 'Test Customer',
    });

    expect(res.status).toBe(401);
  });
});
