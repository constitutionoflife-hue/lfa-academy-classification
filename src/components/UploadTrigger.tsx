import React, { useRef } from 'react';
import { STORAGE_ENABLED, STORAGE_DISABLED_MSG } from '../lib/storageConfig';

interface UploadTriggerProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function UploadTrigger({
  onFileSelect,
  accept = ".png,.jpg,.jpeg,.webp",
  className = "",
  children,
  disabled = false
}: UploadTriggerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage is disabled at the platform level (Spark plan)
  if (!STORAGE_ENABLED) {
    return (
      <div className={`relative group ${className}`}>
        {/* Children are rendered normally so layout is preserved */}
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
        {/* Tooltip shown on hover */}
        <div
          className="absolute inset-0 cursor-not-allowed flex items-center justify-center"
          title={STORAGE_DISABLED_MSG}
        >
          <div className="absolute inset-x-0 bottom-0 translate-y-full pt-1 z-20 hidden group-hover:block">
            <div className="bg-gray-800 text-white text-[11px] font-bold rounded-lg px-3 py-2 text-center shadow-lg leading-relaxed whitespace-nowrap">
              {STORAGE_DISABLED_MSG}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      <input
        type="file"
        className="hidden"
        style={{ display: 'none' }}
        accept={accept}
        onChange={(e) => {
          onFileSelect(e);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        disabled={disabled}
        ref={fileInputRef}
      />
      {children}
    </div>
  );
}
