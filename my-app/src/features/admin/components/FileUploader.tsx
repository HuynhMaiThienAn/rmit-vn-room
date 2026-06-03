'use client';

import React from 'react';
import type { FileUploadStatus } from '../hooks/use-file-upload';

interface FileUploaderProps {
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  isUploading: boolean;
  fileStatuses: FileUploadStatus[];
  submitFiles: (files: File[]) => void;
  totalResult: {
    rooms: number;
    courses: number;
    schedules: number;
    files: number;
  } | null;
}

export function FileUploader({
  isDragging,
  setIsDragging,
  isUploading,
  fileStatuses,
  submitFiles,
  totalResult,
}: FileUploaderProps) {
  const panelClassName = `block cursor-pointer mt-7 rounded-lg border-2 border-dashed p-10 text-center transition ${
    isDragging
      ? 'border-[#E60028] bg-[#E60028]/5'
      : 'border-black bg-slate-50 hover:border-[#000054]'
  }`;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    void submitFiles(Array.from(fileList));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const fileList = event.dataTransfer.files;
    if (!fileList || fileList.length === 0) return;
    void submitFiles(Array.from(fileList));
  };

  return (
    <div>
      <label
        className={panelClassName}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".txt,.json"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />

        <p className="text-sm font-semibold text-[#000054]">
          {isUploading ? 'Uploading and processing files...' : 'Drag and drop dataset files here'}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
          or click to browse • supports multiple files
        </p>
      </label>

      {/* Per-file upload status list */}
      {fileStatuses.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Upload progress
          </p>
          {fileStatuses.map((fileStatus, idx) => (
            <div
              key={`${fileStatus.fileName}-${idx}`}
              className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm border border-black ${
                fileStatus.status === 'success'
                  ? 'bg-green-50'
                  : fileStatus.status === 'error'
                    ? 'bg-red-50'
                    : fileStatus.status === 'uploading'
                      ? 'bg-blue-50'
                      : 'bg-slate-50'
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-800">{fileStatus.fileName}</span>
                <span
                  className={`text-xs mt-0.5 ${
                    fileStatus.status === 'success'
                      ? 'text-green-700'
                      : fileStatus.status === 'error'
                        ? 'text-red-700'
                        : fileStatus.status === 'uploading'
                          ? 'text-blue-700'
                          : 'text-slate-500'
                  }`}
                >
                  {fileStatus.message}
                </span>
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  fileStatus.status === 'success'
                    ? 'text-green-600'
                    : fileStatus.status === 'error'
                      ? 'text-red-600'
                      : fileStatus.status === 'uploading'
                        ? 'text-blue-600'
                        : 'text-slate-500'
                }`}
              >
                {fileStatus.status === 'uploading' && (
                  <span className="inline-block animate-spin mr-1">⟳</span>
                )}
                {fileStatus.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Aggregated totals */}
      {totalResult && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Rooms', value: totalResult.rooms },
            { label: 'Total Courses', value: totalResult.courses },
            { label: 'Total Schedules', value: totalResult.schedules },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-black bg-green-50 p-4 text-center shadow-xs"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-700">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-normal text-green-900">
                {stat.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
