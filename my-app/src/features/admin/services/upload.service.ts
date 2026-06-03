export type UpdateDataResponse = {
  success: boolean;
  error?: string;
  data?: {
    roomsUpserted: number;
    coursesUpserted: number;
    schedulesInserted: number;
  };
};

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsText(file);
  });
}

export async function uploadDatasetFile(rawText: string): Promise<UpdateDataResponse> {
  const response = await fetch('/api/admin/update-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-admin-passcode': process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY ?? '',
    },
    body: rawText,
  });

  const payload = (await response.json()) as UpdateDataResponse;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Failed to update dataset');
  }

  return payload;
}
