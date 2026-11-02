import { Router } from 'express';
import { productQuerySchema } from '@jhatpat/shared';
import { validate } from '@/middlewares/validate';
import * as controller from './controller';

export const catalogRouter = Router();

catalogRouter.get('/home', controller.home);
catalogRouter.get('/categories', controller.categories);
catalogRouter.get('/categories/:slug', controller.category);
catalogRouter.get('/products/:slug', controller.product);
catalogRouter.get('/products', validate(productQuerySchema, 'query'), controller.products);
