// Library API endpoints

import { apiGet, apiDelete, apiDownload, API_BASE_URL } from '../api-client';
import type { LibraryItem } from '../api-types';

/**
 * Get all library items (samples + generated)
 * GET /api/library/all
 */
export async function getAllLibraryItems(): Promise<LibraryItem[]> {
  return apiGet<LibraryItem[]>('/api/library/all');
}

/**
 * Get samples only from library
 * GET /api/library/samples
 */
export async function getLibrarySamples(): Promise<LibraryItem[]> {
  return apiGet<LibraryItem[]>('/api/library/samples');
}

/**
 * Get generated audio only from library
 * GET /api/library/generated
 */
export async function getLibraryGenerated(): Promise<LibraryItem[]> {
  return apiGet<LibraryItem[]>('/api/library/generated');
}

/**
 * Download an audio file from library
 * GET /api/library/download/{type}/{id}
 */
export async function downloadLibraryItem(type: 'sample' | 'generated', id: number): Promise<Blob> {
  return apiDownload(`/api/library/download/${type}/${id}`);
}

/**
 * Get download URL for an audio file
 */
export function getDownloadUrl(type: 'sample' | 'generated', id: number): string {
  return `${API_BASE_URL}/api/library/download/${type}/${id}`;
}

/**
 * Delete a library item
 * DELETE /api/library/{type}/{id}
 */
export async function deleteLibraryItem(type: 'sample' | 'generated', id: number): Promise<void> {
  return apiDelete<void>(`/api/library/${type}/${id}`);
}

