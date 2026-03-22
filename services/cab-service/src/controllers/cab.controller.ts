import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { CreateCabDto, SearchCabsQuery, UpdateCabDto } from '../validators/cab.validators';
import { createCab, deleteCab, getCabById, listAllCabs, searchCabs, updateCab } from '../services/cab.service';

export const searchCabsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchCabs(req.query as unknown as SearchCabsQuery);
  res.status(200).json(apiResponse(result, 'Cabs fetched successfully'));
});

export const getCabByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const cab = await getCabById(req.params.cabId);
  res.status(200).json(apiResponse(cab, 'Cab details fetched'));
});

export const listAllCabsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const result = await listAllCabs(page, limit);
  res.status(200).json(apiResponse(result, 'All cabs listed'));
});

export const createCabHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const cab = await createCab(req.body as CreateCabDto);
  res.status(201).json(apiResponse(cab, 'Cab created'));
});

export const updateCabHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const cab = await updateCab(req.params.cabId, req.body as UpdateCabDto);
  res.status(200).json(apiResponse(cab, 'Cab updated'));
});

export const deleteCabHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteCab(req.params.cabId);
  res.status(200).json(apiResponse(null, 'Cab deactivated'));
});
