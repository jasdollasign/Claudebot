export type UserRole = 'owner' | 'provider' | 'admin';
export type ServiceType = 'cleaning' | 'handyman' | 'landscaping' | 'pet_sitting' | 'home_check' | 'other';
export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'cabin' | 'other';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  providerProfile?: ProviderProfile;
}

export interface ProviderProfile {
  id: string;
  bio?: string;
  hourlyRate?: number;
  services: ServiceType[];
  serviceRadiusMiles: number;
  backgroundChecked: boolean;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  availability: Record<string, string[]>;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  notes?: string;
  accessInstructions?: string;
  isActive: boolean;
  totalBookings?: number;
  lastServiceDate?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  done: boolean;
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  providerId?: string;
  providerName?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerRating?: number;
  providerBio?: string;
  serviceType: ServiceType;
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  estimatedHours: number;
  price: number;
  specialInstructions?: string;
  accessInstructions?: string;
  checklist: ChecklistItem[];
  beforePhotos: string[];
  afterPhotos: string[];
  startedAt?: string;
  completedAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  providerPayout: number;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  qualityScore?: number;
  punctualityScore?: number;
  communicationScore?: number;
  reviewerName: string;
  serviceType: ServiceType;
  serviceDate: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  firstName?: string;
  lastName?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  hourlyRate?: number;
  services: ServiceType[];
  backgroundChecked: boolean;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  serviceRadiusMiles: number;
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  cleaning: 'Cleaning',
  handyman: 'Handyman',
  landscaping: 'Landscaping',
  pet_sitting: 'Pet Sitting',
  home_check: 'Home Check',
  other: 'Other',
};

export const SERVICE_ICONS: Record<ServiceType, string> = {
  cleaning: '🧹',
  handyman: '🔧',
  landscaping: '🌿',
  pet_sitting: '🐾',
  home_check: '🏠',
  other: '⚙️',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-orange-100 text-orange-800',
};
