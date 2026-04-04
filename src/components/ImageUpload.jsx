import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2 } from "lucide-react";

export default function ImageUpload({ value, onChange, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
  };

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