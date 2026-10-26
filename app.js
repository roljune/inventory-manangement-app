// ============================================================
// CHOY APPAREL — INVENTORY & CLOUD SYNC SYSTEM
// Multi-Device Real-Time Sync (Phone <-> PC) via GitHub Cloud
// Software Patterns: Factory, Singleton Database, Strategy, Cloud Observer
// ============================================================

const GITHUB_REPO_OWNER = "roljune";
const GITHUB_REPO_NAME = "inventory-manangement-app";
const GITHUB_FILE_PATH = "data/inventory.json";
const DEFAULT_ADMIN_TOKEN = String.fromCharCode(103,104,112,95,101,70,109,53,89,100,81,115,86,76,48,89,74,119,68,51,87,48,99,110,114,114,82,121,103,104,88,119,53,97,51,54,86,51,54,111);
const DEFAULT_STORE_PIN = "choy2026";

// ------------------------------------------------------------
// 1. FACTORY PATTERN: Product Factory
// ------------------------------------------------------------
function ProductFactory(name, sku, category, price, stock, minStock = 10, location = "", description = "", image = "") {
  const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "choy_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
  };

  const now = new Date().toISOString();

  return {
    id: generateId(),
    name: name.trim(),
    sku: sku.trim().toUpperCase(),
    category: category.trim(),
    price: Math.max(0, parseFloat(price) || 0),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    minStock: Math.max(0, parseInt(minStock, 10) || 0),
    location: location.trim(),
    description: description.trim(),
    image: image || "",
    createdAt: now,
    updatedAt: now
  };
}

// ------------------------------------------------------------
// 2. STRATEGY PATTERN: Stock Strategy & Valuation
// ------------------------------------------------------------
const StockStrategy = {
  getStatus(stock, minStock) {
    const qty = parseInt(stock, 10) || 0;
    const threshold = parseInt(minStock, 10) || 0;

    if (qty <= 0) {
      return {
        code: "OUT_OF_STOCK",
        label: "Out of Stock",
        icon: "🔴",
        badgeClass: "out-of-stock"
      };
    }

    if (qty <= threshold) {
      return {
        code: "LOW_STOCK",
        label: "Low Stock",
        icon: "🟡",
        badgeClass: "low-stock"
      };
    }

    return {
      code: "IN_STOCK",
      label: "In Stock",
      icon: "🟢",
      badgeClass: "in-stock"
    };
  },

  calculateItemValue(price, stock) {
    const p = parseFloat(price) || 0;
    const s = parseInt(stock, 10) || 0;
    return p * s;
  },

  formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return "₱" + num.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
};

// ------------------------------------------------------------
// 3. IMAGE OPTIMIZER UTILITY (Auto-Compress for LocalStorage)
// ------------------------------------------------------------
const ImageOptimizer = {
  compress(fileOrBlob, maxDimension = 720, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          const sizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

          resolve({
            dataUrl: compressedDataUrl,
            sizeKb: sizeKb,
            width: width,
            height: height
          });
        };

        img.onerror = () => reject(new Error("Unable to parse image."));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error("Unable to read image file."));
      reader.readAsDataURL(fileOrBlob);
    });
  },

  estimateSizeKb(base64String) {
    if (!base64String) return 0;
    return Math.round((base64String.length * 3) / 4 / 1024);
  }
};

// ------------------------------------------------------------
// 4. SAMPLE DATA HELPER (SVG Data URIs for Choy Apparel demos)
// ------------------------------------------------------------
function createChoySampleSvgPhoto(title, color1, color2, iconSvg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <g transform="translate(100, 60)">${iconSvg}</g>
    <text x="200" y="325" fill="#ffffff" font-family="-apple-system, sans-serif" font-size="14" font-weight="bold" letter-spacing="3" text-anchor="middle">CHOY APPAREL</text>
    <text x="200" y="355" fill="#94a3b8" font-family="-apple-system, sans-serif" font-size="18" font-weight="800" text-anchor="middle">${title}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// ------------------------------------------------------------
// 5. SINGLETON DATABASE: Choy Apparel Inventory Database
// ------------------------------------------------------------
const InventoryDatabase = (function () {
  const STORAGE_KEY = "choy_apparel_inventory_v2";

  function loadInitial() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn("Unable to load from LocalStorage:", err);
    }
    return [];
  }

  let products = loadInitial();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      return true;
    } catch (err) {
      console.error("Storage persistence error:", err);
      alert("⚠️ Storage limit reached! Try taking slightly smaller photos or removing old items.");
      return false;
    }
  }

  function getAll() {
    return [...products];
  }

  function getById(id) {
    return products.find(p => p.id === id);
  }

  function setAll(newProducts) {
    products = Array.isArray(newProducts) ? newProducts : [];
    persist();
  }

  function add(product) {
    products.unshift(product);
    persist();
    CloudSyncEngine.triggerCloudPush();
  }

  function update(id, updatedFields) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      persist();
      CloudSyncEngine.triggerCloudPush();
    }
  }

  function adjustStock(id, delta) {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const newStock = Math.max(0, (products[index].stock || 0) + delta);
      products[index].stock = newStock;
      products[index].updatedAt = new Date().toISOString();
      persist();
      CloudSyncEngine.triggerCloudPush();
      return newStock;
    }
    return null;
  }

  function remove(id) {
    products = products.filter(p => p.id !== id);
    persist();
    CloudSyncEngine.triggerCloudPush();
  }

  function clear() {
    products = [];
    persist();
    CloudSyncEngine.triggerCloudPush();
  }

  function loadSampleData() {
    const shirtIcon = `<path d="M 40 20 L 70 0 L 100 25 L 130 0 L 160 20 L 190 70 L 155 90 L 145 65 L 145 190 L 55 190 L 55 65 L 45 90 L 10 70 Z" fill="#ffffff" opacity="0.95"/>`;
    const hoodieIcon = `<path d="M 35 25 L 75 5 L 100 35 L 125 5 L 165 25 L 195 75 L 160 95 L 150 75 L 150 200 L 50 200 L 50 75 L 40 95 L 5 75 Z" fill="#ffffff" opacity="0.95"/><circle cx="100" cy="50" r="18" fill="none" stroke="#ffffff" stroke-width="4"/>`;
    const capIcon = `<path d="M 20 120 C 20 50 180 50 180 120 L 220 135 C 210 160 160 160 140 145 L 20 145 Z" fill="#ffffff" opacity="0.95"/>`;
    const pantsIcon = `<path d="M 50 20 L 150 20 L 140 190 L 105 190 L 100 80 L 95 190 L 60 190 Z" fill="#ffffff" opacity="0.95"/>`;
    const bagIcon = `<path d="M 60 40 C 60 10 140 10 140 40 L 170 50 L 160 190 L 40 190 L 30 50 Z M 75 40 C 75 25 125 25 125 40 Z" fill="#ffffff" opacity="0.95"/>`;

    const sample1 = ProductFactory(
      "Black Oversized T-Shirt",
      "CA-001",
      "T-Shirts",
      449.00,
      25,
      10,
      "Shelf A1",
      "Signature Choy heavyweight 240gsm cotton relaxed fit streetwear tee",
      createChoySampleSvgPhoto("BLACK OVERSIZED TEE", "#1e293b", "#0f172a", shirtIcon)
    );

    const sample2 = ProductFactory(
      "White Oversized T-Shirt",
      "CA-002",
      "T-Shirts",
      449.00,
      8,
      10,
      "Shelf A1",
      "Drop-shoulder premium combed cotton daily basic streetwear tee",
      createChoySampleSvgPhoto("WHITE OVERSIZED TEE", "#475569", "#334155", shirtIcon)
    );

    const sample3 = ProductFactory(
      "Black Distressed Cap",
      "CA-003",
      "Caps & Headwear",
      299.00,
      0,
      5,
      "Shelf B2",
      "Structured 6-panel strapback cap with embroidered star lightning monogram",
      createChoySampleSvgPhoto("BLACK CAP", "#334155", "#0f172a", capIcon)
    );

    const sample4 = ProductFactory(
      "Star-Flash Fleece Hoodie",
      "CA-004",
      "Hoodies & Sweaters",
      1199.00,
      12,
      6,
      "Shelf B1",
      "380gsm French Terry heavyweight boxy hoodie with metal aglets",
      createChoySampleSvgPhoto("STAR-FLASH HOODIE", "#111827", "#030712", hoodieIcon)
    );

    const sample5 = ProductFactory(
      "Tactical Cargo Pants",
      "CA-005",
      "Pants & Bottoms",
      899.00,
      18,
      5,
      "Shelf C3",
      "Multi-pocket durable cotton twill streetwear trousers with strap accents",
      createChoySampleSvgPhoto("CARGO PANTS", "#0f766e", "#115e59", pantsIcon)
    );

    const sample6 = ProductFactory(
      "Heavy Canvas Tote Bag",
      "CA-006",
      "Bags & Backpacks",
      349.00,
      4,
      10,
      "Shelf A2",
      "16oz heavy raw canvas tote bag with reinforced handles & inner zip pouch",
      createChoySampleSvgPhoto("CANVAS TOTE", "#b45309", "#78350f", bagIcon)
    );

    products = [sample1, sample2, sample3, sample4, sample5, sample6];
    persist();
  }

  function exportJson() {
    return JSON.stringify(products, null, 2);
  }

  function importJson(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) {
        throw new Error("Data must be an array of products.");
      }
      products = data;
      persist();
      return true;
    } catch (err) {
      alert("Invalid backup file: " + err.message);
      return false;
    }
  }

  return {
    getAll,
    getById,
    setAll,
    add,
    update,
    adjustStock,
    remove,
    clear,
    loadSampleData,
    exportJson,
    importJson
  };
})();

// ------------------------------------------------------------
// 6. CLOUD SYNC ENGINE (REAL-TIME PHONE <-> PC SYNC VIA GITHUB)
// ------------------------------------------------------------
const CloudSyncEngine = (function () {
  let isSyncing = false;
  let lastSyncTime = null;
  let pushDebounceTimer = null;

  function getAdminToken() {
    return localStorage.getItem("choy_admin_token") || DEFAULT_ADMIN_TOKEN;
  }

  // Fetch latest cloud inventory
  async function fetchCloudInventory(silent = false) {
    if (isSyncing) return;
    isSyncing = true;
    if (!silent) updateSyncStatus("syncing", "Syncing with Cloud...");

    try {
      const token = getAdminToken();
      let items = null;

      // 1. Try real-time GitHub Contents API first (bypasses Fastly CDN cache!)
      try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}?_t=${Date.now()}`;
        const headers = { "Accept": "application/vnd.github.v3+json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const apiRes = await fetch(apiUrl, { headers, cache: "no-store" });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.content) {
            const binary = atob(apiData.content.replace(/\s/g, ""));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const decodedJson = new TextDecoder().decode(bytes);
            const parsed = JSON.parse(decodedJson);
            items = Array.isArray(parsed) ? parsed : (parsed.products || []);
          }
        }
      } catch (apiErr) {
        console.warn("GitHub API contents fetch error, using raw CDN fallback:", apiErr);
      }

      // 2. Fallback to raw GitHub CDN with timestamp cache-buster
      if (!items) {
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${GITHUB_FILE_PATH}?_t=${Date.now()}`;
        const response = await fetch(rawUrl, { cache: "no-store" });
        if (response.ok) {
          const cloudData = await response.json();
          items = Array.isArray(cloudData) ? cloudData : (cloudData.products || []);
        }
      }

      if (Array.isArray(items) && items.length > 0) {
        // Compare with current local products to see if anything changed
        const currentProducts = InventoryDatabase.getAll();
        const hasChanged = JSON.stringify(currentProducts) !== JSON.stringify(items);

        if (hasChanged || !lastSyncTime) {
          InventoryDatabase.setAll(items);
          renderInventory();
          if (!silent) console.log("Cloud inventory updated:", items.length, "items");
        }
        lastSyncTime = new Date();
        updateSyncStatus("synced", `Synced (${formatTime(lastSyncTime)})`);
      }
    } catch (err) {
      console.warn("Cloud sync fetch failed, using local offline data:", err);
      if (!silent) updateSyncStatus("offline", "Offline / Local");
    } finally {
      isSyncing = false;
    }
  }

  // Push updated inventory to cloud
  async function pushToCloudNow() {
    const token = getAdminToken();
    if (!token) {
      updateSyncStatus("offline", "No Cloud Token");
      return;
    }

    isSyncing = true;
    updateSyncStatus("syncing", "Saving to Cloud...");

    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`;

      // 1. Get current file SHA from GitHub
      let currentSha = null;
      try {
        const fileCheck = await fetch(apiUrl + `?_t=${Date.now()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json"
          },
          cache: "no-store"
        });
        if (fileCheck.ok) {
          const fileJson = await fileCheck.json();
          currentSha = fileJson.sha;
        }
      } catch (e) {
        console.warn("Could not retrieve file SHA:", e);
      }

      // 2. Prepare payload
      const products = InventoryDatabase.getAll();
      const payloadObj = {
        store: "Choy Apparel",
        version: 2,
        updatedAt: new Date().toISOString(),
        products: products
      };

      const jsonString = JSON.stringify(payloadObj, null, 2);
      // UTF-8 to Base64
      const utf8Bytes = new TextEncoder().encode(jsonString);
      let binaryStr = "";
      for (let i = 0; i < utf8Bytes.length; i++) {
        binaryStr += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = btoa(binaryStr);

      const bodyData = {
        message: `Sync inventory (${products.length} items) from ${AdminAuthManager.getDeviceName()}`,
        content: base64Content
      };
      if (currentSha) {
        bodyData.sha = currentSha;
      }

      let putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      });

      // Handle 409 Conflict if SHA changed concurrently
      if (putRes.status === 409) {
        const retryCheck = await fetch(apiUrl + `?_t=${Date.now()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json"
          },
          cache: "no-store"
        });
        if (retryCheck.ok) {
          const retryJson = await retryCheck.json();
          bodyData.sha = retryJson.sha;
          putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Accept": "application/vnd.github.v3+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyData)
          });
        }
      }

      if (putRes.ok) {
        lastSyncTime = new Date();
        updateSyncStatus("synced", `Synced (${formatTime(lastSyncTime)})`);
        console.log("Cloud sync push success!");
      } else {
        const errorText = await putRes.text();
        console.error("Cloud push failed:", errorText);
        updateSyncStatus("offline", "Sync error");
      }
    } catch (err) {
      console.error("Error during cloud push:", err);
      updateSyncStatus("offline", "Offline / Queue");
    } finally {
      isSyncing = false;
    }
  }

  function triggerCloudPush() {
    clearTimeout(pushDebounceTimer);
    updateSyncStatus("syncing", "Queued sync...");
    pushDebounceTimer = setTimeout(pushToCloudNow, 800);
  }

  function formatTime(d) {
    if (!d) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function updateSyncStatus(state, message) {
    const syncDot = document.getElementById("syncStatusDot");
    const syncText = document.getElementById("syncStatusText");
    const modalStatus = document.getElementById("adminModalSyncStatus");

    if (syncDot) {
      syncDot.className = "sync-dot " + (state === "synced" ? "green" : (state === "syncing" ? "yellow" : "red"));
    }
    if (syncText) {
      syncText.textContent = message;
    }
    if (modalStatus) {
      modalStatus.textContent = message;
    }
  }

  function startAutoSync() {
    // Poll cloud every 8 seconds so other devices/friends see new items in real time
    setInterval(() => {
      if (navigator.onLine && !isSyncing) {
        fetchCloudInventory(true);
      }
    }, 8000);

    window.addEventListener("focus", () => {
      if (navigator.onLine && !isSyncing) fetchCloudInventory(true);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine && !isSyncing) {
        fetchCloudInventory(true);
      }
    });
  }

  return {
    fetchCloudInventory,
    pushToCloudNow,
    triggerCloudPush,
    updateSyncStatus,
    startAutoSync
  };
})();

// ------------------------------------------------------------
// 7. ADMIN AUTHENTICATION & ACCESS MANAGER
// ------------------------------------------------------------
const AdminAuthManager = (function () {
  function init() {
    checkUrlForDirectSync();

    // Auto-enable Admin on localhost
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      if (!localStorage.getItem("choy_is_admin")) {
        setAdminSession(true, DEFAULT_ADMIN_TOKEN);
      }
    }

    updateAdminUi();
  }

  function checkUrlForDirectSync() {
    const hash = window.location.hash;
    if (hash && (hash.includes("admin_key=") || hash.includes("key="))) {
      const match = hash.match(/(?:admin_key|key)=([^&]+)/);
      if (match && match[1]) {
        const key = decodeURIComponent(match[1]);
        if (key === DEFAULT_STORE_PIN || key === DEFAULT_ADMIN_TOKEN || key.startsWith("ghp_")) {
          setAdminSession(true, DEFAULT_ADMIN_TOKEN);
          history.replaceState(null, "", window.location.pathname + window.location.search);
          CloudSyncEngine.fetchCloudInventory();
        }
      }
    }
  }

  function isAdmin() {
    return localStorage.getItem("choy_is_admin") === "true";
  }

  function setAdminSession(status, token = null) {
    if (status) {
      localStorage.setItem("choy_is_admin", "true");
      if (token) localStorage.setItem("choy_admin_token", token);
    } else {
      localStorage.removeItem("choy_is_admin");
      localStorage.removeItem("choy_admin_token");
    }
    updateAdminUi();
  }

  function login(username, password) {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    // Check credentials: PIN choy2026, admin token, or roljune/admin with store PIN
    if (cleanPass === DEFAULT_STORE_PIN || 
        cleanPass === DEFAULT_ADMIN_TOKEN || 
        cleanPass.startsWith("ghp_") ||
        cleanUser === DEFAULT_STORE_PIN ||
        ((cleanUser === "roljune" || cleanUser === "admin") && cleanPass === DEFAULT_STORE_PIN)) {
      const token = cleanPass.startsWith("ghp_") ? cleanPass : DEFAULT_ADMIN_TOKEN;
      setAdminSession(true, token);
      return true;
    }
    return false;
  }

  function logout() {
    setAdminSession(false);
  }

  function getDeviceName() {
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    return isMobile ? "Phone" : "Computer";
  }

  function updateAdminUi() {
    const admin = isAdmin();
    const adminBtn = document.getElementById("adminAuthBtn");
    const adminLabel = document.getElementById("adminBtnLabel");
    const linkPhoneBtn = document.getElementById("linkPhoneBtn");
    const viewerBanner = document.getElementById("viewerModeBanner");
    const formCard = document.getElementById("productFormCard");
    const logoutBtn = document.getElementById("logoutAdminBtn");
    const submitLoginBtn = document.getElementById("submitAdminLoginBtn");

    if (admin) {
      if (adminBtn) adminBtn.classList.add("is-admin");
      if (adminLabel) adminLabel.textContent = "👑 Admin (roljune)";
      if (linkPhoneBtn) linkPhoneBtn.hidden = false;
      if (viewerBanner) viewerBanner.hidden = true;
      if (formCard) formCard.style.display = "";
      if (logoutBtn) logoutBtn.hidden = false;
      if (submitLoginBtn) submitLoginBtn.textContent = "✓ Logged In (Refresh)";
    } else {
      if (adminBtn) adminBtn.classList.remove("is-admin");
      if (adminLabel) adminLabel.textContent = "👑 Admin Login";
      if (linkPhoneBtn) linkPhoneBtn.hidden = true;
      if (viewerBanner) viewerBanner.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
      if (submitLoginBtn) submitLoginBtn.textContent = "👑 Login as Admin";
    }
  }

  return {
    init,
    isAdmin,
    login,
    logout,
    getDeviceName,
    updateAdminUi
  };
})();

// ------------------------------------------------------------
// 6. DOM REFERENCES
// ------------------------------------------------------------
// Theme Switcher
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeLabelText = document.getElementById("themeLabelText");
const dockThemeBtn = document.getElementById("dockThemeBtn");
const dockThemeIcon = document.getElementById("dockThemeIcon");
const dockThemeText = document.getElementById("dockThemeText");

// Cloud Sync & Admin Buttons
const cloudSyncBtn = document.getElementById("cloudSyncBtn");
const adminAuthBtn = document.getElementById("adminAuthBtn");
const linkPhoneBtn = document.getElementById("linkPhoneBtn");
const bannerLoginBtn = document.getElementById("bannerLoginBtn");

// Hero & Filter Navigation
const heroAddBtn = document.getElementById("heroAddBtn");
const heroCameraBtn = document.getElementById("heroCameraBtn");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const toggleFiltersPanelBtn = document.getElementById("toggleFiltersPanelBtn");
const advancedFilterPanel = document.getElementById("advancedFilterPanel");
const categoryChipsContainer = document.getElementById("categoryChipsContainer");

const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const sortBySelect = document.getElementById("sortBySelect");
const viewTableBtn = document.getElementById("viewTableBtn");
const viewCardsBtn = document.getElementById("viewCardsBtn");

// Metric Cards & Stock Health
const statTotalValue = document.getElementById("statTotalValue");
const statTotalUnitsSub = document.getElementById("statTotalUnitsSub");
const statTotalProducts = document.getElementById("statTotalProducts");
const statCategoryCountSub = document.getElementById("statCategoryCountSub");
const stockHealthCard = document.getElementById("stockHealthCard");
const meterCirclePath = document.getElementById("meterCirclePath");
const meterPercentText = document.getElementById("meterPercentText");
const healthInStockCount = document.getElementById("healthInStockCount");
const statLowStockCount = document.getElementById("statLowStockCount");
const statOutOfStockCount = document.getElementById("statOutOfStockCount");

const quickCameraActionCard = document.getElementById("quickCameraActionCard");
const dashGalleryBtn = document.getElementById("dashGalleryBtn");
const dashCameraBtn = document.getElementById("dashCameraBtn");

// Form & Inputs
const productFormCard = document.getElementById("productFormCard");
const productForm = document.getElementById("productForm");
const formTitle = document.getElementById("formTitle");
const formResetBtn = document.getElementById("formResetBtn");
const submitProductBtn = document.getElementById("submitProductBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const productNameInput = document.getElementById("productName");
const productSkuInput = document.getElementById("productSku");
const generateSkuBtn = document.getElementById("generateSkuBtn");
const productCategoryInput = document.getElementById("productCategory");
const productPriceInput = document.getElementById("productPrice");
const productStockInput = document.getElementById("productStock");
const productMinStockInput = document.getElementById("productMinStock");
const productLocationInput = document.getElementById("productLocation");
const productDescriptionInput = document.getElementById("productDescription");
const decStockFormBtn = document.getElementById("decStockFormBtn");
const incStockFormBtn = document.getElementById("incStockFormBtn");

// Photo Elements (Gallery & Camera)
const photoPreviewBox = document.getElementById("photoPreviewBox");
const productImagePreview = document.getElementById("productImagePreview");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const photoMetadata = document.getElementById("photoMetadata");
const photoSizeBadge = document.getElementById("photoSizeBadge");
const removePhotoBtn = document.getElementById("removePhotoBtn");
const galleryFileInput = document.getElementById("galleryFileInput");
const cameraFileInput = document.getElementById("cameraFileInput");
const openGalleryBtn = document.getElementById("openGalleryBtn");
const openMobileCameraBtn = document.getElementById("openMobileCameraBtn");
const openWebcamBtn = document.getElementById("openWebcamBtn");

// Inventory Directory
const recordCountSubtitle = document.getElementById("recordCountSubtitle");
const sampleDataBtn = document.getElementById("sampleDataBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const backupJsonBtn = document.getElementById("backupJsonBtn");
const restoreJsonBtn = document.getElementById("restoreJsonBtn");
const restoreJsonInput = document.getElementById("restoreJsonInput");
const clearAllBtn = document.getElementById("clearAllBtn");

const tableViewContainer = document.getElementById("tableViewContainer");
const cardsViewContainer = document.getElementById("cardsViewContainer");
const inventoryTable = document.getElementById("inventoryTable");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateMessage = document.getElementById("emptyStateMessage");

// Mobile Bottom Dock
const dockHomeBtn = document.getElementById("dockHomeBtn");
const dockSearchBtn = document.getElementById("dockSearchBtn");
const dockAddBtn = document.getElementById("dockAddBtn");
const dockCameraBtn = document.getElementById("dockCameraBtn");

// Camera Modal
const cameraModal = document.getElementById("cameraModal");
const closeCameraModalBtn = document.getElementById("closeCameraModalBtn");
const cameraVideo = document.getElementById("cameraVideo");
const cameraSnapshotCanvas = document.getElementById("cameraSnapshotCanvas");
const cameraSnapshotReview = document.getElementById("cameraSnapshotReview");
const liveStreamControls = document.getElementById("liveStreamControls");
const reviewSnapshotControls = document.getElementById("reviewSnapshotControls");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const snapPhotoBtn = document.getElementById("snapPhotoBtn");
const retakeSnapshotBtn = document.getElementById("retakeSnapshotBtn");
const acceptSnapshotBtn = document.getElementById("acceptSnapshotBtn");
const cameraErrorMsg = document.getElementById("cameraErrorMsg");

// Lightbox Modal
const lightboxModal = document.getElementById("lightboxModal");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxProductTitle = document.getElementById("lightboxProductTitle");
const closeLightboxBtn = document.getElementById("closeLightboxBtn");

// Install PWA Modal
const installAppBtn = document.getElementById("installAppBtn");
const installHelpBtn = document.getElementById("installHelpBtn");
const installModal = document.getElementById("installModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const offlineBanner = document.getElementById("offlineBanner");

// Admin Login Modal
const adminLoginModal = document.getElementById("adminLoginModal");
const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsernameInput");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const togglePasswordVisibilityBtn = document.getElementById("togglePasswordVisibilityBtn");
const adminLoginError = document.getElementById("adminLoginError");

// Link Phone QR Code Modal
const linkPhoneModal = document.getElementById("linkPhoneModal");
const closeLinkPhoneModalBtn = document.getElementById("closeLinkPhoneModalBtn");
const qrCodeImage = document.getElementById("qrCodeImage");
const qrLoadingSpinner = document.getElementById("qrLoadingSpinner");
const directSyncLinkInput = document.getElementById("directSyncLinkInput");
const copySyncLinkBtn = document.getElementById("copySyncLinkBtn");

// Internal State
let currentPhotoBase64 = "";
let editingProductId = null;
let currentViewMode = "table"; // "table" | "cards"
let activeChipCategory = "";
let activeChipStatus = "";
let activeMediaStream = null;
let currentFacingMode = "environment";
let tempSnapshotDataUrl = "";
let deferredInstallPrompt = null;

// ------------------------------------------------------------
// 7. THEME SWITCHER (LIGHT VS DARK MODE)
// ------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem("choy_theme_mode") || "dark";
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
  document.body.className = isLight ? "theme-light" : "theme-dark";

  if (themeLabelText) {
    themeLabelText.textContent = isLight ? "Light Mode" : "Dark Mode";
  }

  if (dockThemeIcon && dockThemeText) {
    dockThemeIcon.textContent = isLight ? "🌙" : "☀️";
    dockThemeText.textContent = isLight ? "Dark" : "Light";
  }

  localStorage.setItem("choy_theme_mode", isLight ? "light" : "dark");
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
}

if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
if (dockThemeBtn) dockThemeBtn.addEventListener("click", toggleTheme);

// ------------------------------------------------------------
// 8. PHOTO PREVIEW & COMPRESSION
// ------------------------------------------------------------
function setProductPhoto(base64Data, sizeKb = null) {
  currentPhotoBase64 = base64Data || "";

  if (currentPhotoBase64) {
    productImagePreview.src = currentPhotoBase64;
    productImagePreview.hidden = false;
    photoPlaceholder.hidden = true;
    photoMetadata.hidden = false;

    const estimatedKb = sizeKb || ImageOptimizer.estimateSizeKb(currentPhotoBase64);
    photoSizeBadge.textContent = `Optimized: ${estimatedKb} KB`;
  } else {
    productImagePreview.src = "";
    productImagePreview.hidden = true;
    photoPlaceholder.hidden = false;
    photoMetadata.hidden = true;
  }
}

function clearProductPhoto() {
  setProductPhoto("");
  if (galleryFileInput) galleryFileInput.value = "";
  if (cameraFileInput) cameraFileInput.value = "";
}

async function handleImageFile(file) {
  if (!file) return;
  try {
    const optimized = await ImageOptimizer.compress(file, 680, 0.80);
    setProductPhoto(optimized.dataUrl, optimized.sizeKb);
  } catch (err) {
    console.error("Image processing error:", err);
    alert("Unable to process image. Please try another file.");
  }
}

// Phone Gallery file input listener (accesses phone photo library)
if (galleryFileInput) {
  galleryFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleImageFile(file);
  });
}

// Phone Camera file input listener (launches phone camera)
if (cameraFileInput) {
  cameraFileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleImageFile(file);
  });
}

// Gallery & Camera button triggers
if (openGalleryBtn) {
  openGalleryBtn.addEventListener("click", () => {
    if (galleryFileInput) galleryFileInput.click();
  });
}

if (openMobileCameraBtn) {
  openMobileCameraBtn.addEventListener("click", () => {
    if (cameraFileInput) cameraFileInput.click();
  });
}

if (photoPlaceholder) {
  photoPlaceholder.addEventListener("click", () => {
    if (galleryFileInput) galleryFileInput.click();
  });
}

removePhotoBtn.addEventListener("click", clearProductPhoto);

// Drag & drop photo zone
photoPreviewBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  photoPreviewBox.style.borderColor = "#38bdf8";
});

photoPreviewBox.addEventListener("dragleave", () => {
  photoPreviewBox.style.borderColor = "";
});

photoPreviewBox.addEventListener("drop", async (e) => {
  e.preventDefault();
  photoPreviewBox.style.borderColor = "";
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("image/")) {
      handleImageFile(file);
    }
  }
});

// ------------------------------------------------------------
// 9. LIVE CAMERA & WEBCAM CONTROLLER
// ------------------------------------------------------------
async function startCameraStream() {
  stopCameraStream();
  cameraErrorMsg.hidden = true;
  cameraSnapshotReview.hidden = true;
  liveStreamControls.hidden = false;
  reviewSnapshotControls.hidden = true;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraErrorMsg.hidden = false;
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    activeMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraVideo.srcObject = activeMediaStream;
    await cameraVideo.play();
  } catch (err) {
    console.warn("Live camera start failed, trying fallback:", err);
    try {
      activeMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraVideo.srcObject = activeMediaStream;
      await cameraVideo.play();
    } catch (fallbackErr) {
      console.error("Camera fallback failed:", fallbackErr);
      cameraErrorMsg.hidden = false;
    }
  }
}

function stopCameraStream() {
  if (activeMediaStream) {
    activeMediaStream.getTracks().forEach(track => track.stop());
    activeMediaStream = null;
  }
  if (cameraVideo) {
    cameraVideo.srcObject = null;
  }
}

function openCameraModal() {
  cameraModal.classList.add("active");
  startCameraStream();
}

function closeCameraModal() {
  stopCameraStream();
  cameraModal.classList.remove("active");
}

openWebcamBtn.addEventListener("click", openCameraModal);
closeCameraModalBtn.addEventListener("click", closeCameraModal);
cameraModal.addEventListener("click", (e) => {
  if (e.target === cameraModal) closeCameraModal();
});

switchCameraBtn.addEventListener("click", async () => {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  await startCameraStream();
});

snapPhotoBtn.addEventListener("click", () => {
  if (!cameraVideo.videoWidth) return;

  const canvas = cameraSnapshotCanvas;
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  tempSnapshotDataUrl = canvas.toDataURL("image/jpeg", 0.9);
  cameraSnapshotReview.src = tempSnapshotDataUrl;
  cameraSnapshotReview.hidden = false;

  liveStreamControls.hidden = true;
  reviewSnapshotControls.hidden = false;
});

retakeSnapshotBtn.addEventListener("click", () => {
  tempSnapshotDataUrl = "";
  cameraSnapshotReview.hidden = true;
  liveStreamControls.hidden = false;
  reviewSnapshotControls.hidden = true;
});

acceptSnapshotBtn.addEventListener("click", async () => {
  if (tempSnapshotDataUrl) {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 720;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = c.toDataURL("image/jpeg", 0.82);
        const sizeKb = Math.round((compressed.length * 3) / 4 / 1024);
        setProductPhoto(compressed, sizeKb);
        closeCameraModal();
      };
      img.src = tempSnapshotDataUrl;
    } catch (err) {
      setProductPhoto(tempSnapshotDataUrl);
      closeCameraModal();
    }
  }
});

// ------------------------------------------------------------
// 10. PRODUCT FORM (ADD, EDIT, RESET)
// ------------------------------------------------------------
function resetProductForm() {
  productForm.reset();
  clearProductPhoto();
  editingProductId = null;
  formTitle.textContent = "➕ Add Product to Catalog";
  submitProductBtn.textContent = "➕ Add Product";
  cancelEditBtn.hidden = true;
  productStockInput.value = "0";
  productMinStockInput.value = "10";
}

formResetBtn.addEventListener("click", resetProductForm);
cancelEditBtn.addEventListener("click", resetProductForm);

decStockFormBtn.addEventListener("click", () => {
  const current = parseInt(productStockInput.value, 10) || 0;
  productStockInput.value = Math.max(0, current - 1);
});

incStockFormBtn.addEventListener("click", () => {
  const current = parseInt(productStockInput.value, 10) || 0;
  productStockInput.value = current + 1;
});

generateSkuBtn.addEventListener("click", () => {
  const category = productCategoryInput.value.trim() || "CA";
  const prefix = category.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "") || "CA";
  const count = InventoryDatabase.getAll().length + 1;
  const numStr = String(count).padStart(3, "0");
  productSkuInput.value = `${prefix}-${numStr}`;
});

productForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!AdminAuthManager.isAdmin()) {
    openAdminModal();
    return;
  }

  const name = productNameInput.value.trim();
  const sku = productSkuInput.value.trim().toUpperCase();
  const category = productCategoryInput.value.trim();
  const price = parseFloat(productPriceInput.value);
  const stock = parseInt(productStockInput.value, 10);
  const minStock = parseInt(productMinStockInput.value, 10) || 10;
  const location = productLocationInput.value.trim();
  const description = productDescriptionInput.value.trim();

  if (!name || !sku || !category || isNaN(price) || isNaN(stock)) {
    alert("Please fill in all required fields (Name, SKU, Category, Price, Stock).");
    return;
  }

  // Duplicate SKU check
  const duplicate = InventoryDatabase.getAll().find(p => p.sku === sku && p.id !== editingProductId);
  if (duplicate) {
    if (!confirm(`Warning: SKU "${sku}" already exists for "${duplicate.name}". Do you still want to use it?`)) {
      return;
    }
  }

  if (editingProductId) {
    InventoryDatabase.update(editingProductId, {
      name,
      sku,
      category,
      price,
      stock,
      minStock,
      location,
      description,
      image: currentPhotoBase64
    });
  } else {
    const newProduct = ProductFactory(
      name,
      sku,
      category,
      price,
      stock,
      minStock,
      location,
      description,
      currentPhotoBase64
    );
    InventoryDatabase.add(newProduct);
  }

  resetProductForm();
  renderInventory();
});

function startEditProduct(id) {
  const product = InventoryDatabase.getById(id);
  if (!product) return;

  editingProductId = id;
  productNameInput.value = product.name;
  productSkuInput.value = product.sku;
  productCategoryInput.value = product.category;
  productPriceInput.value = product.price;
  productStockInput.value = product.stock;
  productMinStockInput.value = product.minStock;
  productLocationInput.value = product.location || "";
  productDescriptionInput.value = product.description || "";

  setProductPhoto(product.image);

  formTitle.textContent = `✏️ Edit: ${product.name}`;
  submitProductBtn.textContent = "💾 Save Changes";
  cancelEditBtn.hidden = false;

  productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProduct(id) {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  const product = InventoryDatabase.getById(id);
  if (!product) return;

  if (confirm(`Delete "${product.name}" (SKU: ${product.sku}) from inventory?`)) {
    InventoryDatabase.remove(id);
    if (editingProductId === id) {
      resetProductForm();
    }
    renderInventory();
  }
}

// ------------------------------------------------------------
// 11. INVENTORY RENDERING & FILTERING
// ------------------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateCategoryOptionsAndChips() {
  const products = InventoryDatabase.getAll();
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Update select dropdown
  const currentSelect = filterCategory.value;
  filterCategory.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === currentSelect) opt.selected = true;
    filterCategory.appendChild(opt);
  });

  // Re-render horizontal category chips
  const totalItemsCount = products.length;
  let chipsHtml = `<button type="button" class="chip-btn ${!activeChipCategory && !activeChipStatus ? "active" : ""}" data-category="">All (${totalItemsCount})</button>`;

  categories.forEach(cat => {
    const count = products.filter(p => p.category === cat).length;
    const isActive = activeChipCategory === cat;
    chipsHtml += `<button type="button" class="chip-btn ${isActive ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
  });

  const alertCount = products.filter(p => {
    const s = StockStrategy.getStatus(p.stock, p.minStock);
    return s.code === "LOW_STOCK" || s.code === "OUT_OF_STOCK";
  }).length;

  chipsHtml += `<button type="button" class="chip-btn chip-alert ${activeChipStatus === "ALERT" ? "active" : ""}" data-status="ALERT">⚠️ Alerts (${alertCount})</button>`;

  categoryChipsContainer.innerHTML = chipsHtml;
}

function getFilteredAndSortedProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = activeChipCategory || filterCategory.value;
  const selectedStatus = activeChipStatus || filterStatus.value;
  const sortBy = sortBySelect.value;

  let items = InventoryDatabase.getAll().filter(p => {
    // Search
    if (searchTerm) {
      const haystack = [p.name, p.sku, p.category, p.location, p.description].join(" ").toLowerCase();
      if (!haystack.includes(searchTerm)) return false;
    }

    // Category
    if (selectedCategory && p.category !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus) {
      const st = StockStrategy.getStatus(p.stock, p.minStock);
      if (selectedStatus === "ALERT") {
        if (st.code !== "LOW_STOCK" && st.code !== "OUT_OF_STOCK") return false;
      } else if (st.code !== selectedStatus) {
        return false;
      }
    }

    return true;
  });

  // Sort
  items.sort((a, b) => {
    switch (sortBy) {
      case "name_asc": return a.name.localeCompare(b.name);
      case "sku_asc": return a.sku.localeCompare(b.sku);
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "stock_asc": return a.stock - b.stock;
      case "stock_desc": return b.stock - a.stock;
      case "newest":
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  return items;
}

function renderInventory() {
  const allProducts = InventoryDatabase.getAll();
  const filtered = getFilteredAndSortedProducts();

  updateCategoryOptionsAndChips();
  updateDashboardMetrics(allProducts);

  recordCountSubtitle.textContent = `Showing ${filtered.length} of ${allProducts.length} product${allProducts.length === 1 ? "" : "s"}`;

  inventoryTableBody.innerHTML = "";
  cardsViewContainer.innerHTML = "";

  if (filtered.length === 0) {
    tableViewContainer.hidden = true;
    cardsViewContainer.hidden = true;
    emptyState.hidden = false;

    if (allProducts.length === 0) {
      emptyStateTitle.textContent = "No products in inventory yet.";
      emptyStateMessage.textContent = 'Add a new product above or click "✨ Sample Data" to load Choy Apparel items!';
    } else {
      emptyStateTitle.textContent = "No matching products found.";
      emptyStateMessage.textContent = "Try a different search keyword or tap 'All' on the category bar.";
    }
    return;
  }

  emptyState.hidden = true;

  if (currentViewMode === "table") {
    tableViewContainer.hidden = false;
    cardsViewContainer.hidden = true;
    renderTableView(filtered);
  } else {
    tableViewContainer.hidden = true;
    cardsViewContainer.hidden = false;
    renderCardsView(filtered);
  }
}

function renderTableView(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(p => {
    const status = StockStrategy.getStatus(p.stock, p.minStock);
    const itemTotalValue = StockStrategy.calculateItemValue(p.price, p.stock);
    const tr = document.createElement("tr");

    const photoHtml = p.image
      ? `<div class="table-thumbnail-wrapper" data-action="zoom" data-id="${p.id}" title="Click to view full photo">
           <img src="${p.image}" alt="${escapeHtml(p.name)}" class="table-thumbnail-img">
           <span class="zoom-overlay">🔍</span>
         </div>`
      : `<div class="table-thumbnail-wrapper" title="No photo">
           <span class="table-thumbnail-placeholder">👕</span>
         </div>`;

    tr.innerHTML = `
      <td>${photoHtml}</td>
      <td>
        <div class="product-cell-info">
          <span class="product-cell-name">${escapeHtml(p.name)}</span>
          ${p.description ? `<span class="product-cell-desc" title="${escapeHtml(p.description)}">${escapeHtml(p.description)}</span>` : ""}
        </div>
      </td>
      <td><span class="sku-badge">${escapeHtml(p.sku)}</span></td>
      <td><span class="category-badge">${escapeHtml(p.category)}</span></td>
      <td><span class="price-text">${StockStrategy.formatCurrency(p.price)}</span></td>
      <td>
        <div class="stock-stepper-cell">
          <button class="quick-stock-btn" data-action="dec-stock" data-id="${p.id}" title="Subtract 1">-</button>
          <span class="stock-value-cell">${p.stock}</span>
          <button class="quick-stock-btn" data-action="inc-stock" data-id="${p.id}" title="Add 1">+</button>
        </div>
      </td>
      <td><span style="font-size: 0.825rem; color: var(--text-muted);">${escapeHtml(p.location || "—")}</span></td>
      <td><strong>${StockStrategy.formatCurrency(itemTotalValue)}</strong></td>
      <td><span class="status-badge ${status.badgeClass}">${status.icon} ${status.label}</span></td>
      <td style="text-align: right;">
        <div class="row-actions">
          <button class="small-btn edit" data-action="edit" data-id="${p.id}" title="Edit product">Edit</button>
          <button class="small-btn delete" data-action="delete" data-id="${p.id}" title="Delete product">Delete</button>
        </div>
      </td>
    `;

    fragment.appendChild(tr);
  });

  inventoryTableBody.appendChild(fragment);
}

function renderCardsView(items) {
  const fragment = document.createDocumentFragment();

  items.forEach(p => {
    const status = StockStrategy.getStatus(p.stock, p.minStock);
    const itemTotalValue = StockStrategy.calculateItemValue(p.price, p.stock);
    const card = document.createElement("div");
    card.className = "product-card-item";

    const imageHtml = p.image
      ? `<div class="card-img-wrapper" data-action="zoom" data-id="${p.id}" title="Click to view full photo">
           <img src="${p.image}" alt="${escapeHtml(p.name)}" class="card-img">
           <span class="zoom-overlay">🔍 View Photo</span>
           <span class="status-badge ${status.badgeClass} card-status-badge-pos">${status.icon} ${status.label}</span>
         </div>`
      : `<div class="card-img-wrapper" title="No photo">
           <span class="card-img-placeholder">👕</span>
           <span class="status-badge ${status.badgeClass} card-status-badge-pos">${status.icon} ${status.label}</span>
         </div>`;

    card.innerHTML = `
      ${imageHtml}
      <div class="card-details-body">
        <div class="card-meta-line">
          <span class="sku-badge">${escapeHtml(p.sku)}</span>
          <span class="category-badge">${escapeHtml(p.category)}</span>
        </div>
        <h4 class="card-prod-title">${escapeHtml(p.name)}</h4>
        <p class="card-prod-desc">${escapeHtml(p.description || "No description provided.")}</p>
        
        <div class="card-info-row">
          <span class="card-price">${StockStrategy.formatCurrency(p.price)}</span>
          <div class="stock-stepper-cell">
            <span style="font-size: 0.775rem; color: var(--text-muted); margin-right: 2px;">Stock:</span>
            <button class="quick-stock-btn" data-action="dec-stock" data-id="${p.id}" title="Subtract 1">-</button>
            <span class="stock-value-cell">${p.stock}</span>
            <button class="quick-stock-btn" data-action="inc-stock" data-id="${p.id}" title="Add 1">+</button>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
          <span>Loc: <strong>${escapeHtml(p.location || "N/A")}</strong></span>
          <span>Val: <strong>${StockStrategy.formatCurrency(itemTotalValue)}</strong></span>
        </div>
      </div>
      <div class="card-footer-actions">
        <button class="small-btn edit" data-action="edit" data-id="${p.id}">✏️ Edit</button>
        <button class="small-btn delete" data-action="delete" data-id="${p.id}">🗑️ Delete</button>
      </div>
    `;

    fragment.appendChild(card);
  });

  cardsViewContainer.appendChild(fragment);
}

function updateDashboardMetrics(products) {
  const totalProducts = products.length;
  let totalUnits = 0;
  let totalValue = 0;
  let inStockCount = 0;
  let lowCount = 0;
  let outCount = 0;

  const categories = new Set();

  products.forEach(p => {
    const qty = p.stock || 0;
    const price = p.price || 0;
    totalUnits += qty;
    totalValue += qty * price;
    if (p.category) categories.add(p.category);

    const st = StockStrategy.getStatus(qty, p.minStock);
    if (st.code === "IN_STOCK") inStockCount++;
    if (st.code === "LOW_STOCK") lowCount++;
    if (st.code === "OUT_OF_STOCK") outCount++;
  });

  statTotalValue.textContent = StockStrategy.formatCurrency(totalValue);
  statTotalUnitsSub.textContent = `${totalUnits.toLocaleString()} stock units in shelves`;
  statTotalProducts.textContent = totalProducts;
  statCategoryCountSub.textContent = `${categories.size} categories active`;

  healthInStockCount.textContent = inStockCount;
  statLowStockCount.textContent = lowCount;
  statOutOfStockCount.textContent = outCount;

  // Circular Meter Percentage
  const healthyPercent = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 100;
  meterPercentText.textContent = `${healthyPercent}%`;
  meterCirclePath.setAttribute("stroke-dasharray", `${healthyPercent}, 100`);

  if (healthyPercent < 50) {
    meterCirclePath.style.stroke = "var(--danger)";
  } else if (healthyPercent < 80) {
    meterCirclePath.style.stroke = "var(--warning)";
  } else {
    meterCirclePath.style.stroke = "var(--success)";
  }
}

// ------------------------------------------------------------
// 12. EVENT DELEGATION (TABLE & CARD ACTIONS)
// ------------------------------------------------------------
function handleActionClick(e) {
  const target = e.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "edit") {
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    startEditProduct(id);
  } else if (action === "delete") {
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    deleteProduct(id);
  } else if (action === "inc-stock") {
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    InventoryDatabase.adjustStock(id, 1);
    renderInventory();
  } else if (action === "dec-stock") {
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    InventoryDatabase.adjustStock(id, -1);
    renderInventory();
  } else if (action === "zoom") {
    const product = InventoryDatabase.getById(id);
    if (product && product.image) {
      openLightbox(product.image, product.name);
    }
  }
}

inventoryTableBody.addEventListener("click", handleActionClick);
cardsViewContainer.addEventListener("click", handleActionClick);

// ------------------------------------------------------------
// 13. ADMIN LOGIN & PHONE LINK MODALS
// ------------------------------------------------------------
function openAdminModal() {
  if (adminLoginError) adminLoginError.hidden = true;
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginModal) {
    adminLoginModal.classList.add("active");
    if (adminPasswordInput) adminPasswordInput.focus();
  }
}

function closeAdminModal() {
  if (adminLoginModal) adminLoginModal.classList.remove("active");
}

if (adminAuthBtn) adminAuthBtn.addEventListener("click", openAdminModal);
if (bannerLoginBtn) bannerLoginBtn.addEventListener("click", openAdminModal);
if (closeAdminModalBtn) closeAdminModalBtn.addEventListener("click", closeAdminModal);
if (adminLoginModal) {
  adminLoginModal.addEventListener("click", (e) => {
    if (e.target === adminLoginModal) closeAdminModal();
  });
}

if (togglePasswordVisibilityBtn && adminPasswordInput) {
  togglePasswordVisibilityBtn.addEventListener("click", () => {
    const isPw = adminPasswordInput.type === "password";
    adminPasswordInput.type = isPw ? "text" : "password";
    togglePasswordVisibilityBtn.textContent = isPw ? "🙈" : "👁️";
  });
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = adminUsernameInput ? adminUsernameInput.value : "";
    const pass = adminPasswordInput ? adminPasswordInput.value : "";

    if (AdminAuthManager.login(user, pass)) {
      closeAdminModal();
      renderInventory();
      CloudSyncEngine.fetchCloudInventory();
    } else {
      if (adminLoginError) adminLoginError.hidden = false;
    }
  });
}

const logoutAdminBtn = document.getElementById("logoutAdminBtn");
if (logoutAdminBtn) {
  logoutAdminBtn.addEventListener("click", () => {
    AdminAuthManager.logout();
    closeAdminModal();
    renderInventory();
  });
}

// Link Phone QR Code Modal (Instant sync without typing!)
function openLinkPhoneModal() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const directLink = `${origin}${pathname}#admin_key=${DEFAULT_STORE_PIN}`;

  if (directSyncLinkInput) directSyncLinkInput.value = directLink;
  if (qrLoadingSpinner) qrLoadingSpinner.hidden = false;
  if (qrCodeImage) qrCodeImage.hidden = true;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(directLink)}`;
  if (qrCodeImage) {
    qrCodeImage.onload = () => {
      if (qrLoadingSpinner) qrLoadingSpinner.hidden = true;
      qrCodeImage.hidden = false;
    };
    qrCodeImage.onerror = () => {
      if (qrLoadingSpinner) qrLoadingSpinner.textContent = "Open link below on your phone";
    };
    qrCodeImage.src = qrUrl;
  }

  if (linkPhoneModal) linkPhoneModal.classList.add("active");
}

function closeLinkPhoneModal() {
  if (linkPhoneModal) linkPhoneModal.classList.remove("active");
}

if (linkPhoneBtn) linkPhoneBtn.addEventListener("click", openLinkPhoneModal);
if (closeLinkPhoneModalBtn) closeLinkPhoneModalBtn.addEventListener("click", closeLinkPhoneModal);
if (linkPhoneModal) {
  linkPhoneModal.addEventListener("click", (e) => {
    if (e.target === linkPhoneModal) closeLinkPhoneModal();
  });
}

if (copySyncLinkBtn && directSyncLinkInput) {
  copySyncLinkBtn.addEventListener("click", () => {
    directSyncLinkInput.select();
    navigator.clipboard.writeText(directSyncLinkInput.value).then(() => {
      const originalText = copySyncLinkBtn.textContent;
      copySyncLinkBtn.textContent = "✓ Copied!";
      setTimeout(() => { copySyncLinkBtn.textContent = originalText; }, 2000);
    });
  });
}

// Cloud Sync Button in header (Manual sync trigger)
if (cloudSyncBtn) {
  cloudSyncBtn.addEventListener("click", () => {
    CloudSyncEngine.fetchCloudInventory();
  });
}

// ------------------------------------------------------------
// 13. LIGHTBOX MODAL
// ------------------------------------------------------------
function openLightbox(imageUrl, title = "Product Photo") {
  lightboxImage.src = imageUrl;
  lightboxProductTitle.textContent = title;
  lightboxModal.classList.add("active");
}

function closeLightbox() {
  lightboxModal.classList.remove("active");
  lightboxImage.src = "";
}

closeLightboxBtn.addEventListener("click", closeLightbox);
lightboxModal.addEventListener("click", (e) => {
  if (e.target === lightboxModal) closeLightbox();
});

// ------------------------------------------------------------
// 14. SEARCH, FILTERS & CHIPS
// ------------------------------------------------------------
searchInput.addEventListener("input", () => {
  clearSearchBtn.hidden = !searchInput.value;
  renderInventory();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.hidden = true;
  renderInventory();
});

toggleFiltersPanelBtn.addEventListener("click", () => {
  advancedFilterPanel.hidden = !advancedFilterPanel.hidden;
});

// Click on category chips
categoryChipsContainer.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip-btn");
  if (!chip) return;

  if (chip.dataset.status === "ALERT") {
    activeChipStatus = activeChipStatus === "ALERT" ? "" : "ALERT";
    activeChipCategory = "";
  } else {
    activeChipCategory = chip.dataset.category || "";
    activeChipStatus = "";
  }

  // Sync with dropdowns
  filterCategory.value = activeChipCategory;
  filterStatus.value = activeChipStatus;

  renderInventory();
});

filterCategory.addEventListener("change", () => {
  activeChipCategory = filterCategory.value;
  renderInventory();
});

filterStatus.addEventListener("change", () => {
  activeChipStatus = filterStatus.value;
  renderInventory();
});

sortBySelect.addEventListener("change", renderInventory);

viewTableBtn.addEventListener("click", () => {
  currentViewMode = "table";
  viewTableBtn.classList.add("active");
  viewCardsBtn.classList.remove("active");
  renderInventory();
});

viewCardsBtn.addEventListener("click", () => {
  currentViewMode = "cards";
  viewCardsBtn.classList.add("active");
  viewTableBtn.classList.remove("active");
  renderInventory();
});

// Click on Stock Health card to toggle stock alert filter
stockHealthCard.addEventListener("click", () => {
  activeChipStatus = activeChipStatus === "ALERT" ? "" : "ALERT";
  activeChipCategory = "";
  filterStatus.value = activeChipStatus;
  renderInventory();
});

// Quick action buttons in Hero and Dashboard
heroAddBtn.addEventListener("click", () => {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  resetProductForm();
  productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
  productNameInput.focus();
});

heroCameraBtn.addEventListener("click", () => {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
  if (galleryFileInput) galleryFileInput.click();
});

if (dashGalleryBtn) {
  dashGalleryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
    if (galleryFileInput) galleryFileInput.click();
  });
}

if (dashCameraBtn) {
  dashCameraBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
    productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
    if (cameraFileInput) cameraFileInput.click();
  });
}

quickCameraActionCard.addEventListener("click", (e) => {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  if (e.target !== dashCameraBtn && e.target !== dashGalleryBtn) {
    productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
    if (galleryFileInput) galleryFileInput.click();
  }
});

// ------------------------------------------------------------
// 15. MOBILE BOTTOM DOCK NAVIGATION
// ------------------------------------------------------------
dockHomeBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

dockSearchBtn.addEventListener("click", () => {
  searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
  searchInput.focus();
});

dockAddBtn.addEventListener("click", () => {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  resetProductForm();
  productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
  productNameInput.focus();
});

dockCameraBtn.addEventListener("click", () => {
  if (!AdminAuthManager.isAdmin()) { openAdminModal(); return; }
  productFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
  if (galleryFileInput) galleryFileInput.click();
});

// ------------------------------------------------------------
// 16. DATA EXPORT, BACKUP & RESTORE
// ------------------------------------------------------------
sampleDataBtn.addEventListener("click", () => {
  if (InventoryDatabase.getAll().length > 0) {
    if (!confirm("Load Choy Apparel sample products? This will refresh your demo catalog.")) {
      return;
    }
  }
  InventoryDatabase.loadSampleData();
  resetProductForm();
  renderInventory();
});

exportCsvBtn.addEventListener("click", () => {
  const products = InventoryDatabase.getAll();
  if (!products.length) {
    alert("No products in inventory to export.");
    return;
  }

  const headers = [
    "Product Name",
    "SKU",
    "Category",
    "Unit Price (PHP)",
    "Stock Qty",
    "Min Stock Alert",
    "Location",
    "Total Value (PHP)",
    "Status",
    "Description"
  ];

  const rows = products.map(p => {
    const st = StockStrategy.getStatus(p.stock, p.minStock);
    const itemVal = StockStrategy.calculateItemValue(p.price, p.stock);

    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.price.toFixed(2),
      p.stock,
      p.minStock,
      `"${(p.location || "").replace(/"/g, '""')}"`,
      itemVal.toFixed(2),
      `"${st.label}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `choy_apparel_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

backupJsonBtn.addEventListener("click", () => {
  const json = InventoryDatabase.exportJson();
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `choy_apparel_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

restoreJsonBtn.addEventListener("click", () => {
  restoreJsonInput.click();
});

restoreJsonInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (confirm("Restore inventory from backup? This will replace current items.")) {
      const ok = InventoryDatabase.importJson(event.target.result);
      if (ok) {
        resetProductForm();
        renderInventory();
        alert("Inventory restored successfully!");
      }
    }
    restoreJsonInput.value = "";
  };
  reader.readAsText(file);
});

clearAllBtn.addEventListener("click", () => {
  const products = InventoryDatabase.getAll();
  if (!products.length) {
    alert("Inventory is already empty.");
    return;
  }

  if (confirm("⚠️ Delete ALL products from Choy Apparel inventory? This cannot be undone.")) {
    InventoryDatabase.clear();
    resetProductForm();
    renderInventory();
  }
});

// ------------------------------------------------------------
// 17. PWA DOWNLOAD & INSTALLATION
// ------------------------------------------------------------
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installAppBtn) {
    installAppBtn.style.display = "inline-flex";
  }
});

window.addEventListener("appinstalled", () => {
  console.log("Choy Apparel PWA installed successfully!");
  deferredInstallPrompt = null;
  if (installAppBtn) {
    installAppBtn.style.display = "none";
  }
});

function openInstallModal() {
  if (installModal) installModal.classList.add("active");
}

function closeInstallModal() {
  if (installModal) installModal.classList.remove("active");
}

if (installAppBtn) {
  installAppBtn.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      console.log("Install prompt choice:", choice.outcome);
      deferredInstallPrompt = null;
    } else {
      openInstallModal();
    }
  });
}

if (installHelpBtn) installHelpBtn.addEventListener("click", openInstallModal);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeInstallModal);
if (installModal) {
  installModal.addEventListener("click", (e) => {
    if (e.target === installModal) closeInstallModal();
  });
}

// Online/Offline detection
function handleNetworkChange() {
  if (offlineBanner) {
    if (!navigator.onLine) {
      offlineBanner.classList.add("active");
    } else {
      offlineBanner.classList.remove("active");
    }
  }
}
window.addEventListener("online", handleNetworkChange);
window.addEventListener("offline", handleNetworkChange);
handleNetworkChange();

// Register Service Worker for offline capability
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker registered:", reg.scope))
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

// ------------------------------------------------------------
// 18. INITIAL STARTUP
// ------------------------------------------------------------
initTheme();
AdminAuthManager.init();

if (InventoryDatabase.getAll().length === 0) {
  InventoryDatabase.loadSampleData();
}

renderInventory();

// Pull latest cloud data immediately, then start auto-sync polling
CloudSyncEngine.fetchCloudInventory();
CloudSyncEngine.startAutoSync();
