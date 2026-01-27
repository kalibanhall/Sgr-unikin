"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Maximize2,
  Minimize2
} from "lucide-react";

interface Document {
  id: string;
  type: string;
  filename: string;
  url: string;
  mimeType?: string;
}

interface DocumentPreviewProps {
  documents: Document[];
  onClose?: () => void;
  isModal?: boolean;
}

const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    PHOTO: "Photo d'identité",
    DIPLOME: "Diplôme",
    ACTE_NAISSANCE: "Acte de naissance",
    ATTESTATION: "Attestation",
    CV: "Curriculum Vitae",
    LETTRE_MOTIVATION: "Lettre de motivation",
    RELEVE_NOTES: "Relevé de notes",
    CARTE_IDENTITE: "Carte d'identité",
    AUTRES: "Autre document",
  };
  return labels[type] || type;
};

const getFileIcon = (mimeType?: string, filename?: string) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return <ImageIcon className="h-6 w-6" />;
  }
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return <FileText className="h-6 w-6" />;
  }
  return <File className="h-6 w-6" />;
};

const isImage = (mimeType?: string, filename?: string): boolean => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

const isPDF = (mimeType?: string, filename?: string): boolean => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return mimeType === 'application/pdf' || ext === 'pdf';
};

export function DocumentPreview({ documents, onClose, isModal = false }: DocumentPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (documents.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700">Aucun document à prévisualiser</p>
        </CardContent>
      </Card>
    );
  }

  const currentDoc = documents[currentIndex];
  const isImageFile = isImage(currentDoc.mimeType, currentDoc.filename);
  const isPDFFile = isPDF(currentDoc.mimeType, currentDoc.filename);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1));
    setZoom(100);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0));
    setZoom(100);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentDoc.url;
    link.download = currentDoc.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerClass = isModal 
    ? "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" 
    : "w-full";

  const contentClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white"
    : isModal 
      ? "bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      : "bg-white rounded-lg border w-full overflow-hidden flex flex-col";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            {getFileIcon(currentDoc.mimeType, currentDoc.filename)}
            <div>
              <h3 className="font-semibold text-gray-900">{getDocumentTypeLabel(currentDoc.type)}</h3>
              <p className="text-sm text-gray-700">{currentDoc.filename}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>

            {(isModal || isFullscreen) && onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Document viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 min-h-[400px] flex items-center justify-center">
          <div 
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
            className="transition-transform duration-200"
          >
            {isImageFile ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentDoc.url}
                alt={currentDoc.filename}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
              />
            ) : isPDFFile ? (
              <iframe
                src={`${currentDoc.url}#toolbar=0`}
                className="w-[800px] h-[600px] border-0 rounded shadow-lg bg-white"
                title={currentDoc.filename}
              />
            ) : (
              <div className="bg-white rounded-lg p-8 shadow-lg text-center">
                <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-900 font-medium">{currentDoc.filename}</p>
                <p className="text-gray-700 text-sm mt-2">
                  Ce type de fichier ne peut pas être prévisualisé.
                </p>
                <Button onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button 
            variant="outline" 
            onClick={goToPrevious}
            disabled={documents.length <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>

          {/* Document thumbnails / pagination */}
          <div className="flex items-center gap-2">
            {documents.map((doc, index) => (
              <button
                key={doc.id}
                onClick={() => { setCurrentIndex(index); setZoom(100); }}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                  index === currentIndex 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={getDocumentTypeLabel(doc.type)}
              >
                <span className="text-xs font-medium">{index + 1}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Document {currentIndex + 1} sur {documents.length}
            </span>
            <Button 
              variant="outline" 
              onClick={goToNext}
              disabled={documents.length <= 1}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour ouvrir la prévisualisation en modal
interface PreviewButtonProps {
  documents: Document[];
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function PreviewDocumentsButton({ 
  documents, 
  label = "Prévisualiser les documents",
  variant = "default",
  size = "default",
  className = ""
}: PreviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (documents.length === 0) {
    return null;
  }

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <FileText className="h-4 w-4 mr-2" />
        {label} ({documents.length})
      </Button>

      {isOpen && (
        <DocumentPreview 
          documents={documents} 
          onClose={() => setIsOpen(false)} 
          isModal={true}
        />
      )}
    </>
  );
}
