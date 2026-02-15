"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText, ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
}

export function FileUpload({
  onUpload,
  accept = ".pdf,.jpg,.jpeg,.png",
  multiple = true,
  maxSize = 10,
  label = "Glissez vos fichiers ici",
  description = "ou cliquez pour sélectionner (max 10 Mo par fichier)",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const validateFiles = (fileList: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxBytes = maxSize * 1024 * 1024;

    Array.from(fileList).forEach((file) => {
      if (file.size > maxBytes) {
        setError(`Le fichier ${file.name} dépasse la taille maximale de ${maxSize} Mo`);
        return;
      }
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const droppedFiles = validateFiles(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const newFiles = multiple ? [...files, ...droppedFiles] : droppedFiles;
      setFiles(newFiles);
      onUpload(newFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const selectedFiles = validateFiles(e.target.files);
      if (selectedFiles.length > 0) {
        const newFiles = multiple ? [...files, ...selectedFiles] : selectedFiles;
        setFiles(newFiles);
        onUpload(newFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (file.type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400",
          error && "border-red-300"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-700 font-medium">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-2">
          Formats acceptés: {accept} | Taille max: {maxSize}MB
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Fichiers sélectionnés ({files.length})
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
