import { Request, Response } from 'express';
import { profileService } from '../services/profile.service';
import { apiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const requireUser = (req: Request): string => {
  if (!req.user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.user.id;
};

export const profileController = {

  // ── GET /users/me ─────────────────────────────────────────────────────
  getMe: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.getOrCreate(authId, {
      email:    req.user?.email || '',
      fullName: '',
    });
    res.status(200).json(apiResponse(profile, 'Profile fetched'));
  },

  // ── PATCH /users/me ───────────────────────────────────────────────────
  updateMe: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.updateProfile(authId, req.body);
    await profileService.publishProfileUpdated(profile).catch(() => { /* non-critical */ });
    res.status(200).json(apiResponse(profile, 'Profile updated'));
  },

  // ── GET /users/me/travelers ───────────────────────────────────────────
  getTravelers: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.getByAuthId(authId);
    res.status(200).json(apiResponse(profile.travelers, 'Travelers fetched'));
  },

  // ── POST /users/me/travelers ──────────────────────────────────────────
  addTraveler: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.addTraveler(authId, req.body);
    res.status(201).json(apiResponse(profile.travelers, 'Traveler added'));
  },

  // ── PATCH /users/me/travelers/:travelerId ─────────────────────────────
  updateTraveler: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.updateTraveler(authId, req.params.travelerId, req.body);
    res.status(200).json(apiResponse(profile.travelers, 'Traveler updated'));
  },

  // ── DELETE /users/me/travelers/:travelerId ────────────────────────────
  deleteTraveler: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.deleteTraveler(authId, req.params.travelerId);
    res.status(200).json(apiResponse(profile.travelers, 'Traveler deleted'));
  },

  // ── GET /users/me/addresses ───────────────────────────────────────────
  getAddresses: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.getByAuthId(authId);
    res.status(200).json(apiResponse(profile.addresses, 'Addresses fetched'));
  },

  // ── POST /users/me/addresses ──────────────────────────────────────────
  addAddress: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.addAddress(authId, req.body);
    res.status(201).json(apiResponse(profile.addresses, 'Address added'));
  },

  // ── PATCH /users/me/addresses/:addressId ──────────────────────────────
  updateAddress: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.updateAddress(authId, req.params.addressId, req.body);
    res.status(200).json(apiResponse(profile.addresses, 'Address updated'));
  },

  // ── DELETE /users/me/addresses/:addressId ─────────────────────────────
  deleteAddress: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.deleteAddress(authId, req.params.addressId);
    res.status(200).json(apiResponse(profile.addresses, 'Address deleted'));
  },

  // ── GET /users/me/preferences ─────────────────────────────────────────
  getPreferences: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.getByAuthId(authId);
    res.status(200).json(apiResponse(profile.preferences, 'Preferences fetched'));
  },

  // ── PATCH /users/me/preferences ───────────────────────────────────────
  updatePreferences: async (req: Request, res: Response): Promise<void> => {
    const authId = requireUser(req);
    const profile = await profileService.updatePreferences(authId, req.body);
    res.status(200).json(apiResponse(profile.preferences, 'Preferences updated'));
  },

  // ── Admin: GET /users/:profileId  ─────────────────────────────────────
  getByIdAdmin: async (req: Request, res: Response): Promise<void> => {
    const profile = await profileService.getByIdForAdmin(req.params.profileId);
    res.status(200).json(apiResponse(profile, 'Profile fetched'));
  },
};
