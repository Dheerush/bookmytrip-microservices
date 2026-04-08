import { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import {
  searchFlights,
  getFlightById,
  getFlightByCode,
  createFlight,
  updateFlight,
  deleteFlight,
  listAllFlights,
  deductFlightSeats,
} from '../services/flight.service';
import { SearchFlightsQuery, CreateFlightDto, UpdateFlightDto } from '../validators/flight.validators';
import { env } from '../config/env';

// ── Public ─────────────────────────────────────────────────────────────────────

export const searchFlightsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SearchFlightsQuery;
  const result = await searchFlights(query);
  res.status(200).json(apiResponse(result, 'Flights fetched successfully'));
});

export const getFlightByIdHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const flight = await getFlightById(req.params.flightId);
  res.status(200).json(apiResponse(flight, 'Flight details fetched'));
});

export const getFlightByCodeHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const flight = await getFlightByCode(req.params.flightCode);
  res.status(200).json(apiResponse(flight, 'Flight details fetched'));
});

// ── Admin ──────────────────────────────────────────────────────────────────────

export const listAllFlightsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const page  = parseInt(req.query.page  as string ?? '1',  10);
  const limit = parseInt(req.query.limit as string ?? '20', 10);
  const result = await listAllFlights(page, limit);
  res.status(200).json(apiResponse(result, 'All flights listed'));
});

export const createFlightHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const flight = await createFlight(req.body as CreateFlightDto);
  res.status(201).json(apiResponse(flight, 'Flight created'));
});

export const updateFlightHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const flight = await updateFlight(req.params.flightId, req.body as UpdateFlightDto);
  res.status(200).json(apiResponse(flight, 'Flight updated'));
});

export const deleteFlightHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteFlight(req.params.flightId);
  res.status(200).json(apiResponse(null, 'Flight deactivated'));
});

export const deductFlightSeatsHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const secret = req.headers['x-service-secret'];
  if (secret !== env.INTERNAL_SERVICE_SECRET) {
    res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' });
    return;
  }
  const { count } = req.body as { count?: number };
  if (!count || count < 1) {
    res.status(400).json({ success: false, message: 'count must be >= 1', code: 'VALIDATION_ERROR' });
    return;
  }
  await deductFlightSeats(req.params.flightId, count);
  res.status(200).json(apiResponse(null, 'Seats deducted'));
});
