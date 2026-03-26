import { Types } from 'mongoose';
import { UserProfile, IUserProfile } from '../models/UserProfile';
import { AppError } from '../utils/AppError';
import { publishEvent } from '../config/rabbitmq';
import { UserRole } from '../types/user.types';

type ProfileUpdate = Partial<Pick<IUserProfile,
  'fullName' | 'phone' | 'avatarUrl' | 'gender' | 'dateOfBirth' | 'nationality'
>>;

export const profileService = {
  async provisionFromVerifiedUser(data: {
    authId: string;
    email: string;
    fullName: string;
    role?: string;
  }): Promise<IUserProfile> {
    const profile = await this.getOrCreate(data.authId, {
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    });

    if (data.role && profile.role !== data.role) {
      profile.role = data.role as UserRole;
      await profile.save();
    }

    if (profile.travelers.length === 0) {
      const parts = data.fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] || data.email.split('@')[0] || 'Traveler';
      const lastName = parts.slice(1).join(' ') || 'Self';

      profile.travelers.push({
        firstName,
        lastName,
        gender: 'prefer_not_to_say',
        dateOfBirth: new Date('1970-01-01'),
        nationality: 'Unknown',
      } as any);
      await profile.save();
    }

    return profile;
  },

  /**
   * Get profile by authId.
   * Creates a minimal profile on first access (lazy provision pattern).
   */
  async getOrCreate(authId: string, seed?: { email: string; fullName: string; role?: string }): Promise<IUserProfile> {
    let profile = await UserProfile.findOne({ authId });

    if (!profile) {
      if (!seed) {
        throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
      }
      profile = await UserProfile.create({
        authId,
        email:    seed.email,
        fullName: seed.fullName,
        role:     seed.role || 'user',
      });
    } else if (seed) {
      let isDirty = false;

      if (seed.email && profile.email !== seed.email) {
        profile.email = seed.email;
        isDirty = true;
      }

      if (seed.fullName && profile.fullName !== seed.fullName) {
        profile.fullName = seed.fullName;
        isDirty = true;
      }

      if (seed.role && profile.role !== seed.role) {
        profile.role = seed.role as any;
        isDirty = true;
      }

      if (isDirty) {
        await profile.save();
      }
    }

    return profile;
  },

  async getByAuthId(authId: string): Promise<IUserProfile> {
    const profile = await UserProfile.findOne({ authId });
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  async updateProfile(authId: string, updates: ProfileUpdate): Promise<IUserProfile> {
    const profile = await UserProfile.findOneAndUpdate(
      { authId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  // ── Traveler management ─────────────────────────────────────────────────

  async addTraveler(authId: string, data: object): Promise<IUserProfile> {
    const profile = await UserProfile.findOneAndUpdate(
      { authId },
      { $push: { travelers: data } },
      { new: true, runValidators: true },
    );
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  async updateTraveler(authId: string, travelerId: string, data: object): Promise<IUserProfile> {
    if (!Types.ObjectId.isValid(travelerId)) {
      throw new AppError('Invalid traveler id', 400, 'INVALID_ID');
    }

    const setFields = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [`travelers.$.${k}`, v]),
    );

    const profile = await UserProfile.findOneAndUpdate(
      { authId, 'travelers._id': new Types.ObjectId(travelerId) },
      { $set: setFields },
      { new: true, runValidators: true },
    );
    if (!profile) throw new AppError('Traveler not found', 404, 'TRAVELER_NOT_FOUND');
    return profile;
  },

  async deleteTraveler(authId: string, travelerId: string): Promise<IUserProfile> {
    if (!Types.ObjectId.isValid(travelerId)) {
      throw new AppError('Invalid traveler id', 400, 'INVALID_ID');
    }

    const profile = await UserProfile.findOneAndUpdate(
      { authId },
      { $pull: { travelers: { _id: new Types.ObjectId(travelerId) } } },
      { new: true },
    );
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  // ── Address management ──────────────────────────────────────────────────

  async addAddress(authId: string, data: object & { isDefault?: boolean }): Promise<IUserProfile> {
    let profile = await UserProfile.findOne({ authId });
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');

    // If new address is marked default, unset existing defaults first
    if ((data as any).isDefault) {
      profile.addresses.forEach((a) => { a.isDefault = false; });
    }

    profile.addresses.push(data as any);
    await profile.save();
    return profile;
  },

  async updateAddress(authId: string, addressId: string, data: object): Promise<IUserProfile> {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new AppError('Invalid address id', 400, 'INVALID_ID');
    }

    const profile = await UserProfile.findOne({ authId });
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');

    const address = profile.addresses.find((a) => a._id?.toString() === addressId);
    if (!address) throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');

    // If setting this as default, unset all others
    if ((data as any).isDefault) {
      profile.addresses.forEach((a) => { a.isDefault = false; });
    }

    Object.assign(address, data);
    await profile.save();
    return profile;
  },

  async deleteAddress(authId: string, addressId: string): Promise<IUserProfile> {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new AppError('Invalid address id', 400, 'INVALID_ID');
    }

    const profile = await UserProfile.findOneAndUpdate(
      { authId },
      { $pull: { addresses: { _id: new Types.ObjectId(addressId) } } },
      { new: true },
    );
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  // ── Preferences ─────────────────────────────────────────────────────────

  async updatePreferences(authId: string, data: object): Promise<IUserProfile> {
    const setFields = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [`preferences.${k}`, v]),
    );

    const profile = await UserProfile.findOneAndUpdate(
      { authId },
      { $set: setFields },
      { new: true, runValidators: true },
    );
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  // ── Admin lookup ─────────────────────────────────────────────────────────

  async getByIdForAdmin(profileId: string): Promise<IUserProfile> {
    if (!Types.ObjectId.isValid(profileId)) {
      throw new AppError('Invalid profile id', 400, 'INVALID_ID');
    }
    const profile = await UserProfile.findById(profileId);
    if (!profile) throw new AppError('User profile not found', 404, 'PROFILE_NOT_FOUND');
    return profile;
  },

  async publishProfileUpdated(profile: IUserProfile): Promise<void> {
    await publishEvent({
      type: 'user.profile_updated',
      userId: profile.authId,
      email: profile.email,
      fullName: profile.fullName,
      timestamp: new Date().toISOString(),
    });
  },
};
