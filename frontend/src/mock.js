import {
  Combine, Scissors, Minimize2, FileText, FileType, FileImage, Image as ImageIcon,
  RotateCw, Unlock, Lock, FilePlus2, FileSignature, Droplets, Hash, FileSearch,
  FileEdit, Presentation, Table, Sparkles, FileCode2, PenTool, Crop, ScanLine,
  Layers, Pencil, FileX, Wand2
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
  // Organize
  { slug: 'merge-pdf', name: 'Merge PDF', short: 'Combine PDFs in the order you want.', description: 'Combine multiple PDFs into a single document in the order you want. Fast, free and easy.', icon: Combine, color: '#E5322D', category: 'organize', accept: '.pdf', multiple: true, action: 'Merge PDFs' },
  { slug: 'split-pdf', name: 'Split PDF', short: 'Separate pages or extract a range.', description: 'Separate one page or a whole set for easy conversion into independent PDF files.', icon: Scissors, color: '#33C481', category: 'organize', accept: '.pdf', multiple: false, action: 'Split PDF' },
  { slug: 'organize-pdf', name: 'Organize PDF', short: 'Sort, delete or add pages.', description: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages.', icon: Layers, color: '#F2A541', category: 'organize', accept: '.pdf', multiple: false, action: 'Organize PDF' },
  { slug: 'rotate-pdf', name: 'Rotate PDF', short: 'Rotate PDFs the way you need.', description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!', icon: RotateCw, color: '#6C63FF', category: 'organize', accept: '.pdf', multiple: true, action: 'Rotate PDFs' },

  // Optimize
  { slug: 'compress-pdf', name: 'Compress PDF', short: 'Reduce PDF size, keep the quality.', description: 'Reduce file size while optimizing for maximal PDF quality.', icon: Minimize2, color: '#33A1FD', category: 'optimize', accept: '.pdf', multiple: true, action: 'Compress PDF' },
  { slug: 'repair-pdf', name: 'Repair PDF', short: 'Recover a damaged PDF.', description: 'Repair a damaged PDF and recover data from corrupt PDF.', icon: Wand2, color: '#845EC2', category: 'optimize', accept: '.pdf', multiple: false, action: 'Repair PDF' },
  { slug: 'ocr-pdf', name: 'OCR PDF', short: 'Convert scanned PDFs to text.', description: 'Easily convert scanned PDF into searchable and selectable documents.', icon: ScanLine, color: '#FF6F91', category: 'optimize', accept: '.pdf', multiple: false, action: 'OCR PDF' },

  // Convert TO PDF
  { slug: 'jpg-to-pdf', name: 'JPG to PDF', short: 'Convert JPG images to PDF.', description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: ImageIcon, color: '#FFC75F', category: 'convert-to', accept: 'image/*', multiple: true, action: 'Convert to PDF' },
  { slug: 'word-to-pdf', name: 'WORD to PDF', short: 'Make DOC and DOCX into PDF.', description: 'Make DOC and DOCX files easy to read by converting them to PDF.', icon: FileText, color: '#2B7AFA', category: 'convert-to', accept: '.doc,.docx', multiple: true, action: 'Convert to PDF' },
  { slug: 'powerpoint-to-pdf', name: 'POWERPOINT to PDF', short: 'PPT & PPTX into PDF.', description: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.', icon: Presentation, color: '#F16A3B', category: 'convert-to', accept: '.ppt,.pptx', multiple: true, action: 'Convert to PDF' },
  { slug: 'excel-to-pdf', name: 'EXCEL to PDF', short: 'XLS & XLSX into PDF.', description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.', icon: Table, color: '#28A745', category: 'convert-to', accept: '.xls,.xlsx', multiple: true, action: 'Convert to PDF' },
  { slug: 'html-to-pdf', name: 'HTML to PDF', short: 'Convert webpages in HTML to PDF.', description: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page.', icon: FileCode2, color: '#E94F64', category: 'convert-to', accept: '.html,.htm', multiple: false, action: 'Convert to PDF' },

  // Convert FROM PDF
  { slug: 'pdf-to-jpg', name: 'PDF to JPG', short: 'Convert each page to a JPG.', description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: FileImage, color: '#FFC75F', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to JPG' },
  { slug: 'pdf-to-word', name: 'PDF to WORD', short: 'Convert PDFs to DOCX.', description: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.', icon: FileText, color: '#2B7AFA', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to WORD' },
  { slug: 'pdf-to-powerpoint', name: 'PDF to POWERPOINT', short: 'Turn PDFs into editable PPTX.', description: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.', icon: Presentation, color: '#F16A3B', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to PPT' },
  { slug: 'pdf-to-excel', name: 'PDF to EXCEL', short: 'Pull data into spreadsheets.', description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.', icon: Table, color: '#28A745', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to EXCEL' },
  { slug: 'pdf-to-pdfa', name: 'PDF to PDF/A', short: 'Convert to PDF/A for archiving.', description: 'Transform your PDF to PDF/A, the ISO-standardized version for archiving.', icon: FileType, color: '#845EC2', category: 'convert-from', accept: '.pdf', multiple: false, action: 'Convert to PDF/A' },

  // Edit
  { slug: 'edit-pdf', name: 'Edit PDF', short: 'Add text, shapes, images.', description: 'Add text, images, shapes or freehand annotations to a PDF document.', icon: Pencil, color: '#7A5FFF', category: 'edit', accept: '.pdf', multiple: false, action: 'Edit PDF' },
  { slug: 'page-numbers', name: 'Page numbers', short: 'Add page numbers into PDFs.', description: 'Add page numbers into PDFs with ease. Choose position, dimensions and typography.', icon: Hash, color: '#10B3AE', category: 'edit', accept: '.pdf', multiple: false, action: 'Add page numbers' },
  { slug: 'watermark', name: 'Watermark', short: 'Stamp an image or text.', description: 'Stamp an image or text over your PDF in seconds. Choose typography and position.', icon: Droplets, color: '#36C5F0', category: 'edit', accept: '.pdf', multiple: true, action: 'Add watermark' },
  { slug: 'crop-pdf', name: 'Crop PDF', short: 'Crop margins of PDF.', description: 'Crop margins of PDF documents or select specific areas, then apply the changes.', icon: Crop, color: '#FF6F91', category: 'edit', accept: '.pdf', multiple: false, action: 'Crop PDF' },

  // Security
  { slug: 'unlock-pdf', name: 'Unlock PDF', short: 'Remove password security.', description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.', icon: Unlock, color: '#22C55E', category: 'security', accept: '.pdf', multiple: true, action: 'Unlock PDF' },
  { slug: 'protect-pdf', name: 'Protect PDF', short: 'Encrypt with a password.', description: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.', icon: Lock, color: '#EF4444', category: 'security', accept: '.pdf', multiple: true, action: 'Protect PDF' },
  { slug: 'sign-pdf', name: 'Sign PDF', short: 'Sign yourself or request signatures.', description: 'Sign yourself or request electronic signatures from others.', icon: FileSignature, color: '#FF8A00', category: 'security', accept: '.pdf', multiple: false, action: 'Sign PDF' },
  { slug: 'redact-pdf', name: 'Redact PDF', short: 'Redact sensitive text / graphics.', description: 'Redact text and graphics to permanently remove sensitive information from a PDF.', icon: FileX, color: '#1F2937', category: 'security', accept: '.pdf', multiple: false, action: 'Redact PDF' },
  { slug: 'compare-pdf', name: 'Compare PDF', short: 'Show differences between PDFs.', description: 'Show a side-by-side document comparison and easily spot changes between different file versions.', icon: FileSearch, color: '#0EA5E9', category: 'security', accept: '.pdf', multiple: true, action: 'Compare PDFs' },
];

export const FEATURED_SLUGS = [
  'merge-pdf','split-pdf','compress-pdf','pdf-to-word','word-to-pdf','pdf-to-jpg','jpg-to-pdf','pdf-to-powerpoint','powerpoint-to-pdf','pdf-to-excel','excel-to-pdf','edit-pdf','sign-pdf','watermark','rotate-pdf','unlock-pdf','protect-pdf','organize-pdf','html-to-pdf','page-numbers','ocr-pdf','repair-pdf','crop-pdf','pdf-to-pdfa','redact-pdf','compare-pdf'
];

export const getToolBySlug = (slug) => TOOLS.find(t => t.slug === slug);
export const getToolsByCategory = (catId) => TOOLS.filter(t => t.category === catId);

export const FEATURES = [
  { title: 'Tools for every need', text: 'More than 25 tools to handle PDF files. Merge, split, compress, convert, edit, sign, and more.', icon: Sparkles },
  { title: 'Simple and fast', text: 'Drop your file, pick an action, and download. No installations, no registrations needed.', icon: Wand2 },
  { title: 'Works on any device', text: 'Access DuskyPDF tools from any device with a web browser. Your workflow, uninterrupted.', icon: FilePlus2 },
  { title: 'Secure by default', text: 'Files are processed over encrypted connections and deleted shortly after processing.', icon: Lock },
];
