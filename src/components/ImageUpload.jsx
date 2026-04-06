import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2, Crop } from "lucide-react";

export default function ImageUpload({ value, onChange, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const inputRef = useRef();
  const canvasRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImage(event.target.result);
      setCropping(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSubmit = async () => {
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        (crop.x / 100) * img.width,
        (crop.y / 100) * img.height,
        (crop.width / 100) * img.width,
        (crop.height / 100) * img.height,
        0,
        0,
        crop.width,
        crop.height
      );
      canvas.toBlob(async (blob) => {
        setUploading(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
        onChange(file_url);
        setUploading(false);
        setCropping(false);
        setCropImage(null);
      });
    };
    img.src = cropImage;
  };

  if (cropping && cropImage) {
    return (
      <div className={`relative ${className}`}>
        <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
          <div className="relative inline-block w-full">
            <img src={cropImage} alt="Crop" className="max-w-full h-auto" />
            <div
              className="absolute border-2 border-orange-500 cursor-move"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startY = e.clientY;
                const startCrop = { ...crop };
                const handleMouseMove = (moveE) => {
                  const deltaX = ((moveE.clientX - startX) / e.currentTarget.parentElement.offsetWidth) * 100;
                  const deltaY = ((moveE.clientY - startY) / e.currentTarget.parentElement.offsetHeight) * 100;
                  setCrop({
                    x: Math.max(0, Math.min(startCrop.x + deltaX, 100 - startCrop.width)),
                    y: Math.max(0, Math.min(startCrop.y + deltaY, 100 - startCrop.height)),
                    width: startCrop.width,
                    height: startCrop.height,
                  });
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
          <div className="space-y-2 text-sm">
            <label>Größe: {crop.width.toFixed(0)}% × {crop.height.toFixed(0)}%</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="range"
                min="10"
                max="100"
                value={crop.width}
                onChange={(e) => setCrop({ ...crop, width: Math.min(parseFloat(e.target.value), 100 - crop.x) })}
                className="col-span-2"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setCropping(false); setCropImage(null); }}
              className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCropSubmit}
              disabled={uploading}
              className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zuschneiden & Speichern"}
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative group w-full h-36 rounded-lg overflow-hidden border border-border">
          <img src={value} alt="Bild" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-black rounded-md px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
            >
              Ändern
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-destructive text-white rounded-md px-3 py-1.5 text-xs font-medium"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-sm">Bild hochladen</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}