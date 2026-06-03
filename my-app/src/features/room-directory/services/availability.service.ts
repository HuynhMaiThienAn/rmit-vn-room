// Async service for fetching the availability matrix from the API.

import { parseAvailabilityMatrix } from '../utils/parse';
import type { TimetableMatrix, AvailabilityResponse } from '../../../types/room';

export async function fetchAvailabilityMatrix(
  queryStart: string,
  queryEnd: string,
  selectedSemester: string,
): Promise<TimetableMatrix> {
  const queryParams = new URLSearchParams();
  queryParams.set('start', new Date(queryStart).toISOString());
  queryParams.set('end', new Date(queryEnd).toISOString());

  if (selectedSemester !== 'ALL') {
    queryParams.set('semester', selectedSemester);
  }

  const response = await fetch(`/api/availability?${queryParams.toString()}`, {
    cache: 'no-store',
  });
  const payload = (await response.json()) as AvailabilityResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to load schedule matrix');
  }

  return parseAvailabilityMatrix(payload.data);
}
