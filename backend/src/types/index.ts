import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SessionCreateData {
  seniorId: string;
  scheduledAt?: Date;
  price?: number;
}

export interface CodeSubmissionData {
  title: string;
  description: string;
  language: string;
  framework?: string;
  codeContent: string;
  errorDescription?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  tags: string[];
}

export interface MessageData {
  receiverId: string;
  content: string;
  sessionId?: string;
  messageType?: string;
}

export interface ReviewData {
  sessionId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}
