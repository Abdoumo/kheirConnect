/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "admin" | "institution" | "donator";
  description?: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  role: string;
  name: string;
}

// Institution Types
export interface InstitutionData {
  _id: string;
  name: string;
  description: string;
  location: string;
  approved: boolean;
  createdAt: string;
}

export interface InstitutionResponse {
  institutions: InstitutionData[];
}

// User Types
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "institution" | "donator";
}
