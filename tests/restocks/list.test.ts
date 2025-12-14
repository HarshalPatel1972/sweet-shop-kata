import request from 'supertest';
import app from '../../src/app';
import { prisma, cleanDatabase } from '../helpers/prisma';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

describe('GET /api/restocks - List Restocks', () => {
  let userToken: string;
  let sweetId: number;
  const testId = Date.now();

  beforeEach(async () => {
    await cleanDatabase();

    // Create a regular user
    const hashedPassword = await bcryptjs.hash('UserPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `user-restock-list-${testId}@example.com`,
        password: hashedPassword,
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
        quantity: 100,
        description: 'A test sweet',
      },
    });
    sweetId = sweet.id;
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it('should return empty array when no restocks exist', async () => {
    const res = await request(app)
      .get('/api/restocks')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return all restocks sorted by date newest first', async () => {
    // Create multiple restocks with different dates
    await prisma.restock.createMany({
      data: [
        {
          sweetId,
          quantity: 20,
          restockDate: '2025-12-10',
          notes: 'First restock',
        },
        {
          sweetId,
          quantity: 30,
          restockDate: '2025-12-14',
          notes: 'Latest restock',
        },
        {
          sweetId,
          quantity: 15,
          restockDate: '2025-12-12',
          notes: 'Middle restock',
        },
      ],
    });

    const res = await request(app)
      .get('/api/restocks')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    // Should be sorted by restockDate descending (newest first)
    expect(res.body[0].restockDate).toBe('2025-12-14');
    expect(res.body[1].restockDate).toBe('2025-12-12');
    expect(res.body[2].restockDate).toBe('2025-12-10');
  });

  it('should filter restocks by sweetId', async () => {
    // Create another sweet
    const sweet2 = await prisma.sweet.create({
      data: {
        name: `Test Sweet 2 ${testId}`,
        price: 15.99,
        quantity: 50,
        description: 'Another test sweet',
      },
    });

    // Create restocks for both sweets
    await prisma.restock.createMany({
      data: [
        {
          sweetId,
          quantity: 20,
          restockDate: '2025-12-14',
          notes: 'Restock 1',
        },
        {
          sweetId: sweet2.id,
          quantity: 30,
          restockDate: '2025-12-14',
          notes: 'Restock 2',
        },
        {
          sweetId,
          quantity: 15,
          restockDate: '2025-12-12',
          notes: 'Restock 3',
        },
      ],
    });

    const res = await request(app)
      .get('/api/restocks')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ sweetId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((r: any) => r.sweetId === sweetId)).toBe(true);
  });

  it('should return 401 when user is not authenticated', async () => {
    const res = await request(app).get('/api/restocks');

    expect(res.status).toBe(401);
  });
});
