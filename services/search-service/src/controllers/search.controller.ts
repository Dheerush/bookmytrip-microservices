import { Request, RequestHandler, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { aggregateSearch } from '../services/aggregate.service';
import { AggregateSearchQuery } from '../validators/search.validators';

export const aggregateSearchHandler: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await aggregateSearch(req.query as unknown as AggregateSearchQuery);
  res.status(200).json(apiResponse(result, 'Aggregate search fetched successfully'));
});
