import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { TOOL_CATEGORIES, getToolsByCategory } from '../mock';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#C73E3A] to-[#8B2A28]">
                <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-xl font-extrabold text-white">Dusky<span className="text-[#E56864]">PDF</span></span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
              DuskyPDF is your online PDF companion. Every tool you need to work with PDFs in one place — fast, free and simple.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#C73E3A] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-white" />
                </button>
              ))}
            </div>
          </div>

          {TOOL_CATEGORIES.slice(0, 4).map(cat => (
            <div key={cat.id}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">{cat.label}</h4>
              <ul className="space-y-2">
                {getToolsByCategory(cat.id).slice(0, 6).map(t => (
                  <li key={t.slug}>
                    <Link to={`/${t.slug}`} className="text-[13px] text-slate-400 hover:text-[#E56864] transition-colors">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} DuskyPDF. A tribute clone built for learning.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300">Privacy</a>
            <a href="#" className="hover:text-slate-300">Terms</a>
            <a href="#" className="hover:text-slate-300">Cookies</a>
            <a href="#" className="hover:text-slate-300">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
