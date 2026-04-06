import { X, Download } from "lucide-react";

function getFileType(url) {
  if (!url) return "other";
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "office";
  return "other";
}

export default function FilePreviewModal({ doc, onClose }) {
  if (!doc) return null;
  const type = getFileType(doc.file_url);
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 shrink-0" onClick={e => e.stopPropagation()}>
        <p className="text-white font-medium truncate max-w-[70vw]">{doc.title}</p>
        <div className="flex items-center gap-2">
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
          <button onClick={onClose} className="text-white bg-white/10 hover:bg-white/20 p-2 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {type === "image" && (
          <img src={doc.file_url} alt={doc.title} className="max-w-full max-h-full object-contain" />
        )}
        {type === "pdf" && (
          <iframe src={doc.file_url} className="w-full h-full bg-white" title={doc.title} />
        )}
        {type === "office" && (
          <iframe src={googleViewerUrl} className="w-full h-full bg-white" title={doc.title} />
        )}
        {type === "other" && (
          <div className="text-white text-center space-y-4">
            <p className="text-lg">Vorschau nicht verfügbar</p>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium hover:bg-gray-100 transition-colors">
              <Download className="h-4 w-4" /> Herunterladen
            </a>
          </div>
        )}
      </div>
    </div>
  );
}