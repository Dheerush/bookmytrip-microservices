import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { CreateTrainDto, SearchTrainsQuery, UpdateTrainDto } from '../validators/train.validators';
import {
  createTrain,
  deleteTrain,
  getTrainById,
  getTrainByNumber,
  listAllTrains,
  searchTrains,
  updateTrain,
} from '../services/train.service';

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
