export interface AuthUser {
  userId: number;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest {
  user: AuthUser;
}