import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const VALID_PRESCRIPTION = {
  rightSph: -1.5,
  rightCyl: -0.75,
  rightAxis: 90,
  leftSph: -2.0,
  leftCyl: -0.5,
  leftAxis: 85,
  pd: 64,
  type: 'DISTANCE',
};

const VALID_ORDER = {
  frameDescription: 'Black metal frame, model XX-2034, size 52-18-140',
  lensType: 'Single Vision CR-39',
  coatings: 'Anti-reflective',
  totalAmount: '8500.00',
  prescription: VALID_PRESCRIPTION,
};

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ownerToken: string;
  let workerToken: string;
  let testCustomerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up from previous runs
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.customer.deleteMany({});

    const ownerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'owner', password: 'owner123' });
    ownerToken = ownerRes.body.token;

    const workerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'worker', password: 'worker123' });
    workerToken = workerRes.body.token;

    // Create a customer to attach orders to
    const custRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Ali Khan', contact: '0300-1234567' });
    testCustomerId = custRes.body.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.customer.deleteMany({});
    await app.close();
  });

  // ─── POST /orders ───────────────────────────────────────────────────────────

  describe('POST /orders', () => {
    it('201 — creates order with nested prescription and returns order number', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toMatch(/^ORD-\d{4}-\d{4}$/);
      expect(res.body.status).toBe('CREATED');
      expect(res.body.totalAmount).toBe('8500.00');
      expect(res.body.prescription).toBeDefined();
      expect(res.body.prescription.pd).toBe(64);
      expect(res.body.totalPaid).toBe('0.00');
      expect(res.body.balanceDue).toBe('8500.00');
      expect(res.body.isPaidInFull).toBe(false);
    });

    it('400 — rejects invalid SPH (out of range)', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...VALID_ORDER,
          customerId: testCustomerId,
          prescription: { ...VALID_PRESCRIPTION, rightSph: -25 },
        })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('400 — rejects CYL set without AXIS', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...VALID_ORDER,
          customerId: testCustomerId,
          prescription: { ...VALID_PRESCRIPTION, rightCyl: -0.5, rightAxis: undefined },
        })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('400 — rejects missing PD', async () => {
      const { pd: _pd, ...noPd } = VALID_PRESCRIPTION;
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId, prescription: noPd })
        .expect(400);
    });

    it('401 — rejects request without auth', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ ...VALID_ORDER, customerId: testCustomerId })
        .expect(401);
    });
  });

  // ─── GET /orders ────────────────────────────────────────────────────────────

  describe('GET /orders', () => {
    it('200 — returns paginated list', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('200 — search by customer name returns matching', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders?q=Ali')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      expect(
        res.body.items.every((o: any) =>
          o.customer.name.toLowerCase().includes('ali') ||
          o.orderNumber.toLowerCase().includes('ali'),
        ),
      ).toBe(true);
    });

    it('200 — filter by status returns only that status', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders?status=CREATED')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.items.every((o: any) => o.status === 'CREATED')).toBe(true);
    });

    it('401 — rejects unauthenticated request', async () => {
      await request(app.getHttpServer()).get('/orders').expect(401);
    });
  });

  // ─── GET /orders/:id ─────────────────────────────────────────────────────────

  describe('GET /orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      orderId = res.body.id;
    });

    it('200 — returns order with prescription, customer, payments, and balance fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.id).toBe(orderId);
      expect(res.body.prescription).toBeDefined();
      expect(res.body.customer).toBeDefined();
      expect(res.body.payments).toBeDefined();
      expect(res.body.totalPaid).toBeDefined();
      expect(res.body.balanceDue).toBeDefined();
      expect(res.body.isPaidInFull).toBeDefined();
    });

    it('404 — returns 404 for unknown order', async () => {
      await request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /orders/:id ───────────────────────────────────────────────────────

  describe('PATCH /orders/:id', () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      orderId = res.body.id;
    });

    it('200 — WORKER can update frame description', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ frameDescription: 'Updated frame description' })
        .expect(200);

      expect(res.body.frameDescription).toBe('Updated frame description');
    });

    it('200 — WORKER frame description update persists on GET', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ frameDescription: 'Persisted frame update' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(200);

      expect(res.body.frameDescription).toBe('Persisted frame update');
    });

    it('400 — rejects totalAmount = -1 (negative not allowed)', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ totalAmount: '-1.00' })
        .expect(400);
    });

    it('200 — PATCH with nested prescription updates order and prescription atomically; GET confirms persistence', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      const freshId = createRes.body.id;

      const patchRes = await request(app.getHttpServer())
        .patch(`/orders/${freshId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          frameDescription: 'Patched frame for rx-test',
          prescription: { rightSph: -2.75, pd: 65 },
        })
        .expect(200);

      expect(patchRes.body.frameDescription).toBe('Patched frame for rx-test');
      expect(parseFloat(patchRes.body.prescription.rightSph)).toBeCloseTo(-2.75);
      expect(patchRes.body.prescription.pd).toBe(65);

      const getRes = await request(app.getHttpServer())
        .get(`/orders/${freshId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(getRes.body.frameDescription).toBe('Patched frame for rx-test');
      expect(parseFloat(getRes.body.prescription.rightSph)).toBeCloseTo(-2.75);
      expect(getRes.body.prescription.pd).toBe(65);
    });
  });

  // ─── PATCH /orders/:id/status ────────────────────────────────────────────────

  describe('PATCH /orders/:id/status', () => {
    let orderId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      orderId = res.body.id;
    });

    it('200 — WORKER can advance status forward', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('403 — WORKER cannot roll back status', async () => {
      // First advance to IN_PROGRESS
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'IN_PROGRESS' });

      // Now try to roll back as WORKER
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ status: 'CREATED' })
        .expect(403);
    });

    it('200 — OWNER can roll back status', async () => {
      // Advance to IN_PROGRESS
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'IN_PROGRESS' });

      // Roll back as OWNER
      const res = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'CREATED' })
        .expect(200);

      expect(res.body.status).toBe('CREATED');
    });
  });

  // ─── DELETE /orders/:id ──────────────────────────────────────────────────────

  describe('DELETE /orders/:id', () => {
    it('403 — WORKER cannot delete order', async () => {
      const create = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });

      await request(app.getHttpServer())
        .delete(`/orders/${create.body.id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });

    it('204 — OWNER can delete order; prescription + payments cascade-deleted', async () => {
      const create = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      const orderId = create.body.id;
      const prescriptionId = create.body.prescription.id;

      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);

      // Verify cascade: prescription is gone
      const rx = await prisma.prescription.findUnique({ where: { id: prescriptionId } });
      expect(rx).toBeNull();
    });
  });

  // ─── Customer delete restriction ─────────────────────────────────────────────

  describe('Cannot delete customer with orders', () => {
    it('409 — deleting customer who has orders returns Conflict', async () => {
      const custRes = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Delete Restricted', contact: '0300-9999999' });
      const restrictedCustomerId = custRes.body.id;

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: restrictedCustomerId });

      await request(app.getHttpServer())
        .delete(`/customers/${restrictedCustomerId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(409);
    });
  });

  // ─── POST /orders/:id/payments ───────────────────────────────────────────────

  describe('Payments', () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      orderId = res.body.id;
    });

    it('201 — record payment; balanceDue updates correctly', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: '3000.00', method: 'CASH', note: 'Advance' })
        .expect(201);

      expect(payRes.body.id).toBeDefined();
      expect(payRes.body.amount).toBe('3000.00');

      const orderRes = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(orderRes.body.totalPaid).toBe('3000.00');
      expect(orderRes.body.balanceDue).toBe('5500.00');
      expect(orderRes.body.isPaidInFull).toBe(false);
    });

    it('403 — WORKER cannot delete a payment', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: '500.00', method: 'CASH' });

      await request(app.getHttpServer())
        .delete(`/orders/${orderId}/payments/${payRes.body.id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .expect(403);
    });

    it('204 — OWNER can delete a payment', async () => {
      const payRes = await request(app.getHttpServer())
        .post(`/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: '200.00', method: 'CARD' });

      await request(app.getHttpServer())
        .delete(`/orders/${orderId}/payments/${payRes.body.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);
    });

    it('201 — full payment sets isPaidInFull to true', async () => {
      // Create a fresh order for this test
      const freshOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...VALID_ORDER,
          totalAmount: '1000.00',
          customerId: testCustomerId,
        });

      await request(app.getHttpServer())
        .post(`/orders/${freshOrder.body.id}/payments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ amount: '1000.00', method: 'CASH' });

      const res = await request(app.getHttpServer())
        .get(`/orders/${freshOrder.body.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.isPaidInFull).toBe(true);
      expect(res.body.balanceDue).toBe('0.00');
    });
  });

  // ─── Order number generation ─────────────────────────────────────────────────

  describe('Order number generation', () => {
    it('produces sequential ORD-YYYY-NNNN strings', async () => {
      // Three back-to-back creates must produce strictly incrementing numbers
      const res1 = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      const res2 = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });
      const res3 = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ...VALID_ORDER, customerId: testCustomerId });

      const nums = [res1.body.orderNumber, res2.body.orderNumber, res3.body.orderNumber];
      nums.forEach((n) => expect(n).toMatch(/^ORD-\d{4}-\d{4}$/));

      const seqNums = nums.map((n) => parseInt(n.split('-')[2], 10));
      expect(seqNums[1]).toBe(seqNums[0] + 1);
      expect(seqNums[2]).toBe(seqNums[1] + 1);
    });
  });
});
