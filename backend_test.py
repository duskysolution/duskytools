#!/usr/bin/env python3
"""
DuskyPDF Backend QA Round 2 - Test Script
Tests 11 new PDF tools + SEO endpoints + health check
"""
import io
import os
import sys
import json
import zipfile
import requests
from pathlib import Path
from PIL import Image
import fitz  # PyMuPDF for generating test PDFs

# Backend URL from environment
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://format-hub-14.preview.emergentagent.com")
API_BASE = f"{BACKEND_URL}/api"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log(msg, level="INFO"):
    """Simple logging"""
    print(f"[{level}] {msg}")

def generate_test_pdf(pages=5, with_text=True, with_image=False):
    """Generate a test PDF with specified number of pages"""
    doc = fitz.open()
    for i in range(pages):
        page = doc.new_page(width=595, height=842)  # A4
        if with_text:
            page.insert_text((50, 50), f"Page {i+1} of {pages}", fontsize=20)
            page.insert_text((50, 100), f"This is test content on page {i+1}.", fontsize=12)
        if with_image and i == 0:
            # Insert a small test image on first page
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            page.insert_image(fitz.Rect(100, 200, 200, 300), stream=img_bytes.getvalue())
    
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_tool(slug, files_data, options=None, expected_mime=None, expected_ext=None):
    """
    Test a PDF tool endpoint
    files_data: list of tuples (filename, bytes, mime)
    options: dict of options
    expected_mime: expected MIME type of result
    expected_ext: expected file extension
    """
    results["total"] += 1
    test_name = f"Tool: {slug}"
    
    try:
        log(f"Testing {slug}...")
        
        # Prepare multipart form data
        files = []
        for i, (fname, fbytes, fmime) in enumerate(files_data):
            files.append(('files', (fname, io.BytesIO(fbytes), fmime)))
        
        data = {}
        if options:
            data['options'] = json.dumps(options)
        
        # POST to tool endpoint
        url = f"{API_BASE}/tools/{slug}/process"
        resp = requests.post(url, files=files, data=data, timeout=60)
        
        if resp.status_code != 200:
            results["failed"].append(f"{test_name}: HTTP {resp.status_code} - {resp.text[:200]}")
            log(f"FAILED {slug}: HTTP {resp.status_code}", "ERROR")
            return False
        
        result = resp.json()
        
        # Check response structure
        if not result.get("success"):
            results["failed"].append(f"{test_name}: success=false")
            log(f"FAILED {slug}: success=false", "ERROR")
            return False
        
        if "download_url" not in result:
            results["failed"].append(f"{test_name}: missing download_url")
            log(f"FAILED {slug}: missing download_url", "ERROR")
            return False
        
        # Check file size
        if result.get("size", 0) <= 0:
            results["failed"].append(f"{test_name}: file size is 0")
            log(f"FAILED {slug}: file size is 0", "ERROR")
            return False
        
        # Verify download URL works
        download_url = f"{BACKEND_URL}{result['download_url']}" if result['download_url'].startswith('/') else result['download_url']
        log(f"  Download URL: {download_url}")
        log(f"  Token: {result.get('token')}")
        dl_resp = requests.get(download_url, timeout=30)
        
        if dl_resp.status_code != 200:
            results["failed"].append(f"{test_name}: download failed HTTP {dl_resp.status_code} - URL: {download_url}")
            log(f"FAILED {slug}: download failed HTTP {dl_resp.status_code}", "ERROR")
            log(f"  Response: {dl_resp.text[:200]}", "ERROR")
            return False
        
        # Check MIME type if specified
        if expected_mime:
            content_type = dl_resp.headers.get('content-type', '').split(';')[0].strip()
            if expected_mime not in content_type:
                results["failed"].append(f"{test_name}: expected MIME {expected_mime}, got {content_type}")
                log(f"FAILED {slug}: wrong MIME type", "ERROR")
                return False
        
        # Check file extension if specified
        if expected_ext:
            if not result.get("filename", "").endswith(expected_ext):
                results["failed"].append(f"{test_name}: expected ext {expected_ext}, got {result.get('filename')}")
                log(f"FAILED {slug}: wrong file extension", "ERROR")
                return False
        
        # Verify downloaded content size
        if len(dl_resp.content) == 0:
            results["failed"].append(f"{test_name}: downloaded file is empty")
            log(f"FAILED {slug}: downloaded file is empty", "ERROR")
            return False
        
        results["passed"].append(test_name)
        log(f"PASSED {slug}", "SUCCESS")
        return True
        
    except Exception as e:
        results["failed"].append(f"{test_name}: Exception - {str(e)}")
        log(f"FAILED {slug}: {str(e)}", "ERROR")
        return False

def test_seo_endpoints():
    """Test SEO endpoints: sitemap.xml, robots.txt, ads.txt"""
    
    # Test sitemap.xml
    results["total"] += 1
    try:
        log("Testing GET /api/sitemap.xml...")
        resp = requests.get(f"{API_BASE}/sitemap.xml", timeout=10)
        
        if resp.status_code != 200:
            results["failed"].append(f"sitemap.xml: HTTP {resp.status_code}")
            log("FAILED sitemap.xml: wrong status code", "ERROR")
        elif 'application/xml' not in resp.headers.get('content-type', ''):
            results["failed"].append(f"sitemap.xml: wrong content-type {resp.headers.get('content-type')}")
            log("FAILED sitemap.xml: wrong content-type", "ERROR")
        elif '<urlset' not in resp.text:
            results["failed"].append("sitemap.xml: missing <urlset>")
            log("FAILED sitemap.xml: missing <urlset>", "ERROR")
        elif resp.text.count('<url>') < 26:
            results["failed"].append(f"sitemap.xml: only {resp.text.count('<url>')} URLs, expected at least 26")
            log(f"FAILED sitemap.xml: only {resp.text.count('<url>')} URLs", "ERROR")
        else:
            results["passed"].append("SEO: sitemap.xml")
            log("PASSED sitemap.xml", "SUCCESS")
    except Exception as e:
        results["failed"].append(f"sitemap.xml: Exception - {str(e)}")
        log(f"FAILED sitemap.xml: {str(e)}", "ERROR")
    
    # Test robots.txt
    results["total"] += 1
    try:
        log("Testing GET /api/robots.txt...")
        resp = requests.get(f"{API_BASE}/robots.txt", timeout=10)
        
        if resp.status_code != 200:
            results["failed"].append(f"robots.txt: HTTP {resp.status_code}")
            log("FAILED robots.txt: wrong status code", "ERROR")
        elif 'text/plain' not in resp.headers.get('content-type', ''):
            results["failed"].append(f"robots.txt: wrong content-type {resp.headers.get('content-type')}")
            log("FAILED robots.txt: wrong content-type", "ERROR")
        elif 'User-agent: *' not in resp.text:
            results["failed"].append("robots.txt: missing 'User-agent: *'")
            log("FAILED robots.txt: missing User-agent", "ERROR")
        elif 'Sitemap:' not in resp.text:
            results["failed"].append("robots.txt: missing 'Sitemap:' line")
            log("FAILED robots.txt: missing Sitemap line", "ERROR")
        else:
            results["passed"].append("SEO: robots.txt")
            log("PASSED robots.txt", "SUCCESS")
    except Exception as e:
        results["failed"].append(f"robots.txt: Exception - {str(e)}")
        log(f"FAILED robots.txt: {str(e)}", "ERROR")
    
    # Test ads.txt
    results["total"] += 1
    try:
        log("Testing GET /api/ads.txt...")
        resp = requests.get(f"{API_BASE}/ads.txt", timeout=10)
        
        if resp.status_code != 200:
            results["failed"].append(f"ads.txt: HTTP {resp.status_code}")
            log("FAILED ads.txt: wrong status code", "ERROR")
        elif 'text/plain' not in resp.headers.get('content-type', ''):
            results["failed"].append(f"ads.txt: wrong content-type {resp.headers.get('content-type')}")
            log("FAILED ads.txt: wrong content-type", "ERROR")
        elif 'pub-DUSKYTEST01' not in resp.text:
            results["failed"].append("ads.txt: missing 'pub-DUSKYTEST01'")
            log("FAILED ads.txt: missing pub-DUSKYTEST01", "ERROR")
        else:
            results["passed"].append("SEO: ads.txt")
            log("PASSED ads.txt", "SUCCESS")
    except Exception as e:
        results["failed"].append(f"ads.txt: Exception - {str(e)}")
        log(f"FAILED ads.txt: {str(e)}", "ERROR")

def test_health_endpoint():
    """Test health endpoint returns tool_count=26"""
    results["total"] += 1
    try:
        log("Testing GET /api/ (health check)...")
        resp = requests.get(f"{API_BASE}/", timeout=10)
        
        if resp.status_code != 200:
            results["failed"].append(f"Health endpoint: HTTP {resp.status_code}")
            log("FAILED health endpoint: wrong status code", "ERROR")
            return
        
        data = resp.json()
        
        if data.get("tool_count") != 26:
            results["failed"].append(f"Health endpoint: tool_count={data.get('tool_count')}, expected 26")
            log(f"FAILED health endpoint: tool_count={data.get('tool_count')}", "ERROR")
            return
        
        if len(data.get("tools", [])) != 26:
            results["failed"].append(f"Health endpoint: {len(data.get('tools', []))} tools listed, expected 26")
            log(f"FAILED health endpoint: wrong tools count", "ERROR")
            return
        
        results["passed"].append("Health endpoint: tool_count=26")
        log("PASSED health endpoint", "SUCCESS")
        
    except Exception as e:
        results["failed"].append(f"Health endpoint: Exception - {str(e)}")
        log(f"FAILED health endpoint: {str(e)}", "ERROR")

def main():
    log(f"Starting DuskyPDF Backend QA Round 2")
    log(f"Backend URL: {BACKEND_URL}")
    log(f"API Base: {API_BASE}")
    log("=" * 60)
    
    # Test health endpoint first
    test_health_endpoint()
    
    # Test SEO endpoints
    test_seo_endpoints()
    
    # Generate test PDFs
    pdf_5pages = generate_test_pdf(pages=5, with_text=True)
    pdf_4pages = generate_test_pdf(pages=4, with_text=True)
    pdf_with_image = generate_test_pdf(pages=1, with_text=True, with_image=True)
    
    # Test 1: remove-pages
    test_tool(
        "remove-pages",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={"pages": "2,4"},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 2: extract-pages
    test_tool(
        "extract-pages",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={"pages": "1-2,5"},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 3: n-up-pdf
    test_tool(
        "n-up-pdf",
        [("test.pdf", pdf_4pages, "application/pdf")],
        options={"n": 2},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 4: grayscale-pdf
    test_tool(
        "grayscale-pdf",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={"dpi": 150},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 5: pdf-info
    test_tool(
        "pdf-info",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={},
        expected_mime="text/plain",
        expected_ext=".txt"
    )
    
    # Test 6: sign-pdf
    test_tool(
        "sign-pdf",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={"text": "John Doe", "position": "bottom-right"},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 7: edit-pdf
    test_tool(
        "edit-pdf",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={"page": 1, "x": 10, "y": 10, "text": "Hello", "size": 18, "color": "#ff0000"},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 8: pdf-to-text
    test_tool(
        "pdf-to-text",
        [("test.pdf", pdf_5pages, "application/pdf")],
        options={},
        expected_mime="text/plain",
        expected_ext=".txt"
    )
    
    # Test 9: extract-images
    test_tool(
        "extract-images",
        [("test.pdf", pdf_with_image, "application/pdf")],
        options={},
        expected_mime="application/zip",
        expected_ext=".zip"
    )
    
    # Test 10: text-to-pdf
    txt_content = b"This is a test document.\n\nIt has multiple paragraphs.\n\nEach paragraph should be rendered correctly in the PDF output.\n\nThis is the final paragraph."
    test_tool(
        "text-to-pdf",
        [("test.txt", txt_content, "text/plain")],
        options={},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Test 11: html-to-pdf
    html_content = b"<html><body><h1>Hi</h1><p>Test</p></body></html>"
    test_tool(
        "html-to-pdf",
        [("test.html", html_content, "text/html")],
        options={},
        expected_mime="application/pdf",
        expected_ext=".pdf"
    )
    
    # Print summary
    log("=" * 60)
    log(f"TESTING COMPLETE")
    log(f"Total tests: {results['total']}")
    log(f"Passed: {len(results['passed'])}")
    log(f"Failed: {len(results['failed'])}")
    log("=" * 60)
    
    if results["failed"]:
        log("FAILED TESTS:", "ERROR")
        for fail in results["failed"]:
            log(f"  ❌ {fail}", "ERROR")
    
    if results["passed"]:
        log("PASSED TESTS:", "SUCCESS")
        for passed in results["passed"]:
            log(f"  ✅ {passed}", "SUCCESS")
    
    # Exit with appropriate code
    sys.exit(0 if len(results["failed"]) == 0 else 1)

if __name__ == "__main__":
    main()
