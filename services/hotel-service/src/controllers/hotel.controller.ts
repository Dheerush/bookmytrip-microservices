import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { CreateHotelDto, SearchHotelsQuery, UpdateHotelDto } from '../validators/hotel.validators';
import { createHotel, deleteHotel, getHotelById, listAllHotels, searchHotels, updateHotel } from '../services/hotel.service';

export const searchHotelsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchHotels(req.query as unknown as SearchHotelsQuery);
  res.status(200).json(apiResponse(result, 'Hotels fetched successfully'));
});

export const getHotelByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await getHotelById(req.params.hotelId);
  res.status(200).json(apiResponse(hotel, 'Hotel details fetched'));
});

export const listAllHotelsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) ?? '1', 10);
  const limit = parseInt((req.query.limit as string) ?? '20', 10);
  const result = await listAllHotels(page, limit);
  res.status(200).json(apiResponse(result, 'All hotels listed'));
});

export const createHotelHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await createHotel(req.body as CreateHotelDto);
  res.status(201).json(apiResponse(hotel, 'Hotel created'));
});

export const updateHotelHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await updateHotel(req.params.hotelId, req.body as UpdateHotelDto);
  res.status(200).json(apiResponse(hotel, 'Hotel updated'));
});

export const deleteHotelHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteHotel(req.params.hotelId);
  res.status(200).json(apiResponse(null, 'Hotel deactivated'));
});
