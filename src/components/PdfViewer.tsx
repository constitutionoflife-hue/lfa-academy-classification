/**
 * PdfViewer — renders PDF pages to <canvas> via PDF.js.
 *
 * WHY THIS EXISTS:
 * Chrome's built-in PDF plugin refuses to render PDFs inside <iframe> elements
 * regardless of the URL type (https://, blob://, data:). PDF.js renders entirely
 * in JavaScript/Canvas, completely bypassing the browser PDF plugin.
 */
import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

// ─── Worker setup ──────────────────────────────────────────────────────────
// We use Vite's ?url import to get the worker file URL from the local bundle.
// This guarantees the worker version exactly matches the installed pdfjs-dist.
// Do NOT use a CDN URL — version mismatch silently breaks rendering.
try {
  // Dynamic import is used so Vite resolves the ?url at build time
  // without crashing when the module is first loaded.
  const workerModule = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule;
} catch {
  // Fallback: exact CDN version (requires internet, same version as installed)
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  /** blob: URI, data: URI, or https:// URL pointing to a PDF */
  src: string;
}

export default function PdfViewer({ src }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!src) {
      setErrorMsg("لم يتم تحديد مصدر الملف.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");

    // Clear previously rendered pages
    if (containerRef.current) containerRef.current.innerHTML = "";

    const render = async () => {
      try {
        // PDF.js getDocument accepts: URL string, ArrayBuffer, Uint8Array, or object
        const loadingTask = pdfjs.getDocument({
          url: src,
          // Disable range requests — load the whole PDF at once.
          // This avoids issues with servers that don't support range requests (Firebase Storage).
          disableRange: true,
          disableStream: true,
        });

        const pdf = await loadingTask.promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);

          // Scale to fit ~760px logical width, sharp on HiDPI screens
          const dpr = window.devicePixelRatio || 1;
          const desiredLogicalWidth = 760;
          const unscaled = page.getViewport({ scale: 1 });
          const scale = (desiredLogicalWidth / unscaled.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx || !containerRef.current || cancelled) return;

          // Physical pixels (HiDPI)
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // CSS logical pixels
          canvas.style.width = `${viewport.width / dpr}px`;
          canvas.style.height = `${viewport.height / dpr}px`;
          canvas.style.display = "block";
          canvas.style.marginBottom = "8px";
          canvas.style.borderRadius = "4px";
          canvas.style.boxShadow = "0 1px 4px rgba(0,0,0,0.18)";
          canvas.style.background = "#fff";

          containerRef.current.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        if (!cancelled) setStatus("done");
      } catch (e: any) {
        if (!cancelled) {
          // Log the actual error so browser devtools shows what went wrong
          console.error("[PdfViewer] render failed —", e?.name, e?.message, e);

          const msg = e?.message || "";
          if (msg.includes("Invalid PDF") || msg.includes("Invalid XRef")) {
            setErrorMsg("الملف ليس ملف PDF صالحاً أو تالف.");
          } else if (msg.includes("Missing PDF") || msg.includes("404")) {
            setErrorMsg("الملف غير موجود أو انتهت صلاحية الرابط.");
          } else if (msg.includes("Unexpected server response") || msg.includes("403") || msg.includes("401")) {
            setErrorMsg("ليس لديك صلاحية الوصول لهذا الملف.");
          } else {
            setErrorMsg(`تعذر عرض الملف. يرجى استخدام زر التحميل أو الفتح في نافذة جديدة.`);
          }
          setStatus("error");
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* Loading spinner */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-10 h-10 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">جاري عرض الصفحات...</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-8">
          <span className="material-symbols-outlined text-4xl text-red-400">error_outline</span>
          <p className="text-sm font-bold text-gray-600">{errorMsg}</p>
          <p className="text-xs text-gray-400">
            استخدم أزرار "فتح في نافذة جديدة" أو "تحميل" أعلاه للوصول للملف.
          </p>
        </div>
      )}

      {/* Canvas container — PDF pages are appended imperatively by PDF.js */}
      <div
        ref={containerRef}
        className="overflow-y-auto flex-1 bg-gray-200 p-4 rounded-lg flex flex-col items-center"
        style={{ display: status === "done" ? undefined : "none" }}
      />
    </div>
  );
}
