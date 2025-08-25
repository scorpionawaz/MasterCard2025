/**
 * Shared types between client and server for the donation platform
 */

// User roles
export type UserRole = 'donor' | 'receiver' | 'admin';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'createdAt' | 'updatedAt'>;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'createdAt' | 'updatedAt'>;
  token?: string;
}

// Categories
export type ItemCategory = 'clothes' | 'books' | 'food' | 'furniture' | 'electronics' | 'toys' | 'medical' | 'other';

// Donation types
export interface Donation {
  id: string;
  donorId: string;
  itemName: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'matched' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationRequest {
  itemName: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  photoUrl?: string;
}

export interface CreateDonationResponse {
  success: boolean;
  message: string;
  donation?: Donation;
}

// Request/Need types
export interface Request {
  id: string;
  receiverId: string;
  itemNeeded: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  urgency: 'normal' | 'urgent';
  status: 'pending' | 'approved' | 'matched' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestRequest {
  itemNeeded: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  urgency: 'normal' | 'urgent';
}

export interface CreateRequestResponse {
  success: boolean;
  message: string;
  request?: Request;
}

// Match types
export interface Match {
  id: string;
  donationId: string;
  requestId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchRequest {
  donationId: string;
  requestId: string;
}

export interface CreateMatchResponse {
  success: boolean;
  message: string;
  match?: Match;
}

// Admin types
export interface AdminDonationsResponse {
  success: boolean;
  donations: (Donation & { donorName: string; donorEmail: string })[];
}

export interface AdminRequestsResponse {
  success: boolean;
  requests: (Request & { receiverName: string; receiverEmail: string })[];
}

export interface ApprovalRequest {
  id: string;
  action: 'approve' | 'reject';
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
}

// Generic API response
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * Example response type for /api/demo (legacy - can be removed)
 */
export interface DemoResponse {
  message: string;
}
