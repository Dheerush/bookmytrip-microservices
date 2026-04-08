import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { CreateTrainDto, SearchTrainsQuery, UpdateTrainDto } from '../validators/train.validators';
import {
  createTrain,
  deleteTrain,
  deductTrainSeats,
  getTrainById,
  getTrainByNumber,
  listAllTrains,
  searchTrains,
  updateTrain,
} from '../services/train.service';
import { env } from '../config/env';

export const searchTrainsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchTrains(req.query as unknown as SearchTrainsQuery);
  res.status(200).json(apiResponse(result, 'Trains fetched successfully'));
});

export const getTrainByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const train = await getTrainById(req.params.trainId);
  res.status(200).json(apiResponse(train, 'Train details fetched'));
});

export const getTrainByNumberHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const train = await getTrainByNumber(req.params.trainNumber);
  res.status(200).json(apiResponse(train, 'Train details fetched'));
});

export const listAllTrainsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const result = await listAllTrains(page, limit);
  res.status(200).json(apiResponse(result, 'All trains listed'));
});

export const createTrainHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const train = await createTrain(req.body as CreateTrainDto);
  res.status(201).json(apiResponse(train, 'Train created'));
});

export const updateTrainHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const train = await updateTrain(req.params.trainId, req.body as UpdateTrainDto);
  res.status(200).json(apiResponse(train, 'Train updated'));
});

export const deleteTrainHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteTrain(req.params.trainId);
  res.status(200).json(apiResponse(null, 'Train deactivated'));
});

export const deductTrainSeatsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const secret = req.headers['x-service-secret'];
  if (secret !== env.INTERNAL_SERVICE_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' });
    return;
  }
  const { seatClass, count } = req.body as { seatClass?: string; count?: number };
  if (!seatClass || !count || count < 1) {
    res.status(400).json({ success: false, message: 'seatClass and count >= 1 are required', code: 'VALIDATION_ERROR' });
    return;
  }
  await deductTrainSeats(req.params.trainId, seatClass, count);
  res.status(200).json(apiResponse(null, 'Seats deducted'));
});
