/**
 * User entity type
 * Represents a user account on the platform
 */
export interface User {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  bio?: string;
  avatar_asset_id?: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User creation input
 */
export interface CreateUserInput {
  handle: string;
  display_name: string;
  email: string;
  password: string;
  bio?: string;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  display_name?: string;
  bio?: string;
  avatar_asset_id?: string;
}
