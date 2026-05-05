import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Customers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ownerToken: string;
  let workerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up in FK-safe order (payments → orders → prescriptions → customers)
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.customer.deleteMany({});

    // Get owner token (seeded by AuthService.onModuleInit)
    const ownerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'owner', password: 'owner123' });
    ownerToken = ownerRes.body.token;

    const workerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'worker', password: 'worker123' });
    workerToken = workerRes.body.token;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.customer.deleteMany({});
    await app.close();
  });

  // ─── POST /customers ────────────────────────────────────────────────────────

  describe('POST /customers', () => {
    it('201 — creates customer with valid body', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Ali Khan', contact: '0300-1234567', address: 'Lahore' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Ali Khan');
      expect(res.body.contact).toBe('0300-1234567');
    });

    it('400 — rejects missing name', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contact: '0300-0000000' })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('400 — rejects missing contact', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test User' })
        .expect(400);
    });

    it('401 — rejects request without Authorization header', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'Test', contact: '123' })
        .expect(401);
    });
  });

  // ─── GET /customers ──────────────────────────────────────────────────────────

  describe('GET /customers', () => {
    it('200 — returns array of customers', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('200 — search by name is case-insensitive', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?search=ali')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((c: any) =>
        c.name.toLowerCase().includes('ali') || c.contact.toLowerCase().includes('ali')
      )).toBe(true);
    });

    it('200 — search returns empty array for no match', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?search=zzznomatch')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('401 — rejects unauthenticated request', async () => {
      await request(app.getHttpServer()).get('/customers').expect(401);
    });
  });

  // ─── GET /customers/:id ──────────────────────────────────────────────────────

  describe('GET /customers/:id', () => {
    let customerId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Fatima Ahmed', contact: '0311-9999999' });
      customerId = res.body.id;
    });

    it('200 — returns customer by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(customerId);
      expect(res.body.name).toBe('Fatima Ahmed');
    });

    it('404 — returns 404 for unknown UUID', async () => {
      await request(app.getHttpServer())
        .get('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /customers/:id ────────────────────────────────────────────────────

  describe('PATCH /customers/:id', () => {
    let customerId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Patch Test', contact: '0333-0000000' });
      customerId = res.body.id;
    });

    it('200 — updates only provided fields', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contact: '0333-9999999' })
        .expect(200);

      expect(res.body.contact).toBe('0333-9999999');
      expect(res.body.name).toBe('Patch Test');
    });

    it('404 — returns 404 for unknown UUID', async () => {
      await request(app.getHttpServer())
        .patch('/customers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contact: '0300-0000000' })
        .expect(404);
    });
  });

  // ─── DELETE /customers/:id ───────────────────────────────────────────────────

  describe('DELETE /customers/:id', () => {
    let customerId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Delete Me', contact: '0300-0000000' });
      customerId = res.body.id;
    });

    it('204 — OWNER can delete a customer', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);
    });

    it('403 — WORKER cannot delete a customer', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });
  });
});
