/**
 * Session entity type
 * Represents an authenticated user session
 */
export interface Session {
  id: string;
  user_id: string;
  jwt_id: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string; // user_id
  jti: string; // jwt_id (session identifier)
  iat: number;
  exp: number;
}

/**
 * Authentication credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: {
    id: string;
    handle: string;
    display_name: string;
    email: string;
  };
  session: {
    id: string;
    expires_at: Date;
  };
}
