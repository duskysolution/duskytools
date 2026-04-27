import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, X, Globe, Flame } from 'lucide-react';
import { TOOL_CATEGORIES, getToolsByCategory, FEATURED_SLUGS, getToolBySlug } from '../mock';

const navItems = [
  { slug: 'merge-pdf', label: 'MERGE PDF' },
  { slug: 'split-pdf', label: 'SPLIT PDF' },
  { slug: 'compress-pdf', label: 'COMPRESS PDF' },
  { slug: 'pdf-to-word', label: 'CONVERT PDF' },
];

const Logo = () => (
  <Link to="/" className="flex items-center gap-2 select-none">
    <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#C73E3A] to-[#8B2A28] shadow-sm">
      <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
    </span>
    <span className="text-[1.35rem] font-extrabold tracking-tight text-slate-900">
      Dusky<span className="text-[#C73E3A]">PDF</span>
    </span>
  </Link>
);

const AllToolsMegaMenu = ({ onClose }) => (
  <div
    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[min(1100px,95vw)] bg-white rounded-xl shadow-2xl border border-slate-200 p-6 z-50"
    onMouseLeave={onClose}
  >
    <div className="grid grid-cols-3 gap-6">
      {TOOL_CATEGORIES.map(cat => (
        <div key={cat.id}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{cat.label}</h4>
          <ul className="space-y-2">
            {getToolsByCategory(cat.id).map(tool => {
              const Icon = tool.icon;
              return (
                <li key={tool.slug}>
                  <Link
                    to={`/${tool.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-[#C73E3A] hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: tool.color }} />
                    <span className="font-medium">{tool.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

export default function Header() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.slug}
                to={`/${item.slug}`}
                className="text-[13px] font-semibold text-slate-700 hover:text-[#C73E3A] px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
            >
              <button
                onClick={() => setMegaOpen(o => !o)}
                className="flex items-center gap-1 text-[13px] font-semibold text-slate-700 hover:text-[#C73E3A] px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                ALL PDF TOOLS <ChevronDown className="w-4 h-4" />
              </button>
              {megaOpen && <AllToolsMegaMenu onClose={() => setMegaOpen(false)} />}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden md:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors">
            <Globe className="w-4 h-4" /> EN
          </button>
          <button
            onClick={() => navigate('/merge-pdf')}
            className="hidden md:inline-flex items-center text-sm font-semibold text-white bg-[#C73E3A] hover:bg-[#B2332F] px-4 py-2 rounded-md transition-colors shadow-sm"
          >
            Get started
          </button>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            {FEATURED_SLUGS.map(slug => {
              const tool = getToolBySlug(slug);
              if (!tool) return null;
              const Icon = tool.icon;
              return (
                <Link
                  key={slug}
                  to={`/${slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50"
                >
                  <Icon className="w-4 h-4" style={{ color: tool.color }} />
                  <span className="text-sm text-slate-700 font-medium">{tool.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
