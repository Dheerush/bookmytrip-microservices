import { UserRole, Permission } from '../types/auth.types';

export const rolePermissions: Record<UserRole, Permission[]> = {
  user: [
    'BOOK_TRIP'
  ],

  vendor: [
    'BOOK_TRIP',
    'CREATE_HOTEL',
    'UPDATE_HOTEL'
  ],

  admin: [
    'BOOK_TRIP',
    'CREATE_HOTEL',
    'UPDATE_HOTEL',
    'DELETE_HOTEL',
    'MANAGE_USERS',
    'VIEW_ANALYTICS'
  ]
};