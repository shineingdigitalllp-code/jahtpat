import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from '@/config/env';
import { originGuard } from '@/middlewares/admin-auth';
import { errorHandler, notFound } from '@/middlewares/error';
import { adminRouter } from '@/modules/admin/routes';
import { authRouter } from '@/modules/auth/routes';
import { accountRouter } from '@/modules/account/routes';
import { catalogRouter } from '@/modules/catalog/routes';
import { offersRouter } from '@/modules/offers/routes';
import { ordersRouter } from '@/modules/orders/routes';
import { checkoutRouter } from '@/modules/checkout/routes';
import { paymentsRouter } from '@/modules/payments/routes';
import { addressesRouter } from '@/modules/addresses/routes';
import { geoRouter } from '@/modules/geo/routes';
import { storeRouter } from '@/modules/store/routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '30d' }));

app.use('/api/v1/admin', originGuard, adminRouter);
app.use('/api/v1/auth', authRouter);
app.use(
  '/api/v1',
  storeRouter,
  catalogRouter,
  offersRouter,
  ordersRouter,
  checkoutRouter,
  paymentsRouter,
  addressesRouter,
  geoRouter,
  accountRouter,
);

app.use(notFound);
app.use(errorHandler);

