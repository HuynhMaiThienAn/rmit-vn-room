'use client';

import { useMemo, useState } from 'react';
import { readFileAsText, uploadDatasetFile } from '../services/upload.service';

export type FileUploadStatus = {
  fileName: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
  result?: {
    roomsUpserted: number;
    coursesUpserted: number;
    schedulesInserted: number;
  };
};

export function useFileUpload(onSuccess: () => void) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);

  async function uploadSingleFile(file: File, index: number) {
    setFileStatuses((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'uploading', message: 'Uploading and processing...' };
      return next;
    });

    try {
      const rawText = await readFileAsText(file);
      const payload = await uploadDatasetFile(rawText);

      setFileStatuses((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'success',
          message: `✓ ${payload.data?.roomsUpserted ?? 0} rooms, ${
            payload.data?.coursesUpserted ?? 0
          } courses, ${payload.data?.schedulesInserted ?? 0} schedules`,
          result: payload.data,
        };
        return next;
      });
    } catch (error) {
      setFileStatuses((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to upload',
        };
        return next;
      });
    }
  }

  async function submitFiles(files: File[]) {
    const validFiles = files.filter((file) => {
      const lowerName = file.name.toLowerCase();
      return lowerName.endsWith('.txt') || lowerName.endsWith('.json');
    });

    if (validFiles.length === 0) {
      setFileStatuses([
        {
          fileName: 'Invalid',
          status: 'error',
          message: 'Only .txt or .json files are accepted.',
        },
      ]);
      return;
    }

    const initialStatuses: FileUploadStatus[] = validFiles.map((file) => ({
      fileName: file.name,
      status: 'pending' as const,
      message: 'Waiting...',
    }));

    setFileStatuses(initialStatuses);
    setIsUploading(true);

    for (let i = 0; i < validFiles.length; i++) {
      await uploadSingleFile(validFiles[i], i);
    }

    setIsUploading(false);
    onSuccess();
  }

  const totalResult = useMemo(() => {
    const completed = fileStatuses.filter((s) => s.status === 'success' && s.result);
    if (completed.length === 0) return null;
    return {
      rooms: completed.reduce((sum, s) => sum + (s.result?.roomsUpserted ?? 0), 0),
      courses: completed.reduce((sum, s) => sum + (s.result?.coursesUpserted ?? 0), 0),
      schedules: completed.reduce((sum, s) => sum + (s.result?.schedulesInserted ?? 0), 0),
      files: completed.length,
    };
  }, [fileStatuses]);

  return {
    isDragging,
    setIsDragging,
    isUploading,
    fileStatuses,
    submitFiles,
    totalResult,
  };
}
