import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UploadCloud, ArrowLeft, FileIcon, X, Loader2, CheckCircle2, Download, RotateCw,
  ShieldCheck, Zap, Eye, Settings2
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import PdfViewer from '../components/PdfViewer';
import ToolOptions from '../components/ToolOptions';
import { getToolBySlug, TOOLS } from '../mock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Tools whose backend processor is wired up (sourced from mock.js `functional` flag).
// Kept here as a fallback constant; primary source of truth is `tool.functional`.
const FUNCTIONAL_FALLBACK = new Set(TOOLS.filter(t => t.functional).map(t => t.slug));

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ToolPage() {
  const { slug } = useParams();
  const tool = useMemo(() => getToolBySlug(slug), [slug]);
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]); // [{id, file}]
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|processing|done|error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [opts, setOpts] = useState({});
  const [numPages, setNumPages] = useState(0);
  const [viewerMode, setViewerMode] = useState('thumbs'); // thumbs|preview|organize
  const [pageOrder, setPageOrder] = useState([]);
  const [rotations, setRotations] = useState({});
  const navigate = useNavigate();

  const isFunctional = tool ? (tool.functional ?? FUNCTIONAL_FALLBACK.has(slug)) : false;
  const isPdfInput = tool && tool.accept === '.pdf';
  const primaryPdfFile = files[0]?.file && isPdfInput ? files[0].file : null;

  useEffect(() => {
    setFiles([]); setStatus('idle'); setProgress(0); setResult(null); setErrMsg('');
    setOpts({}); setNumPages(0); setPageOrder([]); setRotations({});
    setViewerMode(slug === 'organize-pdf' ? 'organize' : 'thumbs');
  }, [slug]);

  if (!tool) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Tool not found</h1>
          <p className="mt-2 text-slate-600">The tool you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className="mt-5 inline-flex items-center gap-2 bg-[#C73E3A] text-white px-4 py-2 rounded-lg">
            <ArrowLeft className="w-4 h-4" /> Go home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = tool.icon;

  // SEO data for this specific tool
  const seoTitle = `${tool.name} – Free Online ${tool.name} Tool | DuskyPDF`;
  const seoDescription = `${tool.description} Free, fast, no signup required.`;
  const seoKeywords = `${tool.name.toLowerCase()}, online ${tool.name.toLowerCase()}, free ${tool.name.toLowerCase()}, PDF tool, DuskyPDF`;
  const seoCanonical = `https://duskypdf.com/${tool.slug}`;
  const seoJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${tool.name} - DuskyPDF`,
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (Web)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '1024' },
  };

  const addFiles = (list) => {
    const arr = Array.from(list).map(f => ({ id: Math.random().toString(36).slice(2), file: f }));
    setFiles(prev => tool.multiple ? [...prev, ...arr] : arr.slice(0, 1));
  };
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const removeFile = (id) => setFiles(f => f.filter(x => x.id !== id));

  const handleViewerLoad = (n) => {
    setNumPages(n);
    setPageOrder(Array.from({ length: n }, (_, i) => i + 1));
  };

  const startProcess = async () => {
    if (!files.length) return;
    setStatus('processing'); setProgress(0); setErrMsg('');

    // Non-functional tools: demo fallback
    if (!isFunctional) {
      const tick = setInterval(() => {
        setProgress(p => {
          const next = p + Math.random() * 18 + 6;
          if (next >= 100) { clearInterval(tick); setTimeout(() => setStatus('done'), 350); return 100; }
          return next;
        });
      }, 260);
      return;
    }

    try {
      const form = new FormData();
      files.forEach(({ file }) => form.append('files', file));

      // Build options from viewer state where applicable
      let toolOpts = { ...opts };
      if (slug === 'organize-pdf' && pageOrder.length) {
        toolOpts.page_order = pageOrder;
      }

      form.append('options', JSON.stringify(toolOpts));

      const res = await axios.post(`${API}/tools/${slug}/process`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.min(85, Math.round((evt.loaded / evt.total) * 85)));
        },
        timeout: 180000,
      });
      setProgress(100);
      setResult(res.data);
      setTimeout(() => setStatus('done'), 300);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err.message || 'Processing failed';
      setErrMsg(typeof msg === 'string' ? msg : 'Processing failed');
      setStatus('error');
    }
  };

  const reset = () => {
    setFiles([]); setStatus('idle'); setProgress(0); setResult(null); setErrMsg('');
    setOpts({}); setNumPages(0); setPageOrder([]); setRotations({});
  };

  const downloadResult = () => {
    if (!result) return;
    const url = `${BACKEND_URL}${result.download_url}?filename=${encodeURIComponent(result.filename)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const relatedTools = TOOLS.filter(t => t.category === tool.category && t.slug !== tool.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Seo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={seoCanonical}
        jsonLd={seoJsonLd}
      />
      <Header />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(1200px 400px at 50% -10%, ${tool.color}22, transparent 60%)` }}
        />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5">
            <ArrowLeft className="w-4 h-4" /> All tools
          </Link>
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${tool.color}18` }}>
            <Icon className="w-7 h-7" style={{ color: tool.color }} strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">{tool.name}</h1>
          <p className="mt-2 max-w-2xl mx-auto text-slate-600 leading-relaxed">{tool.description}</p>
          {!isFunctional && (
            <p className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              UI preview only · backend not wired for this tool yet
            </p>
          )}
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-6">
        {status === 'idle' && files.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`relative bg-white rounded-2xl border-2 border-dashed ${isDragging ? 'border-[#C73E3A] bg-rose-50/40' : 'border-slate-200'} p-10 md:p-14 text-center transition-colors`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={tool.accept}
              multiple={tool.multiple}
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="mx-auto w-14 h-14 rounded-full bg-[#C73E3A]/10 flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7 text-[#C73E3A]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Select {tool.multiple ? 'files' : 'a file'}</h3>
            <p className="text-sm text-slate-500 mt-1">or drop {tool.multiple ? 'files' : 'a file'} here</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-5 inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-md shadow-[#C73E3A]/20 transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Select {tool.multiple ? 'files' : 'file'}
            </button>
            <p className="mt-4 text-xs text-slate-400">Accepted: <span className="font-mono">{tool.accept}</span></p>
          </div>
        )}

        {status === 'idle' && files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
            {/* Viewer / file list */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#C73E3A]" /> Live preview
                </h3>
                {primaryPdfFile && (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewerMode('thumbs')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md ${viewerMode === 'thumbs' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >Thumbs</button>
                    <button
                      onClick={() => setViewerMode('preview')}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md ${viewerMode === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                    >Pages</button>
                    {slug === 'organize-pdf' && (
                      <button
                        onClick={() => setViewerMode('organize')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md ${viewerMode === 'organize' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                      >Organize</button>
                    )}
                  </div>
                )}
              </div>

              {/* File chips */}
              <ul className="space-y-2 mb-4">
                {files.map(({ id, file }) => (
                  <li key={id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                      <FileIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile(id)} className="text-slate-400 hover:text-red-500 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {primaryPdfFile ? (
                <PdfViewer
                  file={primaryPdfFile}
                  mode={viewerMode}
                  onLoad={handleViewerLoad}
                  pageOrder={pageOrder}
                  rotations={rotations}
                  onReorder={(newOrder) => setPageOrder(newOrder)}
                  onDelete={(pageNum) => setPageOrder(o => o.filter(p => p !== pageNum))}
                  onRotateOne={(idx) => setRotations(r => ({ ...r, [idx]: ((r[idx] || 0) + 90) % 360 }))}
                />
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
                  Preview is available for PDF inputs. Image inputs will be converted directly.
                </div>
              )}
            </div>

            {/* Options panel */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-5 h-fit sticky top-[80px]">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-[#C73E3A]" /> Options
              </h3>

              <ToolOptions slug={slug} opts={opts} setOpts={setOpts} numPages={numPages} />

              <div className="mt-5 space-y-2">
                <button
                  onClick={startProcess}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-md shadow-[#C73E3A]/20 transition-colors"
                >
                  {tool.action} <Zap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg"
                >
                  Add more files
                </button>
                <input
                  ref={inputRef} type="file" className="hidden"
                  accept={tool.accept} multiple={tool.multiple}
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>
            </aside>
          </div>
        )}

        {status === 'processing' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <Loader2 className="w-10 h-10 text-[#C73E3A] animate-spin mx-auto" />
            <h3 className="mt-4 text-xl font-bold text-slate-900">{tool.action} in progress…</h3>
            <p className="text-sm text-slate-500 mt-1">Hang tight, this only takes a moment.</p>
            <div className="max-w-md mx-auto mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#C73E3A] to-[#E56864] transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 font-mono">{Math.min(100, Math.round(progress))}%</p>
          </div>
        )}

        {status === 'done' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">Your file is ready!</h3>
            {result && (
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-mono">{result.filename}</span> · {formatBytes(result.size)}
              </p>
            )}
            {!isFunctional && (
              <p className="text-xs text-amber-700 mt-2">This tool is UI-only for now. Real processing coming soon.</p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              {result ? (
                <button onClick={downloadResult} className="inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-5 py-3 rounded-lg shadow">
                  <Download className="w-4 h-4" /> Download {result.filename.split('.').pop().toUpperCase()}
                </button>
              ) : (
                <button disabled className="inline-flex items-center gap-2 bg-slate-200 text-slate-500 text-sm font-semibold px-5 py-3 rounded-lg">
                  <Download className="w-4 h-4" /> Download (demo)
                </button>
              )}
              <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 rounded-lg">
                <RotateCw className="w-4 h-4" /> Start over
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">Something went wrong</h3>
            <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">{errMsg}</p>
            <button onClick={reset} className="mt-5 inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-5 py-3 rounded-lg">
              <RotateCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}
      </section>

      {/* Benefits */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Lightning fast', text: 'Process your files in seconds — optimized for speed.' },
            { icon: ShieldCheck, title: 'Private by design', text: 'Files auto-delete within an hour of processing.' },
            { icon: CheckCircle2, title: 'No account needed', text: 'Use the tool right now, no signup required.' },
          ].map(({ icon: I, title, text }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C73E3A]/10 flex items-center justify-center flex-shrink-0">
                <I className="w-5 h-5 text-[#C73E3A]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <p className="text-[13px] text-slate-600 mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {relatedTools.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Related tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedTools.map(t => {
              const TI = t.icon;
              return (
                <Link key={t.slug} to={`/${t.slug}`} className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${t.color}18` }}>
                    <TI className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#C73E3A]">{t.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.short}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
