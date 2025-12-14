import request from 'supertest';
import app from '../../src/app';
import { prisma, cleanDatabase } from '../helpers/prisma';

describe('GET /api/purchases', () => {
  let userToken: string;
  const testId = Date.now();

  beforeEach(async () => {
    await cleanDatabase();

    // Create regular user
    const hashedPassword = await require('bcryptjs').hash('UserPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `purchase-user-${testId}@example.com`,
        password: hashedPassword,
        role: 'User',
      },
    });

    // Generate user token manually
    const jwt = require('jsonwebtoken');
    userToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
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

  it('should return empty list when no purchases exist', async () => {
    const res = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return all purchases with correct data', async () => {
    // Create sweets
    const sweet1 = await prisma.sweet.create({
      data: {
        name: `Sweet 1 ${testId}`,
        price: 5.99,
        quantity: 100,
      },
    });

    const sweet2 = await prisma.sweet.create({
      data: {
        name: `Sweet 2 ${testId}`,
        price: 3.99,
        quantity: 50,
      },
    });

    // Create purchases
    const purchase1 = await prisma.purchase.create({
      data: {
        sweetId: sweet1.id,
        quantity: 10,
        customerName: `Customer 1 ${testId}`,
        totalPrice: 59.9,
      },
    });

    const purchase2 = await prisma.purchase.create({
      data: {
        sweetId: sweet2.id,
        quantity: 5,
        customerName: `Customer 2 ${testId}`,
        totalPrice: 19.95,
      },
    });

    const res = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('id');
    // Newest first, so purchase2 is first
    expect(res.body[0].id).toBe(purchase2.id);
    expect(res.body[0].quantity).toBe(5);
    expect(res.body[1].id).toBe(purchase1.id);
    expect(res.body[1].quantity).toBe(10);
  });

  it('should return 401 if user is not authenticated', async () => {
    const res = await request(app).get('/api/purchases');

    expect(res.status).toBe(401);
  });

  it('should return purchases sorted by creation date (newest first)', async () => {
    const sweet = await prisma.sweet.create({
      data: {
        name: `Sweet ${testId}`,
        price: 5.99,
        quantity: 100,
      },
    });

    // Create multiple purchases with delay
    const purchase1 = await prisma.purchase.create({
      data: {
        sweetId: sweet.id,
        quantity: 1,
        customerName: `Customer A ${testId}`,
        totalPrice: 5.99,
      },
    });

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const purchase2 = await prisma.purchase.create({
      data: {
        sweetId: sweet.id,
        quantity: 2,
        customerName: `Customer B ${testId}`,
        totalPrice: 11.98,
      },
    });

    const res = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Newest first
    expect(res.body[0].id).toBe(purchase2.id);
    expect(res.body[1].id).toBe(purchase1.id);
  });
});
