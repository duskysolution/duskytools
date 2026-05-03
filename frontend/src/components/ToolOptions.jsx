import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

/**
 * Tool-specific option controls.
 * opts is the options object; setOpts updates it.
 */
export default function ToolOptions({ slug, opts, setOpts, numPages }) {
  const update = (patch) => setOpts({ ...opts, ...patch });

  if (slug === 'split-pdf') {
    return (
      <div className="space-y-4">
        <RadioGroup
          value={opts.mode || 'ranges'}
          onValueChange={(v) => update({ mode: v })}
          className="grid grid-cols-2 gap-3"
        >
          <label className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#C73E3A]/50 has-[:checked]:border-[#C73E3A] has-[:checked]:bg-rose-50/40">
            <RadioGroupItem value="ranges" />
            <div>
              <div className="text-sm font-semibold">By range</div>
              <div className="text-xs text-slate-500">Extract a specific range</div>
            </div>
          </label>
          <label className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#C73E3A]/50 has-[:checked]:border-[#C73E3A] has-[:checked]:bg-rose-50/40">
            <RadioGroupItem value="each" />
            <div>
              <div className="text-sm font-semibold">Every page</div>
              <div className="text-xs text-slate-500">Split each page to a file</div>
            </div>
          </label>
        </RadioGroup>
        {opts.mode !== 'each' && (
          <div>
            <Label className="text-xs uppercase tracking-wider text-slate-500">Ranges</Label>
            <Input
              placeholder='e.g. "1-3, 5, 7-9"'
              value={opts.ranges || ''}
              onChange={(e) => update({ ranges: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-slate-400 mt-1">{numPages ? `Document has ${numPages} pages` : 'Upload a file to see page count'}</p>
          </div>
        )}
      </div>
    );
  }

  if (slug === 'compress-pdf') {
    return (
      <RadioGroup value={opts.level || 'recommended'} onValueChange={(v) => update({ level: v })} className="grid grid-cols-3 gap-3">
        {[
          { v: 'low', t: 'Less compression', d: 'High quality' },
          { v: 'recommended', t: 'Recommended', d: 'Good quality' },
          { v: 'extreme', t: 'Extreme', d: 'Smallest size' },
        ].map(o => (
          <label key={o.v} className="flex flex-col border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-[#C73E3A]/50 has-[:checked]:border-[#C73E3A] has-[:checked]:bg-rose-50/40">
            <div className="flex items-center gap-2">
              <RadioGroupItem value={o.v} />
              <span className="text-sm font-semibold">{o.t}</span>
            </div>
            <span className="text-xs text-slate-500 mt-1">{o.d}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

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

  if (slug === 'watermark') {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Watermark text</Label>
          <Input value={opts.text || ''} onChange={(e) => update({ text: e.target.value })} placeholder="CONFIDENTIAL" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-slate-500">Opacity ({Math.round((opts.opacity ?? 0.3) * 100)}%)</Label>
          <input
            type="range" min="0.1" max="1" step="0.05"
            value={opts.opacity ?? 0.3}
            onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-[#C73E3A] mt-2"
          />
        </div>
      </div>
    );
  }

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

  if (slug === 'unlock-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Password</Label>
        <Input type="password" value={opts.password || ''} onChange={(e) => update({ password: e.target.value })} placeholder="Enter PDF password" className="mt-1" />
      </div>
    );
  }

  if (slug === 'protect-pdf') {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wider text-slate-500">Set password</Label>
        <Input type="password" value={opts.password || ''} onChange={(e) => update({ password: e.target.value })} placeholder="Create a strong password" className="mt-1" />
      </div>
    );
  }

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

  return null;
}
