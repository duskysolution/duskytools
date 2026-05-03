import React, { useEffect, useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, RotateCw, Trash2, GripVertical } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use the matching pdfjs-dist worker (v4.4.168) from a CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * PdfViewer
 *  - file: File object OR url string
 *  - mode: 'thumbs' | 'preview' | 'organize'
 *  - onPagesChange(order: number[]): optional, used in organize mode
 *  - rotations: {pageIndex: deg} map (optional)
 *  - pageOrder: number[] 1-based (optional, for organize)
 */
export default function PdfViewer({
  file,
  mode = 'thumbs',
  onLoad,
  pageOrder,
  rotations = {},
  onReorder,
  onDelete,
  onRotateOne,
}) {
  const [numPages, setNumPages] = useState(0);
  const fileSource = useMemo(() => (file instanceof File ? file : file), [file]);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    setNumPages(0);
  }, [file]);

  const onDocLoad = ({ numPages: n }) => {
    setNumPages(n);
    onLoad && onLoad(n);
  };

  const order = pageOrder && pageOrder.length ? pageOrder : Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <Document
        file={fileSource}
        onLoadSuccess={onDocLoad}
        loading={
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading PDF…
          </div>
        }
        error={<div className="text-sm text-red-500 py-6 text-center">Failed to load PDF preview.</div>}
      >
        {numPages > 0 && mode === 'preview' && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-3 bg-slate-100 rounded-lg border border-slate-200">
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i} className="flex justify-center">
                <Page
                  pageNumber={i + 1}
                  width={Math.min(700, window.innerWidth - 80)}
                  rotate={rotations[i] || 0}
                  className="shadow-md"
                />
              </div>
            ))}
          </div>
        )}

        {numPages > 0 && (mode === 'thumbs' || mode === 'organize') && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            {order.map((pageNum, idx) => (
              <div
                key={`${pageNum}-${idx}`}
                className={`group relative bg-white rounded-lg border ${dragIdx === idx ? 'border-[#C73E3A] ring-2 ring-[#C73E3A]/30' : 'border-slate-200'} overflow-hidden transition-all hover:shadow-md`}
                draggable={mode === 'organize'}
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  if (mode !== 'organize' || dragIdx === null || dragIdx === idx) return;
                  const next = [...order];
                  const [moved] = next.splice(dragIdx, 1);
                  next.splice(idx, 0, moved);
                  setDragIdx(null);
                  onReorder && onReorder(next);
                }}
                onDragEnd={() => setDragIdx(null)}
              >
                <div className="aspect-[3/4] flex items-center justify-center bg-slate-50">
                  <Page
                    pageNumber={pageNum}
                    width={160}
                    rotate={rotations[pageNum - 1] || 0}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
                <div className="px-2 py-1.5 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100">
                  <span className="font-mono">Page {pageNum}</span>
                  {mode === 'organize' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRotateOne && onRotateOne(pageNum - 1)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[#C73E3A]"
                        title="Rotate"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(pageNum)}
                        className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Document>
    </div>
  );
}
