// Audio Samples API endpoints

import { apiGet, apiPost, apiDelete } from '../api-client';
import type { AudioSample, UploadSampleRequest, AudioSampleListResponse } from '../api-types';

/**
 * Upload a new audio sample
 * POST /api/samples/upload
 */
export async function uploadSample(data: UploadSampleRequest): Promise<AudioSample> {
  const formData = new FormData();
  formData.append('sample_name', data.sample_name);
  formData.append('upload_type', data.upload_type);
  formData.append('file', data.file);

  return apiPost<AudioSample>('/api/samples/upload', formData);
}

/**
 * List all user's audio samples
 * GET /api/samples/
 */
export async function listSamples(): Promise<AudioSampleListResponse> {
  return apiGet<AudioSampleListResponse>('/api/samples/', { cacheTtlMs: 5000, dedupeKey: 'samples-list' });
}

/**
 * Get a specific audio sample by ID
 * GET /api/samples/{id}
 */
export async function getSample(id: number): Promise<AudioSample> {
  return apiGet<AudioSample>(`/api/samples/${id}`, { cacheTtlMs: 10000, dedupeKey: `sample-${id}` });
}

/**
 * Delete an audio sample
 * DELETE /api/samples/{id}
 */
export async function deleteSample(id: number): Promise<void> {
  return apiDelete<void>(`/api/samples/${id}`);
}

