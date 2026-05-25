export enum UserRole {
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  hourlyRate?: number;
  timezone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
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

export interface Session {
  id: string;
  juniorId: string;
  seniorId: string;
  status: 'PENDING' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  price?: number;
  sessionNotes?: string;
  createdAt: string;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  title: string;
  description: string;
  language: string;
  framework?: string;
  codeContent: string;
  errorDescription?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  tags: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sessionId?: string;
  content: string;
  messageType: 'text' | 'code' | 'file';
  isRead: boolean;
  createdAt: string;
}
