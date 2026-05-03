import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

/**
 * Tool-specific option controls.
 * Renders the right inputs/selects for the active tool slug.
 *
 * Props:
 *   slug      : tool slug (string)
 *   opts      : current options object
 *   setOpts   : setter (next opts -> void)
 *   numPages  : page count of the loaded PDF (for hint text)
 */
export default function ToolOptions({ slug, opts, setOpts, numPages }) {
  const update = (patch) => setOpts({ ...opts, ...patch });

  // ---- SPLIT ----
  if (slug === 'split-pdf') {
    return (
      <div className="space-y-4">
        <RadioGroup
          value={opts.mode || 'ranges'}
          onValueChange={(v) => update({ mode: v })}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { v: 'ranges', t: 'By range', d: 'Extract a specific range' },
            { v: 'each', t: 'Every page', d: 'Split each page to a file' },
          ].map(o => (
            <label key={o.v} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#C73E3A]/50 has-[:checked]:border-[#C73E3A] has-[:checked]:bg-rose-50/40">
              <RadioGroupItem value={o.v} />
              <div>
                <div className="text-sm font-semibold">{o.t}</div>
                <div className="text-xs text-slate-500">{o.d}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
        {opts.mode !== 'each' && (
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">Ranges</Label>
            <Input placeholder='e.g. "1-3, 5, 7-9"' value={opts.ranges || ''} onChange={(e) => update({ ranges: e.target.value })} className="mt-1" />
            <p className="text-xs text-slate-400 mt-1">{numPages ? `Document has ${numPages} pages` : 'Upload a file to see page count'}</p>
          </div>
        )}
      </div>
    );
  }

  // ---- COMPRESS ----
  if (slug === 'compress-pdf') {
    return (
      <RadioGroup value={opts.level || 'recommended'} onValueChange={(v) => update({ level: v })} className="grid grid-cols-1 gap-3">
        {[
          { v: 'low', t: 'Less compression', d: 'High quality' },
          { v: 'recommended', t: 'Recommended', d: 'Good quality / smaller size' },
          { v: 'extreme', t: 'Extreme', d: 'Smallest size' },
        ].map(o => (
          <label key={o.v} className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#C73E3A]/50 has-[:checked]:border-[#C73E3A] has-[:checked]:bg-rose-50/40">
            <RadioGroupItem value={o.v} />
            <div>
              <div className="text-sm font-semibold">{o.t}</div>
              <div className="text-xs text-slate-500">{o.d}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    );
  }

  // ---- ROTATE ----
  if (slug === 'rotate-pdf') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Degrees</Label>
          <Select value={String(opts.degrees || 90)} onValueChange={(v) => update({ degrees: parseInt(v) })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90° Clockwise</SelectItem>
              <SelectItem value="180">180°</SelectItem>
              <SelectItem value="270">270° (90° CCW)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Pages</Label>
          <Input placeholder='"all" or e.g. "1-3, 5"' value={opts.pages || 'all'} onChange={(e) => update({ pages: e.target.value })} className="mt-1" />
        </div>
      </div>
    );
  }

  // ---- WATERMARK ----
  if (slug === 'watermark') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Watermark text</Label>
          <Input value={opts.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="CONFIDENTIAL" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Opacity ({Math.round((opts.opacity ?? 0.3) * 100)}%)</Label>
          <input type="range" min="0.1" max="1" step="0.05" value={opts.opacity ?? 0.3}
            onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-[#C73E3A] mt-2" />
        </div>
      </div>
    );
  }

  // ---- PAGE NUMBERS ----
  if (slug === 'page-numbers') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Position</Label>
          <Select value={opts.position || 'bottom-center'} onValueChange={(v) => update({ position: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-center">Bottom center</SelectItem>
              <SelectItem value="bottom-right">Bottom right</SelectItem>
              <SelectItem value="top-right">Top right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Format</Label>
          <Input value={opts.format || 'Page {n} of {total}'} onChange={(e) => update({ format: e.target.value })} className="mt-1" />
          <p className="text-xs text-slate-400 mt-1">Use {'{n}'} and {'{total}'} placeholders.</p>
        </div>
      </div>
    );
  }

  // ---- PDF -> JPG ----
  if (slug === 'pdf-to-jpg') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Quality (DPI)</Label>
        <Select value={String(opts.dpi || 150)} onValueChange={(v) => update({ dpi: parseInt(v) })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="72">72 DPI (small)</SelectItem>
            <SelectItem value="150">150 DPI (good)</SelectItem>
            <SelectItem value="300">300 DPI (high)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // ---- UNLOCK ----
  if (slug === 'unlock-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Password</Label>
        <Input type="password" value={opts.password || ''} onChange={(e) => update({ password: e.target.value })} placeholder="Enter PDF password" className="mt-1" />
      </div>
    );
  }

  // ---- PROTECT ----
  if (slug === 'protect-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Set password</Label>
        <Input type="password" value={opts.password || ''} onChange={(e) => update({ password: e.target.value })} placeholder="Create a strong password" className="mt-1" />
      </div>
    );
  }

  // ---- CROP ----
  if (slug === 'crop-pdf') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {['top','right','bottom','left'].map(k => (
          <div key={k}>
            <Label className="text-xs uppercase tracking-wider text-slate-500">{k} margin (%)</Label>
            <Input type="number" min="0" max="45" value={opts[k] ?? 0} onChange={(e) => update({ [k]: parseFloat(e.target.value || 0) })} className="mt-1" />
          </div>
        ))}
      </div>
    );
  }

  // ---- REMOVE / EXTRACT PAGES ----
  if (slug === 'remove-pages' || slug === 'extract-pages') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">
          {slug === 'remove-pages' ? 'Pages to remove' : 'Pages to keep'}
        </Label>
        <Input placeholder='e.g. "1-3, 5, 7"' value={opts.pages || ''} onChange={(e) => update({ pages: e.target.value })} className="mt-1" />
        <p className="text-xs text-slate-400 mt-1">{numPages ? `Document has ${numPages} pages` : 'Upload a file to see page count'}</p>
      </div>
    );
  }

  // ---- N-UP ----
  if (slug === 'n-up-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Pages per sheet</Label>
        <Select value={String(opts.n || 2)} onValueChange={(v) => update({ n: parseInt(v) })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2-up (1×2)</SelectItem>
            <SelectItem value="4">4-up (2×2)</SelectItem>
            <SelectItem value="6">6-up (3×2)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // ---- GRAYSCALE ----
  if (slug === 'grayscale-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Render quality (DPI)</Label>
        <Select value={String(opts.dpi || 150)} onValueChange={(v) => update({ dpi: parseInt(v) })}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="110">110 DPI</SelectItem>
            <SelectItem value="150">150 DPI (recommended)</SelectItem>
            <SelectItem value="200">200 DPI</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // ---- SIGN ----
  if (slug === 'sign-pdf') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Signature text</Label>
          <Input value={opts.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="Your name" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Position</Label>
          <Select value={opts.position || 'bottom-right'} onValueChange={(v) => update({ position: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom right</SelectItem>
              <SelectItem value="bottom-left">Bottom left</SelectItem>
              <SelectItem value="top-right">Top right</SelectItem>
              <SelectItem value="top-left">Top left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Page number (blank = last)</Label>
          <Input type="number" min="1" value={opts.page || ''} onChange={(e) => update({ page: e.target.value ? parseInt(e.target.value) : undefined })} className="mt-1" placeholder={numPages ? String(numPages) : '1'} />
        </div>
      </div>
    );
  }

  // ---- EDIT ----
  if (slug === 'edit-pdf') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Annotation text</Label>
          <Input value={opts.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="Hello world" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">Page</Label>
            <Input type="number" min="1" value={opts.page || 1} onChange={(e) => update({ page: parseInt(e.target.value || 1) })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">Font size</Label>
            <Input type="number" min="6" max="96" value={opts.size || 14} onChange={(e) => update({ size: parseInt(e.target.value || 14) })} className="mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">X (% from left)</Label>
            <Input type="number" min="0" max="100" value={opts.x ?? 10} onChange={(e) => update({ x: parseFloat(e.target.value || 0) })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">Y (% from top)</Label>
            <Input type="number" min="0" max="100" value={opts.y ?? 10} onChange={(e) => update({ y: parseFloat(e.target.value || 0) })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Color</Label>
          <input type="color" value={opts.color || '#111111'} onChange={(e) => update({ color: e.target.value })} className="mt-1 h-10 w-full rounded border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-500">No options needed — just click {('Process').toUpperCase()}.</p>
  );
}
