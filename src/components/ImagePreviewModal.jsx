import { X, ZoomIn } from "lucide-react";

export function ImagePreviewModal({ src, alt, onClose }) {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white bg-black/50 p-2 hover:bg-black/80 transition-colors"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt || "Vorschau"}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

export function PreviewTrigger({ src, alt, className, children }) {
  return (
    <div className={`relative group cursor-zoom-in ${className || ""}`}>
      {children}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}