import { Router } from 'express';
import { asyncRoute } from '../../middleware/errors.js';
import { exchangeRatePort } from '../../../infrastructure/container.js';

export const ratesRouter = Router();

ratesRouter.get('/bcv', asyncRoute(async (_request, response) => {
  response.json(await exchangeRatePort.getRate());
}));
