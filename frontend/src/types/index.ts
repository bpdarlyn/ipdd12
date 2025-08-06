// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: UserInfo;
}

export interface UserInfo {
  username: string;
  email: string;
  attributes: Record<string, string>;
}

// Person types
export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string; // ISO date string
  phone: string;
  home_address: string;
  google_maps_link?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonCreate {
  first_name: string;
  last_name: string;
  birth_date: string; // ISO date string
  phone: string;
  home_address: string;
  google_maps_link?: string;
}

export interface PersonUpdate {
  first_name?: string;
  last_name?: string;
  birth_date?: string; // ISO date string
  phone?: string;
  home_address?: string;
  google_maps_link?: string;
}

// Report types
export enum ReportType {
  CELULA = 'celula',
  CULTO = 'culto'
}

export enum Currency {
  USD = 'USD',
  BOB = 'BOB'
}

export enum ParticipantType {
  MEMBER = 'MEMBER',
  VISITOR = 'VISITOR',
  PARTICIPANT = 'PARTICIPANT'
}

export enum Periodicity {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  DAILY = 'DAILY'
}

export interface RecurringMeeting {
  id: number;
  meeting_datetime: string; // ISO datetime string
  leader_person_id: number;
  report_type: ReportType;
  location: string;
  description?: string;
  periodicity: Periodicity;
  google_maps_link?: string;
  created_at: string;
  updated_at: string;
  leader?: Person;
  reports?: Report[];
}

export interface Report {
  id: number;
  registration_date: string; // ISO datetime string
  meeting_datetime: string; // ISO datetime string
  recurring_meeting_id: number;
  leader_person_id: number;
  leader_phone: string;
  collaborator?: string;
  location: string;
  collection_amount: number | string; // Can come as string from API
  currency: Currency;
  attendees_count: number;
  google_maps_link?: string;
  created_at: string;
  updated_at: string;
  recurring_meeting?: RecurringMeeting;
  leader?: Person;
  participants: ReportParticipant[];
  attachments: ReportAttachment[];
}

export interface ReportCreate {
  registration_date: string; // ISO datetime string
  meeting_datetime: string; // ISO datetime string
  recurring_meeting_id: number;
  leader_person_id: number;
  leader_phone: string;
  collaborator?: string;
  location: string;
  collection_amount: number;
  currency: Currency;
  attendees_count: number;
  google_maps_link?: string;
  participants: ReportParticipantCreate[];
}

export interface ReportUpdate {
  registration_date?: string; // ISO datetime string
  meeting_datetime?: string; // ISO datetime string
  recurring_meeting_id?: number;
  leader_person_id?: number;
  leader_phone?: string;
  collaborator?: string;
  location?: string;
  collection_amount?: number;
  currency?: Currency;
  attendees_count?: number;
  google_maps_link?: string;
  participants?: ReportParticipantCreate[];
}

export interface ReportParticipant {
  id: number;
  report_id: number;
  participant_name: string;
  participant_type: ParticipantType;
  created_at: string;
  updated_at: string;
}

export interface ReportParticipantCreate {
  participant_name: string;
  participant_type: ParticipantType;
}

export interface ReportAttachment {
  id: number;
  report_id: number;
  file_name: string;
  file_key: string;
  file_size: number;
  content_type: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// Recurring Meeting types (defined after Report to avoid circular references)

export interface RecurringMeetingCreate {
  meeting_datetime: string; // ISO datetime string
  leader_person_id: number;
  report_type: ReportType;
  location: string;
  description?: string;
  periodicity: Periodicity;
  google_maps_link?: string;
}

export interface RecurringMeetingUpdate {
  meeting_datetime?: string; // ISO datetime string
  leader_person_id?: number;
  report_type?: ReportType;
  location?: string;
  description?: string;
  periodicity?: Periodicity;
  google_maps_link?: string;
}