/**
 * DuskyPDF tool catalog.
 *
 * This file is the single source of truth for:
 *   - The list of tools displayed on the homepage
 *   - The metadata used by ToolPage (icon, color, description, accept, multiple)
 *   - Related-tools / category navigation
 *
 * `functional: true`  -> backend wired (real PDF processing)
 * `functional: false` -> UI-only (we don't have the dependencies in the runtime
 *                        e.g. LibreOffice for Office docs); user gets a friendly notice.
 */
import {
  Combine, Scissors, Minimize2, FileText, FileImage, Image as ImageIcon,
  RotateCw, Unlock, Lock, FilePlus2, FileSignature, Droplets, Hash, FileSearch,
  Presentation, Table, Sparkles, FileCode2, Crop, ScanLine,
  Layers, Pencil, FileX, Wand2, Trash2, FileOutput, Type, Grid3x3,
  Info, Palette, ImageDown, FileType, Eraser
} from 'lucide-react';

export const TOOL_CATEGORIES = [
  { id: 'organize', label: 'Organize PDF' },
  { id: 'optimize', label: 'Optimize PDF' },
  { id: 'convert-to', label: 'Convert to PDF' },
  { id: 'convert-from', label: 'Convert from PDF' },
  { id: 'edit', label: 'Edit PDF' },
  { id: 'security', label: 'PDF security' },
];

export const TOOLS = [
  // ---------- ORGANIZE ----------
  { slug: 'merge-pdf', name: 'Merge PDF', short: 'Combine PDFs in the order you want.', description: 'Combine multiple PDFs into a single document in the order you want. Fast, free and easy.', icon: Combine, color: '#E5322D', category: 'organize', accept: '.pdf', multiple: true, action: 'Merge PDFs', functional: true },
  { slug: 'split-pdf', name: 'Split PDF', short: 'Separate pages or extract a range.', description: 'Separate one page or a whole set for easy conversion into independent PDF files.', icon: Scissors, color: '#33C481', category: 'organize', accept: '.pdf', multiple: false, action: 'Split PDF', functional: true },
  { slug: 'organize-pdf', name: 'Organize PDF', short: 'Sort, delete or add pages.', description: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.', icon: Layers, color: '#F2A541', category: 'organize', accept: '.pdf', multiple: false, action: 'Organize PDF', functional: true },
  { slug: 'rotate-pdf', name: 'Rotate PDF', short: 'Rotate PDFs the way you need.', description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!', icon: RotateCw, color: '#6C63FF', category: 'organize', accept: '.pdf', multiple: true, action: 'Rotate PDFs', functional: true },
  { slug: 'remove-pages', name: 'Remove pages', short: 'Delete specific pages.', description: 'Remove unwanted pages from your PDF file. Lighten and tidy up your document in one click.', icon: Trash2, color: '#EF4444', category: 'organize', accept: '.pdf', multiple: false, action: 'Remove pages', functional: true },
  { slug: 'extract-pages', name: 'Extract pages', short: 'Pull out selected pages.', description: 'Extract one or more pages from your PDF file. Choose specific pages and create a new PDF.', icon: FileOutput, color: '#10B981', category: 'organize', accept: '.pdf', multiple: false, action: 'Extract pages', functional: true },
  { slug: 'n-up-pdf', name: 'N-up PDF', short: '2, 4, or 6 pages per sheet.', description: 'Save paper and ink by combining multiple PDF pages onto a single sheet. Choose 2, 4, or 6 pages per sheet.', icon: Grid3x3, color: '#0EA5E9', category: 'organize', accept: '.pdf', multiple: false, action: 'Make N-up', functional: true },

  // ---------- OPTIMIZE ----------
  { slug: 'compress-pdf', name: 'Compress PDF', short: 'Reduce PDF size, keep the quality.', description: 'Reduce file size while optimizing for maximal PDF quality.', icon: Minimize2, color: '#33A1FD', category: 'optimize', accept: '.pdf', multiple: true, action: 'Compress PDF', functional: true },
  { slug: 'grayscale-pdf', name: 'Grayscale PDF', short: 'Convert color to grayscale.', description: 'Make your PDF look black and white. Great for printing or saving toner.', icon: Palette, color: '#475569', category: 'optimize', accept: '.pdf', multiple: false, action: 'Convert to grayscale', functional: true },
  { slug: 'repair-pdf', name: 'Repair PDF', short: 'Recover a damaged PDF.', description: 'Repair a damaged PDF and recover data from corrupt PDF files.', icon: Wand2, color: '#845EC2', category: 'optimize', accept: '.pdf', multiple: false, action: 'Repair PDF', functional: true },
  { slug: 'ocr-pdf', name: 'OCR PDF', short: 'Make scanned PDFs searchable.', description: 'Easily convert scanned PDF into searchable and selectable documents using optical character recognition.', icon: ScanLine, color: '#FF6F91', category: 'optimize', accept: '.pdf', multiple: false, action: 'OCR PDF', functional: true },
  { slug: 'pdf-info', name: 'PDF Info', short: 'Inspect metadata & stats.', description: 'Generate a detailed report of your PDF: title, author, dimensions, encryption status, and more.', icon: Info, color: '#06B6D4', category: 'optimize', accept: '.pdf', multiple: false, action: 'Get PDF info', functional: true },

  // ---------- CONVERT TO ----------
  { slug: 'jpg-to-pdf', name: 'JPG to PDF', short: 'Convert JPG images to PDF.', description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: ImageIcon, color: '#FFC75F', category: 'convert-to', accept: 'image/*', multiple: true, action: 'Convert to PDF', functional: true },
  { slug: 'word-to-pdf', name: 'WORD to PDF', short: 'Make DOC and DOCX into PDF.', description: 'Make DOC and DOCX files easy to read by converting them to PDF.', icon: FileText, color: '#2B7AFA', category: 'convert-to', accept: '.doc,.docx', multiple: true, action: 'Convert to PDF', functional: false },
  { slug: 'powerpoint-to-pdf', name: 'POWERPOINT to PDF', short: 'PPT & PPTX into PDF.', description: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.', icon: Presentation, color: '#F16A3B', category: 'convert-to', accept: '.ppt,.pptx', multiple: true, action: 'Convert to PDF', functional: false },
  { slug: 'excel-to-pdf', name: 'EXCEL to PDF', short: 'XLS & XLSX into PDF.', description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.', icon: Table, color: '#28A745', category: 'convert-to', accept: '.xls,.xlsx', multiple: true, action: 'Convert to PDF', functional: false },
  { slug: 'html-to-pdf', name: 'HTML to PDF', short: 'Render an HTML file to PDF.', description: 'Convert an HTML file to PDF. Drop in your .html file and download a clean PDF version.', icon: FileCode2, color: '#E94F64', category: 'convert-to', accept: '.html,.htm', multiple: false, action: 'Convert to PDF', functional: true },
  { slug: 'text-to-pdf', name: 'TEXT to PDF', short: 'Plain text to clean PDF.', description: 'Turn a .txt file into a paginated, easy-to-read PDF document.', icon: Type, color: '#7C3AED', category: 'convert-to', accept: '.txt', multiple: false, action: 'Convert to PDF', functional: true },

  // ---------- CONVERT FROM ----------
  { slug: 'pdf-to-jpg', name: 'PDF to JPG', short: 'Convert each page to a JPG.', description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: FileImage, color: '#FFC75F', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to JPG', functional: true },
  { slug: 'pdf-to-word', name: 'PDF to WORD', short: 'Convert PDFs to DOCX.', description: 'Easily convert your PDF files into easy-to-edit DOC and DOCX documents.', icon: FileText, color: '#2B7AFA', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to WORD', functional: true },
  { slug: 'pdf-to-powerpoint', name: 'PDF to POWERPOINT', short: 'Turn PDFs into editable PPTX.', description: 'Turn your PDF files into easy-to-edit PPT and PPTX slideshows.', icon: Presentation, color: '#F16A3B', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to PPT', functional: false },
  { slug: 'pdf-to-excel', name: 'PDF to EXCEL', short: 'Pull data into spreadsheets.', description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.', icon: Table, color: '#28A745', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to EXCEL', functional: false },
  { slug: 'pdf-to-text', name: 'PDF to TEXT', short: 'Extract plain text from PDFs.', description: 'Extract all readable text from your PDF and save it as a plain .txt file.', icon: FileType, color: '#0F766E', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Extract text', functional: true },
  { slug: 'extract-images', name: 'Extract images', short: 'Pull all images from a PDF.', description: 'Extract every embedded image from your PDF and download them as a single zip.', icon: ImageDown, color: '#D97706', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Extract images', functional: true },

  // ---------- EDIT ----------
  { slug: 'edit-pdf', name: 'Edit PDF', short: 'Add text annotations.', description: 'Add a text annotation anywhere on a chosen page of your PDF document.', icon: Pencil, color: '#7A5FFF', category: 'edit', accept: '.pdf', multiple: false, action: 'Edit PDF', functional: true },
  { slug: 'page-numbers', name: 'Page numbers', short: 'Add page numbers into PDFs.', description: 'Add page numbers into PDFs with ease. Choose position, dimensions and typography.', icon: Hash, color: '#10B3AE', category: 'edit', accept: '.pdf', multiple: false, action: 'Add page numbers', functional: true },
  { slug: 'watermark', name: 'Watermark', short: 'Stamp an image or text.', description: 'Stamp an image or text over your PDF in seconds. Choose typography and position.', icon: Droplets, color: '#36C5F0', category: 'edit', accept: '.pdf', multiple: true, action: 'Add watermark', functional: true },
  { slug: 'crop-pdf', name: 'Crop PDF', short: 'Crop margins of PDF.', description: 'Crop margins of PDF documents or select specific areas, then apply the changes.', icon: Crop, color: '#FF6F91', category: 'edit', accept: '.pdf', multiple: false, action: 'Crop PDF', functional: true },

  // ---------- SECURITY ----------
  { slug: 'unlock-pdf', name: 'Unlock PDF', short: 'Remove password security.', description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.', icon: Unlock, color: '#22C55E', category: 'security', accept: '.pdf', multiple: true, action: 'Unlock PDF', functional: true },
  { slug: 'protect-pdf', name: 'Protect PDF', short: 'Encrypt with a password.', description: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.', icon: Lock, color: '#EF4444', category: 'security', accept: '.pdf', multiple: true, action: 'Protect PDF', functional: true },
  { slug: 'sign-pdf', name: 'Sign PDF', short: 'Add a quick text signature.', description: 'Add a text-based signature to a chosen page of your PDF document.', icon: FileSignature, color: '#FF8A00', category: 'security', accept: '.pdf', multiple: false, action: 'Sign PDF', functional: true },
  { slug: 'redact-pdf', name: 'Redact PDF', short: 'Redact sensitive text / graphics.', description: 'Redact text and graphics to permanently remove sensitive information from a PDF.', icon: Eraser, color: '#1F2937', category: 'security', accept: '.pdf', multiple: false, action: 'Redact PDF', functional: false },
  { slug: 'compare-pdf', name: 'Compare PDF', short: 'Show differences between PDFs.', description: 'Show a side-by-side document comparison and easily spot changes between different file versions.', icon: FileSearch, color: '#0EA5E9', category: 'security', accept: '.pdf', multiple: true, action: 'Compare PDFs', functional: false },
];

export const FEATURED_SLUGS = TOOLS.map(t => t.slug);

export const getToolBySlug = (slug) => TOOLS.find(t => t.slug === slug);
export const getToolsByCategory = (catId) => TOOLS.filter(t => t.category === catId);

export const FEATURES = [
  { title: 'Tools for every need', text: 'More than 30 tools to handle PDF files. Merge, split, compress, convert, edit, sign, and more.', icon: Sparkles },
  { title: 'Simple and fast', text: 'Drop your file, pick an action, and download. No installations, no registrations needed.', icon: Wand2 },
  { title: 'Works on any device', text: 'Access DuskyPDF tools from any device with a web browser. Your workflow, uninterrupted.', icon: FilePlus2 },
  { title: 'Secure by default', text: 'Files are processed over encrypted connections and deleted automatically within an hour.', icon: Lock },
];

/** SEO descriptions per tool (used for <meta description>). */
export const SEO_DESCRIPTIONS = {
  default: 'DuskyPDF — every tool you need to work with PDFs. Merge, split, compress, convert, edit, sign and OCR your PDFs online. 100% free, no signup.',
};
