import React, { useRef } from 'react';

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
          // Reset value to allow selecting the same file again
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
