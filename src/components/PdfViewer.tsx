/**
 * PdfViewer — renders PDF pages to <canvas> via PDF.js.
 *
 * WHY: Chrome's built-in PDF plugin refuses to render PDFs inside <iframe>
 * elements (any URL type: https://, blob://, data:). PDF.js renders entirely
 * in JavaScript/Canvas, bypassing the browser PDF plugin and all iframe
 * restrictions.
 */
import React, { useEffect, useRef, useState } from "react";

// We lazily import pdfjs-dist so it doesn't bloat the initial bundle.
// The worker is loaded from the same package using Vite's ?url import.
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Pin the worker to the exact installed version — version mismatch causes silent failure.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfViewerProps {
  /** blob: URI, data: URI, or https:// URL */
  src: string;
}

export default function PdfViewer({ src }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    setStatus("loading");
    setErrorMsg("");

    // Clear previously rendered pages
    if (containerRef.current) containerRef.current.innerHTML = "";

    const render = async () => {
      try {
        const loadingTask = pdfjs.getDocument(src);
        const pdf = await loadingTask.promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);

          // Scale so the page fills roughly the modal width (~780px).
          // Using devicePixelRatio gives sharp text on HiDPI screens.
          const dpr = window.devicePixelRatio || 1;
          const desiredWidth = 760;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = (desiredWidth / unscaledViewport.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx || !containerRef.current || cancelled) return;

          // Physical (HiDPI) size
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // CSS (logical) size
          canvas.style.width = `${viewport.width / dpr}px`;
          canvas.style.height = `${viewport.height / dpr}px`;
          canvas.style.display = "block";
          canvas.style.marginBottom = "8px";
          canvas.style.borderRadius = "4px";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.15)";
          canvas.style.background = "#fff";

          containerRef.current.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        if (!cancelled) setStatus("done");
      } catch (e: any) {
        if (!cancelled) {
          console.error("PdfViewer render error:", e);
          setErrorMsg(
            e?.message?.includes("Invalid PDF")
              ? "الملف ليس ملف PDF صالحاً."
              : "تعذر عرض الملف. يرجى استخدام زر التحميل أو فتحه في نافذة جديدة."
          );
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
      {/* Loading spinner — shown while first page renders */}
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-10 h-10 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">جاري عرض الصفحات...</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-8">
          <span className="material-symbols-outlined text-4xl text-red-400">
            error_outline
          </span>
          <p className="text-sm font-bold text-gray-600">{errorMsg}</p>
        </div>
      )}

      {/* Canvas container — PDF pages are appended here imperatively */}
      <div
        ref={containerRef}
        className="overflow-y-auto flex-1 bg-gray-200 p-4 rounded-lg flex flex-col items-center"
        style={{ display: status === "done" ? undefined : "none" }}
      />
    </div>
  );
}
