"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut,
  FileText,
  Loader2,
  Maximize2,
  Minimize2
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  mimeType: string;
}

interface DocumentPreviewProps {
  documents: Document[];
  onClose: () => void;
  initialIndex?: number;
}

export function DocumentPreview({ documents, onClose, initialIndex = 0 }: DocumentPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentDoc = documents[currentIndex];
  const isPDF = currentDoc?.mimeType === "application/pdf";
  const isImage = currentDoc?.mimeType?.startsWith("image/");

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(100);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(100);
    }
  }, [currentIndex, documents.length]);

  useEffect(() => {
    setLoading(true);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToPrevious, goToNext]);

  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      diplome_licence: "Diplôme de Licence",
      diplome_master: "Diplôme de Master",
      releve_notes: "Relevé de notes",
      attestation_reussite: "Attestation de réussite",
      photo_identite: "Photo d'identité",
      acte_naissance: "Acte de naissance",
      certificat_nationalite: "Certificat de nationalité",
      lettre_motivation: "Lettre de motivation",
      cv: "Curriculum Vitae",
      projet_these: "Projet de thèse",
      autre: "Autre document",
    };
    return labels[type] || type;
  };

  if (!currentDoc) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileText className="h-5 w-5" />
          <div>
            <h3 className="font-medium">{currentDoc.name}</h3>
            <p className="text-sm text-gray-400">{getDocumentTypeLabel(currentDoc.type)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination */}
          <span className="text-sm px-3 py-1 bg-gray-800 rounded">
            {currentIndex + 1} / {documents.length}
          </span>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              className="text-white hover:bg-gray-700"
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              className="text-white hover:bg-gray-700"
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700 ml-2"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <a href={currentDoc.url} download={currentDoc.name}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
              <Download className="h-4 w-4" />
            </Button>
          </a>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-gray-700 ml-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 z-10 bg-black/50 text-white hover:bg-black/70 h-12 w-12 rounded-full"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === documents.length - 1}
          className="absolute right-4 z-10 bg-black/50 text-white hover:bg-black/70 h-12 w-12 rounded-full"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>

        {/* Content */}
        <div 
          className="max-h-full max-w-full overflow-auto p-4"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {isPDF ? (
            <iframe
              src={`${currentDoc.url}#toolbar=0`}
              className="w-[800px] h-[600px] bg-white rounded shadow-lg"
              onLoad={() => setLoading(false)}
              title={currentDoc.name}
            />
          ) : isImage ? (
            <img
              src={currentDoc.url}
              alt={currentDoc.name}
              className="max-w-full max-h-[80vh] object-contain rounded shadow-lg"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700">Aperçu non disponible pour ce type de fichier</p>
              <a href={currentDoc.url} download={currentDoc.name}>
                <Button className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails footer */}
      <div className="bg-gray-900 p-4">
        <div className="flex gap-2 justify-center overflow-x-auto">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(100);
              }}
              className={`shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                index === currentIndex 
                  ? "border-blue-500 ring-2 ring-blue-500/50" 
                  : "border-gray-600 hover:border-gray-400"
              }`}
            >
              {doc.mimeType?.startsWith("image/") ? (
                <img 
                  src={doc.url} 
                  alt={doc.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
