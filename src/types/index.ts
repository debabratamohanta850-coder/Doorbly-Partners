export type PartnerStatus = 
  | 'incomplete' 
  | 'pending_verification' 
  | 'approved' 
  | 'rejected' 
  | 'suspended';

export type MembershipStatus = 'active' | 'expired' | 'pending' | 'inactive';

export interface PartnerKYC {
  documentType: 'aadhaar' | 'pan';
  documentNumber: string;
  documentImageUrl?: string;
  bankAccount: string;
  ifsc: string;
  accountHolder: string;
  certificateUrls: string[];
  submittedAt?: string;
}

export interface PartnerProfile {
  id: string;
  auth_id: string;
  name: string;
  mobile: string;
  email: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  photo_url?: string;
  address: string;
  district: string;
  city: string;
  pin_code: string;
  primary_category: string;
  services_offered: string[];
  years_experience: number;
  skills: string[];
  working_area: string;
  preferred_radius_km: number;
  languages: string[];
  status: PartnerStatus;
  status_reason?: string;
  is_online: boolean;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerMembership {
  id: string;
  partner_id: string;
  plan_name: string;
  monthly_fee: number; // 370
  status: MembershipStatus;
  start_date?: string;
  expiry_date?: string;
  payment_status: 'paid' | 'pending' | 'failed';
  payment_reference?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  serviceCount?: number;
}

export interface ServiceCatalogItem {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  base_customer_price: number;
  base_partner_earning: number;
  estimated_duration_text: string;
}

export type BookingStatus = 
  | 'SEARCHING_PARTNER'
  | 'REQUEST_SENT'
  | 'ASSIGNED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceBooking {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_category: string;
  service_name: string;
  service_description: string;
  customer_location_address: string;
  customer_address?: string;
  latitude: number;
  longitude: number;
  customer_latitude?: number;
  customer_longitude?: number;
  distance_km?: number;
  booking_date: string;
  booking_time: string;
  estimated_duration: string;
  customer_price: number;
  partner_earning: number;
  status: BookingStatus;
  assigned_partner_id?: string;
  otp_code?: string;
  notes?: string;
  additional_services?: Array<{
    name: string;
    price: number;
    partner_earning: number;
  }>;
  work_notes?: string[];
  photos?: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface JobRequestAlert {
  booking: ServiceBooking;
  request_id: string;
  expires_in_seconds: number;
  expires_at: number; // timestamp
}

export interface WalletSummary {
  available_balance: number;
  pending_amount: number;
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
  today_completed_jobs: number;
  total_completed_jobs: number;
}

export interface WalletTransaction {
  id: string;
  partner_id: string;
  booking_id?: string;
  type: 'credit' | 'debit';
  category: 'job_earning' | 'withdrawal' | 'membership_fee' | 'adjustment' | 'bonus';
  amount: number;
  balance_after: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  partner_id: string;
  amount: number;
  bank_account: string;
  ifsc: string;
  account_holder: string;
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'rejected';
  rejection_reason?: string;
  requested_at: string;
  processed_at?: string;
}

export type NotificationType =
  | 'NEW_SERVICE_REQUEST'
  | 'JOB_ACCEPTED'
  | 'JOB_CANCELLED'
  | 'CUSTOMER_UPDATE'
  | 'SERVICE_REMINDER'
  | 'PAYMENT_UPDATE'
  | 'WALLET_CREDIT'
  | 'WITHDRAWAL_UPDATE'
  | 'MEMBERSHIP_EXPIRY'
  | 'ACCOUNT_VERIFICATION'
  | 'DOCUMENT_EXPIRY'
  | 'DOORBLY_ANNOUNCEMENT';

export interface NotificationItem {
  id: string;
  partner_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export type SupportCategory =
  | 'Active Job Issue'
  | 'Payment Issue'
  | 'Wallet Issue'
  | 'Customer Issue'
  | 'Service Issue'
  | 'Account Issue'
  | 'Technical Issue'
  | 'Membership Issue'
  | 'Other';

export interface SupportTicket {
  id: string;
  partner_id: string;
  booking_id?: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export interface OfferOfTheDay {
  id: string;
  title: string;
  description: string;
  reward_badge: string;
  valid_until: string;
  is_active: boolean;
  updated_at: string;
}

