// Notice service to handle both API and localStorage fallback
class NoticeService {
  constructor() {
    const PRODUCTION_API = "https://jamalpur-chamber-backend-b61d.onrender.com/api";
    const LOCAL_API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    this.apiBaseUrl = process.env.NODE_ENV === "production" ? PRODUCTION_API : LOCAL_API;
    this.cacheKey = "notices";
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get notices with API fallback to localStorage
  async getNotices() {
    try {
      // Try API first
      const response = await fetch(`${this.apiBaseUrl}/notices`);
      if (response.ok) {
        const notices = await response.json();
        // Cache successful API response
        this.setCache(notices);
        return notices;
      }
    } catch (error) {
      // API not available, will use localStorage fallback
    }

    // Fallback to localStorage
    const cachedNotices = this.getFromCache();
    return cachedNotices;
  }

  // Create notice via API
  async createNotice(noticeData) {
    const token = localStorage.getItem("token");


    // Create FormData for file upload
    const formData = new FormData();
    formData.append("title", noticeData.title);
    formData.append("content", noticeData.content);
    formData.append("priority", noticeData.priority || "normal");

    if (noticeData.pdfFile) {
      formData.append("pdfFile", noticeData.pdfFile);
    }

    const response = await fetch(`${this.apiBaseUrl}/notices`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Create notice failed:", errorData);
      throw new Error(errorData.message || "Failed to create notice");
    }

    const result = await response.json();

    // Clear cache to force refresh
    this.clearCache();

    return result;
  }

  // Update notice via API
  async updateNotice(id, noticeData) {
    const token = localStorage.getItem("token");


    // Create FormData for file upload
    const formData = new FormData();
    formData.append("title", noticeData.title);
    formData.append("content", noticeData.content);
    formData.append("priority", noticeData.priority || "normal");

    if (noticeData.pdfFile) {
      formData.append("pdfFile", noticeData.pdfFile);
    }

    const response = await fetch(`${this.apiBaseUrl}/notices/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Update notice failed:", errorData);
      throw new Error(errorData.message || "Failed to update notice");
    }

    const result = await response.json();

    // Clear cache to force refresh
    this.clearCache();

    return result;
  }

  // Delete notice via API
  async deleteNotice(id) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${this.apiBaseUrl}/notices/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Delete notice failed:", errorData);
      throw new Error(errorData.message || "Failed to delete notice");
    }

    const result = await response.json();

    // Clear cache to force refresh
    this.clearCache();

    return result;
  }

  // Cache management
  setCache(notices) {
    const cacheData = {
      data: notices,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
  }

  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        // Check if cache is still valid and data is an array
        if (
          Date.now() - cacheData.timestamp < this.cacheTimeout &&
          Array.isArray(cacheData.data)
        ) {
          return cacheData.data;
        }
      }
    } catch (error) {
      console.error("Error reading cache:", error);
    }
    return [];
  }

  // Clear cache
  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }

  // Fallback method for localStorage-only operations (when API is not available)
  saveToLocalStorage(notice) {
    try {
      const existingNotices = this.getFromCache();
      // Ensure existingNotices is always an array
      const noticesArray = Array.isArray(existingNotices)
        ? existingNotices
        : [];
      const newNotices = [notice, ...noticesArray];
      this.setCache(newNotices);
      return newNotices;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      throw error;
    }
  }

  updateInLocalStorage(id, updatedNotice) {
    try {
      const existingNotices = this.getFromCache();
      // Ensure existingNotices is always an array
      const noticesArray = Array.isArray(existingNotices)
        ? existingNotices
        : [];
      const updatedNotices = noticesArray.map((notice) =>
        notice.id === id || notice._id === id ? updatedNotice : notice
      );
      this.setCache(updatedNotices);
      return updatedNotices;
    } catch (error) {
      console.error("Error updating in localStorage:", error);
      throw error;
    }
  }

  deleteFromLocalStorage(id) {
    try {
      const existingNotices = this.getFromCache();
      // Ensure existingNotices is always an array
      const noticesArray = Array.isArray(existingNotices)
        ? existingNotices
        : [];
      const updatedNotices = noticesArray.filter(
        (notice) => notice.id !== id && notice._id !== id
      );
      this.setCache(updatedNotices);
      return updatedNotices;
    } catch (error) {
      console.error("Error deleting from localStorage:", error);
      throw error;
    }
  }
}

export default new NoticeService();
