import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Smartphone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { TOOLS, FEATURES } from '../mock';

/**
 * Home — DuskyPDF landing page.
 * Renders hero + categorized tool grid + features + CTA + SEO meta.
 */

const ToolCard = ({ tool }) => {
  const Icon = tool.icon;
  return (
    <Link
      to={`/${tool.slug}`}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-xl hover:-translate-y-1 hover:border-[#C73E3A]/30 transition-all duration-300"
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${tool.color}15` }}
      >
        <Icon className="w-6 h-6" style={{ color: tool.color }} strokeWidth={2} />
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 mb-1 group-hover:text-[#C73E3A] transition-colors">
        {tool.name}
      </h3>
      <p className="text-[13px] text-slate-500 leading-snug line-clamp-2">{tool.short}</p>
    </Link>
  );
};

const iconMap = { Zap, ShieldCheck, Smartphone, CheckCircle2 };

export default function Home() {
  const categorized = [
    { title: 'Organize PDF', slugs: ['merge-pdf','split-pdf','organize-pdf','rotate-pdf','remove-pages','extract-pages','n-up-pdf'] },
    { title: 'Optimize PDF', slugs: ['compress-pdf','grayscale-pdf','repair-pdf','ocr-pdf','pdf-info'] },
    { title: 'Convert to PDF', slugs: ['jpg-to-pdf','word-to-pdf','powerpoint-to-pdf','excel-to-pdf','html-to-pdf','text-to-pdf'] },
    { title: 'Convert from PDF', slugs: ['pdf-to-jpg','pdf-to-word','pdf-to-powerpoint','pdf-to-excel','pdf-to-text','extract-images'] },
    { title: 'Edit PDF', slugs: ['edit-pdf','page-numbers','watermark','crop-pdf'] },
    { title: 'PDF security', slugs: ['unlock-pdf','protect-pdf','sign-pdf','redact-pdf','compare-pdf'] },
  ];
  const bySlug = Object.fromEntries(TOOLS.map(t => [t.slug, t]));

  // Schema.org structured data: WebSite + ItemList of all tools
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'DuskyPDF',
      url: 'https://duskypdf.com',
      description: 'Every tool you need to work with PDFs in one place. 26+ free online PDF tools.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://duskypdf.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: TOOLS.slice(0, 30).map((t, i) => ({
        '@type': 'ListItem', position: i + 1,
        name: t.name,
        url: `https://duskypdf.com/${t.slug}`,
        description: t.short,
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      <Seo
        title="DuskyPDF — Every tool you need to work with PDFs in one place"
        description="DuskyPDF — 26+ free online PDF tools. Merge, split, compress, convert, edit, sign and OCR your PDFs. Fast, simple, no signup."
        keywords="PDF tools, merge PDF, split PDF, compress PDF, PDF to Word, PDF to JPG, edit PDF, sign PDF, online PDF, free PDF tools"
        canonical="https://duskypdf.com/"
        jsonLd={jsonLd}
      />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/80 via-white to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#C73E3A] bg-[#C73E3A]/10 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" /> 30+ PDF tools, one home
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Every tool you need <br className="hidden md:block" />
            to work with <span className="text-[#C73E3A]">PDFs</span> in one place
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Every tool you need to use PDFs, at your fingertips. Merge, split, compress, convert, rotate, unlock and watermark — all 100% free and easy to use.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link to="/merge-pdf" className="inline-flex items-center gap-2 bg-[#C73E3A] hover:bg-[#B2332F] text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-md shadow-[#C73E3A]/20 transition-colors">
              Start now <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#tools" className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-sm font-semibold px-5 py-3 rounded-lg transition-colors">
              Browse all tools
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
            {['No signup required', 'Works on any device', 'Secure processing', 'Free forever'].map(t => (
              <span key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Tools categorized */}
      <section id="tools" className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-6">
        {categorized.map(group => (
          <div key={group.title} className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">{group.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {group.slugs.map(s => bySlug[s] && <ToolCard key={s} tool={bySlug[s]} />)}
            </div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="bg-white border-t border-slate-100 mt-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">The PDF workflow that just works</h2>
            <p className="mt-3 text-slate-600">Crafted for speed, designed for simplicity. DuskyPDF delivers a premium experience with zero friction.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group bg-white border border-slate-200 rounded-xl p-6 hover:border-[#C73E3A]/40 hover:shadow-lg transition-all">
                  <div className="w-11 h-11 rounded-lg bg-[#C73E3A]/10 flex items-center justify-center mb-4 group-hover:bg-[#C73E3A] transition-colors">
                    <Icon className="w-5 h-5 text-[#C73E3A] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#C73E3A] to-[#8B2A28] text-white p-10 md:p-14 shadow-xl">
          <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-72 h-72 rounded-full bg-black/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold">Ready to streamline your PDFs?</h3>
              <p className="mt-2 text-white/85 max-w-xl">Pick a tool, drop your file, and get your result in seconds. No account needed.</p>
            </div>
            <Link to="/merge-pdf" className="inline-flex items-center gap-2 bg-white text-[#C73E3A] hover:bg-slate-100 text-sm font-semibold px-5 py-3 rounded-lg transition-colors shadow">
              Merge a PDF <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
