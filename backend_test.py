#!/usr/bin/env python3
"""
DuskyPDF Backend API Test Suite
Tests all PDF processing tools end-to-end
"""

import requests
import json
import time
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Optional
import pypdf
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import zipfile

# Backend URL from frontend/.env
BACKEND_URL = "https://format-hub-14.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class DuskyPDFTester:
    def __init__(self):
        self.session = requests.Session()
        self.temp_dir = Path(tempfile.mkdtemp())
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def create_sample_pdf(self, pages: int = 3, filename: str = "sample.pdf") -> Path:
        """Create a sample PDF with specified number of pages"""
        pdf_path = self.temp_dir / filename
        c = canvas.Canvas(str(pdf_path), pagesize=letter)
        
        for i in range(pages):
            c.drawString(100, 750, f"This is page {i+1} of {pages}")
            c.drawString(100, 700, f"Sample content for testing DuskyPDF")
            c.drawString(100, 650, f"Page created at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            if i < pages - 1:
                c.showPage()
        
        c.save()
        return pdf_path
        
    def create_sample_jpg(self, filename: str = "sample.jpg") -> Path:
        """Create a sample JPG image"""
        jpg_path = self.temp_dir / filename
        img = Image.new('RGB', (800, 600), color='lightblue')
        img.save(jpg_path, 'JPEG')
        return jpg_path
        
    def verify_pdf_pages(self, pdf_path: Path, expected_pages: int) -> bool:
        """Verify PDF has expected number of pages"""
        try:
            reader = pypdf.PdfReader(str(pdf_path))
            actual_pages = len(reader.pages)
            return actual_pages == expected_pages
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return False
            
    def test_health_endpoint(self):
        """Test GET /api/ health endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "tools" in data:
                    tools = data["tools"]
                    expected_tools = [
                        "merge-pdf", "split-pdf", "compress-pdf", "rotate-pdf", 
                        "watermark", "page-numbers", "jpg-to-pdf", "pdf-to-jpg",
                        "pdf-to-word", "unlock-pdf", "protect-pdf", "organize-pdf",
                        "crop-pdf", "repair-pdf", "ocr-pdf"
                    ]
                    missing_tools = [t for t in expected_tools if t not in tools]
                    if not missing_tools:
                        self.log_result("Health Endpoint", True, f"All {len(tools)} tools available")
                        return True
                    else:
                        self.log_result("Health Endpoint", False, f"Missing tools: {missing_tools}")
                        return False
                else:
                    self.log_result("Health Endpoint", False, "Invalid response format")
                    return False
            else:
                self.log_result("Health Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Endpoint", False, f"Exception: {e}")
            return False
            
    def test_tools_endpoint(self):
        """Test GET /api/tools endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/tools")
            if response.status_code == 200:
                data = response.json()
                if "tools" in data and len(data["tools"]) >= 15:
                    self.log_result("Tools Endpoint", True, f"{len(data['tools'])} tools listed")
                    return True
                else:
                    self.log_result("Tools Endpoint", False, "Invalid tools response")
                    return False
            else:
                self.log_result("Tools Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Tools Endpoint", False, f"Exception: {e}")
            return False
            
    def process_tool(self, slug: str, files: list, options: Dict[str, Any] = None) -> Optional[Dict]:
        """Process a tool and return response data"""
        try:
            files_data = []
            for file_path in files:
                files_data.append(('files', (file_path.name, open(file_path, 'rb'))))
                
            data = {'options': json.dumps(options or {})}
            
            response = self.session.post(
                f"{API_BASE}/tools/{slug}/process",
                files=files_data,
                data=data
            )
            
            # Close file handles
            for _, (_, file_handle) in files_data:
                file_handle.close()
                
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Tool {slug} failed with HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"Tool {slug} exception: {e}")
            return None
            
    def download_file(self, token: str, expected_type: str = "pdf") -> Optional[Path]:
        """Download file using token"""
        try:
            response = self.session.get(f"{API_BASE}/download/{token}")
            if response.status_code == 200:
                ext = "pdf" if expected_type == "application/pdf" else \
                      "zip" if expected_type == "application/zip" else \
                      "jpg" if expected_type == "image/jpeg" else \
                      "docx" if expected_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" else "bin"
                      
                download_path = self.temp_dir / f"download_{token}.{ext}"
                with open(download_path, 'wb') as f:
                    f.write(response.content)
                return download_path
            else:
                print(f"Download failed with HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"Download exception: {e}")
            return None
            
    def test_merge_pdf(self):
        """Test merge-pdf tool"""
        pdf1 = self.create_sample_pdf(3, "merge1.pdf")
        pdf2 = self.create_sample_pdf(3, "merge2.pdf")
        
        result = self.process_tool("merge-pdf", [pdf1, pdf2])
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and self.verify_pdf_pages(download_path, 6):
                self.log_result("Merge PDF", True, "6 pages merged successfully")
                return True
                
        self.log_result("Merge PDF", False, "Failed to merge or verify pages")
        return False
        
    def test_split_pdf(self):
        """Test split-pdf tool with ranges and each mode"""
        pdf = self.create_sample_pdf(3, "split.pdf")
        
        # Test ranges mode
        result = self.process_tool("split-pdf", [pdf], {"mode": "ranges", "ranges": "1-2"})
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and self.verify_pdf_pages(download_path, 2):
                self.log_result("Split PDF (ranges)", True, "2 pages extracted")
            else:
                self.log_result("Split PDF (ranges)", False, "Failed to verify split result")
                return False
        else:
            self.log_result("Split PDF (ranges)", False, "Failed to split")
            return False
            
        # Test each mode (should return zip)
        result = self.process_tool("split-pdf", [pdf], {"mode": "each"})
        if result and result.get("success"):
            download_path = self.download_file(result["token"], "application/zip")
            if download_path and download_path.suffix == ".zip":
                self.log_result("Split PDF (each)", True, "ZIP file created")
                return True
            else:
                self.log_result("Split PDF (each)", False, "Failed to create ZIP")
                return False
        else:
            self.log_result("Split PDF (each)", False, "Failed to split each")
            return False
            
    def test_compress_pdf(self):
        """Test compress-pdf tool"""
        pdf = self.create_sample_pdf(3, "compress.pdf")
        
        result = self.process_tool("compress-pdf", [pdf], {"level": "recommended"})
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Compress PDF", True, f"Compressed to {result.get('size', 0)} bytes")
                return True
                
        self.log_result("Compress PDF", False, "Failed to compress")
        return False
        
    def test_rotate_pdf(self):
        """Test rotate-pdf tool"""
        pdf = self.create_sample_pdf(3, "rotate.pdf")
        
        result = self.process_tool("rotate-pdf", [pdf], {"degrees": 90, "pages": "all"})
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Rotate PDF", True, "PDF rotated 90 degrees")
                return True
                
        self.log_result("Rotate PDF", False, "Failed to rotate")
        return False
        
    def test_watermark_pdf(self):
        """Test watermark tool"""
        pdf = self.create_sample_pdf(3, "watermark.pdf")
        
        result = self.process_tool("watermark", [pdf], {"text": "TEST", "opacity": 0.3})
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Watermark PDF", True, "Watermark applied")
                return True
                
        self.log_result("Watermark PDF", False, "Failed to watermark")
        return False
        
    def test_page_numbers_pdf(self):
        """Test page-numbers tool"""
        pdf = self.create_sample_pdf(3, "pagenums.pdf")
        
        result = self.process_tool("page-numbers", [pdf], {
            "position": "bottom-center", 
            "format": "Page {n} of {total}"
        })
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Page Numbers PDF", True, "Page numbers added")
                return True
                
        self.log_result("Page Numbers PDF", False, "Failed to add page numbers")
        return False
        
    def test_jpg_to_pdf(self):
        """Test jpg-to-pdf tool"""
        jpg1 = self.create_sample_jpg("img1.jpg")
        jpg2 = self.create_sample_jpg("img2.jpg")
        
        result = self.process_tool("jpg-to-pdf", [jpg1, jpg2])
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and self.verify_pdf_pages(download_path, 2):
                self.log_result("JPG to PDF", True, "2 images converted to PDF")
                return True
                
        self.log_result("JPG to PDF", False, "Failed to convert images")
        return False
        
    def test_pdf_to_jpg(self):
        """Test pdf-to-jpg tool"""
        pdf = self.create_sample_pdf(3, "tojpg.pdf")
        
        result = self.process_tool("pdf-to-jpg", [pdf], {"dpi": 150})
        if result and result.get("success"):
            download_path = self.download_file(result["token"], "application/zip")
            if download_path and download_path.suffix == ".zip":
                self.log_result("PDF to JPG", True, "PDF converted to JPG images")
                return True
                
        self.log_result("PDF to JPG", False, "Failed to convert to JPG")
        return False
        
    def test_protect_unlock_pdf(self):
        """Test protect-pdf and unlock-pdf tools"""
        pdf = self.create_sample_pdf(3, "protect.pdf")
        password = "test123"
        
        # First protect the PDF
        result = self.process_tool("protect-pdf", [pdf], {"password": password})
        if not (result and result.get("success")):
            self.log_result("Protect PDF", False, "Failed to protect PDF")
            return False
            
        protected_path = self.download_file(result["token"])
        if not protected_path:
            self.log_result("Protect PDF", False, "Failed to download protected PDF")
            return False
            
        self.log_result("Protect PDF", True, "PDF protected with password")
        
        # Now unlock the protected PDF
        result = self.process_tool("unlock-pdf", [protected_path], {"password": password})
        if result and result.get("success"):
            unlocked_path = self.download_file(result["token"])
            if unlocked_path and unlocked_path.exists():
                self.log_result("Unlock PDF", True, "PDF unlocked successfully")
                return True
                
        self.log_result("Unlock PDF", False, "Failed to unlock PDF")
        return False
        
    def test_organize_pdf(self):
        """Test organize-pdf tool"""
        pdf = self.create_sample_pdf(3, "organize.pdf")
        
        result = self.process_tool("organize-pdf", [pdf], {"page_order": [3, 1, 2]})
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and self.verify_pdf_pages(download_path, 3):
                self.log_result("Organize PDF", True, "Pages reordered successfully")
                return True
                
        self.log_result("Organize PDF", False, "Failed to organize pages")
        return False
        
    def test_crop_pdf(self):
        """Test crop-pdf tool"""
        pdf = self.create_sample_pdf(3, "crop.pdf")
        
        result = self.process_tool("crop-pdf", [pdf], {
            "top": 5, "right": 5, "bottom": 5, "left": 5
        })
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Crop PDF", True, "PDF cropped successfully")
                return True
                
        self.log_result("Crop PDF", False, "Failed to crop PDF")
        return False
        
    def test_repair_pdf(self):
        """Test repair-pdf tool"""
        pdf = self.create_sample_pdf(3, "repair.pdf")
        
        result = self.process_tool("repair-pdf", [pdf])
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("Repair PDF", True, "PDF repaired successfully")
                return True
                
        self.log_result("Repair PDF", False, "Failed to repair PDF")
        return False
        
    def test_pdf_to_word(self):
        """Test pdf-to-word tool (with timeout)"""
        pdf = self.create_sample_pdf(1, "toword.pdf")  # Use 1 page for speed
        
        start_time = time.time()
        result = self.process_tool("pdf-to-word", [pdf])
        elapsed = time.time() - start_time
        
        if elapsed > 60:
            self.log_result("PDF to Word", False, f"Timeout after {elapsed:.1f}s")
            return False
            
        if result and result.get("success"):
            download_path = self.download_file(result["token"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            if download_path and download_path.exists():
                self.log_result("PDF to Word", True, f"Converted in {elapsed:.1f}s")
                return True
                
        self.log_result("PDF to Word", False, "Failed to convert to Word")
        return False
        
    def test_ocr_pdf(self):
        """Test ocr-pdf tool (with timeout)"""
        pdf = self.create_sample_pdf(1, "ocr.pdf")  # Use 1 page for speed
        
        start_time = time.time()
        result = self.process_tool("ocr-pdf", [pdf])
        elapsed = time.time() - start_time
        
        if elapsed > 60:
            self.log_result("OCR PDF", False, f"Timeout after {elapsed:.1f}s")
            return False
            
        if result and result.get("success"):
            download_path = self.download_file(result["token"])
            if download_path and download_path.exists():
                self.log_result("OCR PDF", True, f"OCR completed in {elapsed:.1f}s")
                return True
                
        self.log_result("OCR PDF", False, "Failed to perform OCR")
        return False
        
    def test_error_conditions(self):
        """Test error conditions"""
        success_count = 0
        
        # Test nonexistent tool
        try:
            response = self.session.post(f"{API_BASE}/tools/nonexistent/process")
            if response.status_code in [404, 422]:  # FastAPI returns 422 for path validation
                self.log_result("Error: Nonexistent Tool", True, f"{response.status_code} returned correctly")
                success_count += 1
            else:
                self.log_result("Error: Nonexistent Tool", False, f"Expected 404/422, got {response.status_code}")
        except Exception as e:
            self.log_result("Error: Nonexistent Tool", False, f"Exception: {e}")
            
        # Test no files
        try:
            response = self.session.post(
                f"{API_BASE}/tools/merge-pdf/process",
                data={'options': '{}'}
            )
            if response.status_code in [400, 422]:  # FastAPI returns 422 for validation errors
                self.log_result("Error: No Files", True, f"{response.status_code} returned correctly")
                success_count += 1
            else:
                self.log_result("Error: No Files", False, f"Expected 400/422, got {response.status_code}")
        except Exception as e:
            self.log_result("Error: No Files", False, f"Exception: {e}")
            
        # Test unlock with wrong password
        pdf = self.create_sample_pdf(1, "wrongpass.pdf")
        protect_result = self.process_tool("protect-pdf", [pdf], {"password": "correct123"})
        if protect_result and protect_result.get("success"):
            protected_path = self.download_file(protect_result["token"])
            if protected_path:
                unlock_result = self.process_tool("unlock-pdf", [protected_path], {"password": "wrong123"})
                if not unlock_result or not unlock_result.get("success"):
                    self.log_result("Error: Wrong Password", True, "Unlock failed as expected")
                    success_count += 1
                else:
                    self.log_result("Error: Wrong Password", False, "Unlock should have failed")
            else:
                self.log_result("Error: Wrong Password", False, "Could not download protected PDF")
        else:
            self.log_result("Error: Wrong Password", False, "Could not protect PDF for test")
            
        return success_count == 3
        
    def run_all_tests(self):
        """Run all tests"""
        print(f"🚀 Starting DuskyPDF Backend Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"📁 Temp directory: {self.temp_dir}")
        print("=" * 60)
        
        # Basic endpoint tests
        self.test_health_endpoint()
        self.test_tools_endpoint()
        
        # Core PDF processing tests
        self.test_merge_pdf()
        self.test_split_pdf()
        self.test_compress_pdf()
        self.test_rotate_pdf()
        self.test_watermark_pdf()
        self.test_page_numbers_pdf()
        self.test_jpg_to_pdf()
        self.test_pdf_to_jpg()
        self.test_protect_unlock_pdf()
        self.test_organize_pdf()
        self.test_crop_pdf()
        self.test_repair_pdf()
        
        # Potentially slow tests
        print("\n⏱️  Testing potentially slow operations...")
        self.test_pdf_to_word()
        self.test_ocr_pdf()
        
        # Error condition tests
        print("\n🚨 Testing error conditions...")
        self.test_error_conditions()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['details']}")
                    
        return passed, total
        
    def cleanup(self):
        """Clean up temporary files"""
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
            print(f"🧹 Cleaned up temp directory: {self.temp_dir}")
        except Exception as e:
            print(f"⚠️  Failed to cleanup temp directory: {e}")

def main():
    """Main test runner"""
    tester = DuskyPDFTester()
    try:
        passed, total = tester.run_all_tests()
        
        if passed == total:
            print(f"\n🎉 ALL TESTS PASSED! ({passed}/{total})")
            return 0
        else:
            print(f"\n💥 SOME TESTS FAILED ({passed}/{total})")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test runner failed: {e}")
        return 1
    finally:
        tester.cleanup()

if __name__ == "__main__":
    exit(main())