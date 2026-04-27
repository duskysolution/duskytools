import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UploadCloud, ArrowLeft, FileIcon, X, Loader2, CheckCircle2, Download, RotateCw, ShieldCheck, Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getToolBySlug, TOOLS } from '../mock';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ToolPage() {
  const { slug } = useParams();
  const tool = useMemo(() => getToolBySlug(slug), [slug]);
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|processing|done
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setFiles([]); setStatus('idle'); setProgress(0);
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

  const addFiles = (list) => {
    const arr = Array.from(list).map(f => ({ id: Math.random().toString(36).slice(2), file: f }));
    setFiles(prev => tool.multiple ? [...prev, ...arr] : arr.slice(0,1));
  };
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const removeFile = (id) => setFiles(f => f.filter(x => x.id !== id));

  const startProcess = () => {
    if (!files.length) return;
    setStatus('processing');
    setProgress(0);
    const tick = setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 18 + 6;
        if (next >= 100) {
          clearInterval(tick);
          setTimeout(() => setStatus('done'), 350);
          return 100;
        }
        return next;
      });
    }, 260);
  };
  const reset = () => { setFiles([]); setStatus('idle'); setProgress(0); };

  const relatedTools = TOOLS.filter(t => t.category === tool.category && t.slug !== tool.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Header />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(1200px 400px at 50% -10%, ${tool.color}22, transparent 60%)`
          }}
        />
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6">
            <ArrowLeft className="w-4 h-4" /> All tools
          </Link>
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${tool.color}18` }}>
            <Icon className="w-8 h-8" style={{ color: tool.color }} strokeWidth={2} />
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">{tool.name}</h1>
          <p className="mt-3 max-w-2xl mx-auto text-slate-600 leading-relaxed">{tool.description}</p>
        </div>
      </section>

      {/* Uploader */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pb-6">
        {status === 'idle' && (
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

            {files.length > 0 && (
              <div className="mt-8 text-left">
                <ul className="space-y-2">
                  {files.map(({ id, file }) => (
                    <li key={id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
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
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button onClick={() => inputRef.current?.click()} className="text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 rounded-lg">
                    Add more
                  </button>
                  <button onClick={startProcess} className="inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow">
                    {tool.action} <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
            <p className="text-sm text-slate-500 mt-1">This is a demo — file processing will be enabled in the next step.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => alert('Demo: download would start here once backend is connected.')}
                className="inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-5 py-3 rounded-lg shadow"
              >
                <Download className="w-4 h-4" /> Download result
              </button>
              <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 rounded-lg">
                <RotateCw className="w-4 h-4" /> Start over
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Benefits row */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: 'Lightning fast', text: 'Process your files in seconds — optimized for speed.' },
            { icon: ShieldCheck, title: 'Private by design', text: 'Encrypted transfer and automatic cleanup after processing.' },
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

      {/* Related */}
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
