export type UserRole = 'user' | 'vendor' | 'admin';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface ITravelerDoc {
  _id?: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: Date;
  nationality: string;
  passportNumber?: string;
  passportExpiryDate?: Date;
}

export interface IAddressDoc {
  _id?: string;
  label: string;           // e.g. "Home", "Office"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}
