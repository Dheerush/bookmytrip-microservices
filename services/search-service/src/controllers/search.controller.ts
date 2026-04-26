import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { aggregateSearch } from '../services/aggregate.service';
import { adminGlobalSearch } from '../services/admin-global-search.service';
import { AdminGlobalSearchQuery, AggregateSearchQuery } from '../validators/search.validators';

export const aggregateSearchHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await aggregateSearch(req.query as unknown as AggregateSearchQuery);
  res.status(200).json(apiResponse(result, 'Aggregate search fetched successfully'));
});

export const adminGlobalSearchHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminGlobalSearch(
    req.query as unknown as AdminGlobalSearchQuery,
    req.headers.authorization,
  );
  res.status(200).json(apiResponse(result, 'Admin global search fetched successfully'));
});
