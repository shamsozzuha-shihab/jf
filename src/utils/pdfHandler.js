// Centralized PDF handling utility
// Eliminates code duplication across components

class PDFHandler {
  /**
   * Download PDF file from server, Cloudinary, or data URL
   * @param {Object} pdfFile - PDF file object with filename, url, or data
   * @param {string} pdfFile.filename - Server filename (legacy)
   * @param {string} pdfFile.fileId - Server file ID (legacy)
   * @param {string} pdfFile.url - Cloudinary URL (new format)
   * @param {string} pdfFile.publicId - Cloudinary public ID (new format)
   * @param {string} pdfFile.originalName - Original filename
   * @param {string} pdfFile.data - Base64 data URL (fallback)
   * @param {string} pdfFile.name - Fallback name
   */
  async download(pdfFile) {
    if (!pdfFile) {
      console.error("❌ pdfHandler.download: No PDF file provided");
      return false;
    }

    try {
      if (pdfFile.url) {
        // Cloudinary format - download from URL
        return await this._downloadFromUrl(pdfFile);
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - download from server
        return await this._downloadFromServer(pdfFile);
      } else if (pdfFile.data) {
        // localStorage format - base64 data
        return this._downloadFromDataURL(pdfFile);
      } else {
        console.error(
          "❌ Invalid PDF file format - missing url, filename, fileId, and data:",
          pdfFile
        );
        return false;
      }
    } catch (error) {
      console.error("❌ PDF download error:", error);
      return false;
    }
  }

  /**
   * View/Open PDF in new tab
   * @param {Object} pdfFile - PDF file object
   */
  view(pdfFile) {
    if (!pdfFile) {
      console.error("❌ pdfHandler.view: No PDF file provided");
      return false;
    }

    try {
      if (pdfFile.url) {
        // Cloudinary format - open from URL
        const normalizedUrl = this._normalizePdfUrl(pdfFile);
        window.open(normalizedUrl, "_blank");
        return true;
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - open from server
        const PRODUCTION_API = "https://jamalpur-chamber-backend-b61d.onrender.com/api";
        const LOCAL_API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const API_BASE = process.env.NODE_ENV === "production" ? PRODUCTION_API : LOCAL_API;
        const pdfUrl = `${API_BASE}/files/${pdfFile.filename || pdfFile.fileId}`;
        window.open(pdfUrl, "_blank");
        return true;
      } else if (pdfFile.data) {
        // localStorage format - open from data URL
        window.open(pdfFile.data, "_blank");
        return true;
      } else {
        console.error(
          "❌ Invalid PDF file format - missing url, filename, fileId, and data:",
          pdfFile
        );
        return false;
      }
    } catch (error) {
      console.error("❌ PDF view error:", error);
      return false;
    }
  }

  /**
   * Print PDF file
   * @param {Object} pdfFile - PDF file object
   */
  print(pdfFile) {
    if (!pdfFile) {
      console.error("No PDF file provided");
      return false;
    }

    try {
      let pdfUrl;

      if (pdfFile.url) {
        // Cloudinary format - use direct URL
        pdfUrl = this._normalizePdfUrl(pdfFile);
      } else if (pdfFile.filename || pdfFile.fileId) {
        // Legacy API format - construct server URL
        const PRODUCTION_API = "https://jamalpur-chamber-backend-b61d.onrender.com/api";
        const LOCAL_API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        const API_BASE = process.env.NODE_ENV === "production" ? PRODUCTION_API : LOCAL_API;
        pdfUrl = `${API_BASE}/files/${pdfFile.filename || pdfFile.fileId}`;
      } else if (pdfFile.data) {
        // localStorage format - use data URL
        pdfUrl = pdfFile.data;
      } else {
        console.error("Invalid PDF file format:", pdfFile);
        return false;
      }

      // Open in new window and trigger print
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = function () {
          printWindow.print();
        };
        return true;
      }
      return false;
    } catch (error) {
      console.error("PDF print error:", error);
      return false;
    }
  }

  /**
   * Get PDF filename for display
   * @param {Object} pdfFile - PDF file object
   * @returns {string} Display filename
   */
  getFilename(pdfFile) {
    if (!pdfFile) return "document.pdf";
    const baseName = (
      pdfFile.originalName || pdfFile.name || pdfFile.filename || "document.pdf"
    );

    if (
      pdfFile.mimetype &&
      pdfFile.mimetype.toLowerCase() === "application/pdf" &&
      !baseName.toLowerCase().endsWith(".pdf")
    ) {
      return `${baseName}.pdf`;
    }

    return baseName;
  }

  /**
   * Check if PDF file is valid
   * @param {Object} pdfFile - PDF file object
   * @returns {boolean}
   */
  isValid(pdfFile) {
    if (!pdfFile) return false;
    return !!(pdfFile.url || pdfFile.filename || pdfFile.fileId || pdfFile.data);
  }

  // Private methods

  /**
   * Download PDF from Cloudinary URL
   * @private
   */
  async _downloadFromUrl(pdfFile) {
    const filename = this.getFilename(pdfFile);
    const downloadUrl = this._normalizePdfUrl(pdfFile);

    try {
      // Try fetch method first (more reliable for large files)
      const response = await fetch(downloadUrl);
      
      if (response.ok) {
        // Convert to blob with proper PDF MIME type
        const blob = new Blob([await response.arrayBuffer()], { 
          type: 'application/pdf' 
        });
        this._downloadBlob(blob, filename);
        return true;
      } else {
        // Fallback to direct link method
        this._downloadDirect(downloadUrl, filename);
        return true;
      }
    } catch (error) {
      console.error("Fetch download failed, using direct method:", error);
      // Fallback to direct link method
      this._downloadDirect(downloadUrl, filename);
      return true;
    }
  }

  /**
   * Download PDF from server
   * @private
   */
  async _downloadFromServer(pdfFile) {
    const PRODUCTION_API = "https://jamalpur-chamber-backend-b61d.onrender.com/api";
    const LOCAL_API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const API_BASE = process.env.NODE_ENV === "production" ? PRODUCTION_API : LOCAL_API;
    const pdfUrl = `${API_BASE}/files/${pdfFile.filename || pdfFile.fileId}`;
    const filename = this.getFilename(pdfFile);

    try {
      // Try fetch method first (more reliable for large files)
      const response = await fetch(pdfUrl);

      if (response.ok) {
        // Convert to blob with proper PDF MIME type
        const blob = new Blob([await response.arrayBuffer()], { 
          type: 'application/pdf' 
        });
        this._downloadBlob(blob, filename);
        return true;
      } else {
        // Fallback to direct link method
        this._downloadDirect(pdfUrl, filename);
        return true;
      }
    } catch (error) {
      console.error("Fetch download failed, using direct method:", error);
      // Fallback to direct link method
      this._downloadDirect(pdfUrl, filename);
      return true;
    }
  }

  /**
   * Download PDF from base64 data URL
   * @private
   */
  _downloadFromDataURL(pdfFile) {
    const link = document.createElement("a");
    link.href = pdfFile.data;
    link.download = this.getFilename(pdfFile);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  /**
   * Download blob as file
   * @private
   */
  _downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL object
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }

  /**
   * Direct download using link
   * @private
   */
  _downloadDirect(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    
    // Delay removal to allow download to start
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }

  _normalizePdfUrl(pdfFile) {
    if (!pdfFile || !pdfFile.url) {
      return null;
    }

    const isPdf =
      pdfFile.mimetype &&
      pdfFile.mimetype.toLowerCase() === "application/pdf";

    if (!isPdf) {
      return pdfFile.url;
    }

    try {
      const urlObject = new URL(pdfFile.url);

      if (
        urlObject.hostname.includes("res.cloudinary.com") &&
        urlObject.pathname.includes("/upload/")
      ) {
        urlObject.pathname = urlObject.pathname
          .replace("/image/upload/", "/raw/upload/")
          .replace("/auto/upload/", "/raw/upload/");
      }

      if (!urlObject.pathname.toLowerCase().endsWith(".pdf")) {
        const segments = urlObject.pathname.split("/");
        const lastSegment = segments.pop() || "document.pdf";
        if (lastSegment.includes(".")) {
          const base = lastSegment.split(".")[0];
          segments.push(`${base}.pdf`);
        } else {
          segments.push(`${lastSegment}.pdf`);
        }
        urlObject.pathname = segments.join("/");
      }
      return urlObject.toString();
    } catch (error) {
      console.warn("⚠️ Failed to normalize PDF URL using URL API", error);
      if (pdfFile.url.includes(".")) {
        return pdfFile.url
          .replace("/image/upload/", "/raw/upload/")
          .replace("/auto/upload/", "/raw/upload/")
          .replace(/(\.[a-zA-Z0-9]+)(\?.*)?$/, ".pdf$2");
      }
      return `${pdfFile.url}.pdf`;
    }
  }
}

// Export singleton instance
const pdfHandler = new PDFHandler();
export default pdfHandler;
