"use client";

import { ChevronLeft, ChevronRight, Download, ExternalLink, Maximize2, Minus, Plus, Rows3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { withBasePath } from "@/lib/paths";

export function PdfViewer({ src, title }: { src: string; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [documentRef, setDocumentRef] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [fitWidth, setFitWidth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = withBasePath("/pdf.worker.min.mjs");
        const document = await pdfjs.getDocument({ url: withBasePath(src) }).promise;
        if (active) {
          setDocumentRef(document);
          setPages(document.numPages);
        }
      } catch {
        if (active) setError("The inline viewer could not load this PDF. Open it in a new tab instead.");
      }
    }
    void load();
    return () => { active = false; };
  }, [src]);

  const render = useCallback(async () => {
    if (!documentRef || !canvasRef.current || !hostRef.current) return;
    const pdfPage = await documentRef.getPage(page);
    const natural = pdfPage.getViewport({ scale });
    const available = Math.max(280, hostRef.current.clientWidth - 32);
    const appliedScale = fitWidth ? Math.min(2.2, scale * (available / natural.width)) : scale;
    const viewport = pdfPage.getViewport({ scale: appliedScale });
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = viewport.width * ratio;
    canvas.height = viewport.height * ratio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    await pdfPage.render({ canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0], canvas }).promise;
  }, [documentRef, page, scale, fitWidth]);

  useEffect(() => { void render(); }, [render]);

  return (
    <section className="pdf-viewer" aria-label={`PDF viewer: ${title}`} ref={hostRef}>
      <div className="pdf-toolbar">
        <div className="pdf-control-group">
          <button className="icon-button" title="Previous page" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /></button>
          <label className="page-control"><span className="sr-only">Page number</span><input type="number" min={1} max={pages || 1} value={page} onChange={(event) => setPage(Math.min(pages || 1, Math.max(1, Number(event.target.value))))} /><span>of {pages || "…"}</span></label>
          <button className="icon-button" title="Next page" aria-label="Next page" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight size={17} /></button>
        </div>
        <div className="pdf-control-group">
          <button className="icon-button" title="Zoom out" aria-label="Zoom out" onClick={() => { setFitWidth(false); setScale((value) => Math.max(0.6, value - 0.15)); }}><Minus size={17} /></button>
          <button className="zoom-readout" onClick={() => setScale(1.15)}>{Math.round(scale * 100)}%</button>
          <button className="icon-button" title="Zoom in" aria-label="Zoom in" onClick={() => { setFitWidth(false); setScale((value) => Math.min(2.4, value + 0.15)); }}><Plus size={17} /></button>
          <button className={fitWidth ? "icon-button selected" : "icon-button"} title="Fit width" aria-label="Fit width" aria-pressed={fitWidth} onClick={() => setFitWidth((value) => !value)}><Rows3 size={17} /></button>
          <button className="icon-button" title="Fullscreen" aria-label="Fullscreen" onClick={() => void hostRef.current?.requestFullscreen()}><Maximize2 size={17} /></button>
          <a className="icon-button" title="Open PDF in new tab" aria-label="Open PDF in new tab" href={withBasePath(src)} target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>
          <a className="icon-button" title="Download PDF" aria-label="Download PDF" href={withBasePath(src)} download><Download size={17} /></a>
        </div>
      </div>
      <div className="pdf-canvas-wrap">
        {error ? <div className="pdf-error"><p>{error}</p><a className="secondary-button" href={withBasePath(src)} target="_blank" rel="noreferrer">Open PDF</a></div> : <canvas ref={canvasRef} aria-label={`Page ${page} of ${title}`} />}
      </div>
    </section>
  );
}
