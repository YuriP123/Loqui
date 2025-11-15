// Generation API endpoints

import { apiGet, apiPost, apiDelete } from '../api-client';
import type { CreateGenerationRequest, GeneratedAudio, GenerationStatus, GenerationListResponse } from '../api-types';

/**
 * Create a new voice generation request
 * POST /api/generation/create
 */
export async function createGeneration(data: CreateGenerationRequest): Promise<GeneratedAudio> {
  return apiPost<GeneratedAudio>('/api/generation/create', data);
}

/**
 * Check generation status
 * GET /api/generation/status/{id}
 */
export async function getGenerationStatus(id: number): Promise<GenerationStatus> {
  return apiGet<GenerationStatus>(`/api/generation/status/${id}`, { cacheTtlMs: 2000, dedupeKey: `gen-status-${id}` });
}

/**
 * List all user's generations
 * GET /api/generation/
 */
export async function listGenerations(): Promise<GenerationListResponse> {
  // Cache for short period and de-duplicate
  return apiGet<GenerationListResponse>('/api/generation/', { cacheTtlMs: 5000, dedupeKey: 'gen-list' });
}

/**
 * Get a specific generation by ID
 * GET /api/generation/{id}
 */
export async function getGeneration(id: number): Promise<GeneratedAudio> {
  return apiGet<GeneratedAudio>(`/api/generation/${id}`, { cacheTtlMs: 10000, dedupeKey: `gen-${id}` });
}

/**
 * Delete a generation
 * DELETE /api/generation/{id}
 */
export async function deleteGeneration(id: number): Promise<void> {
  return apiDelete<void>(`/api/generation/${id}`);
}

