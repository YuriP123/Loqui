// ============================================================================
// API Response Types - Matching Backend Schemas
// ============================================================================

// Authentication Types
export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Audio Sample Types
export interface AudioSample {
  sample_id: number;
  user_id: number;
  sample_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  duration_seconds: number;
  upload_type: "uploaded" | "recorded";
  uploaded_at: string;
}

export interface AudioSampleUploadRequest {
  sample_name: string;
  upload_type: "uploaded" | "recorded";
  file: File;
}

export interface AudioSamplesResponse {
  samples: AudioSample[];
  total: number;
}

// Generation Types
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface GeneratedAudio {
  audio_id: number;
  user_id: number;
  sample_id: number;
  model_name: string;
  script_text: string;
  output_file_path: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  status: GenerationStatus;
  generated_at: string;
  completed_at: string | null;
}

export interface GenerationCreateRequest {
  sample_id: number;
  model_name: string;
  script_text: string;
}

export interface GenerationStatusResponse {
  audio_id: number;
  status: GenerationStatus;
  progress: number;
  message: string;
  estimated_time_remaining?: number;
  retry_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface GenerationsResponse {
  generations: GeneratedAudio[];
  total: number;
}

// Library Types
export interface LibraryItem {
  id: number;
  item_type: "sample" | "generated";
  name: string;
  file_path: string;
  file_size: number | null;
  duration_seconds: number | null;
  created_at: string;
  status?: string;
}

export interface LibraryResponse {
  items: LibraryItem[];
  total: number;
  samples_count: number;
  generated_count: number;
}

// API Error Response
export interface ApiError {
  detail: string | Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// Generic API Response
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

