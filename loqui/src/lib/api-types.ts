// Type definitions matching backend Pydantic schemas

export interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
  full_name?: string | null;
  is_active?: boolean;
}

export interface AudioSample {
  sample_id: number;
  user_id: number;
  sample_name: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  duration_seconds?: number;
  upload_type: 'uploaded' | 'recorded';
  uploaded_at: string;
}

export interface GeneratedAudio {
  audio_id: number;
  user_id: number;
  sample_id: number | null;
  model_name: string;
  script_text: string;
  output_file_path?: string | null;
  file_size?: number | null;
  duration_seconds?: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_at: string;
  completed_at?: string | null;
}

export interface LibraryItem {
  id: number;
  type: 'sample' | 'generated';
  name: string;
  file_path?: string;
  created_at: string;
  duration?: number;
  status?: string;
  script_text?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CreateGenerationRequest {
  sample_id: number;
  model_name: string;
  script_text: string;
}

export interface UploadSampleRequest {
  sample_name: string;
  upload_type: 'uploaded' | 'recorded';
  file: File;
}

export interface ApiError {
  detail: string;
}

export interface GenerationStatus {
  audio_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

// List wrapper responses from backend
export interface AudioSampleListResponse {
  samples: AudioSample[];
  total: number;
}

export interface GenerationListResponse {
  generations: GeneratedAudio[];
  total: number;
}

