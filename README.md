# 📦 StockMaster - Inventory Management & Product Camera System

A fast, lightweight, and offline-capable **Inventory Management Web Application** built using the exact same clean, serverless approach as the Student Record App.

No MySQL, no XAMPP, and no complex backend configurations required. Everything persists directly and securely to your browser's **LocalStorage**, complete with smart automatic canvas photo compression so you can store dozens of products and pictures without running out of storage.

---

## 🌟 Key Features

### 📷 Product Camera & Photos
* **On Phone**: Tap **"📸 Camera / Gallery"** — launches your smartphone's rear camera (`capture="environment"`) immediately so you can snap actual products right on your shelf.
* **On PC / Laptop**: 
  * Choose existing pictures from your hard drive or phone gallery.
  * Or click **"🔴 Live Viewfinder"** to open a real-time live webcam viewfinder with a physical shutter button and instant retake / accept controls.
* **Smart Auto-Compression**: Product photos are automatically resized to max 720px and compressed via HTML5 Canvas (~35KB–65KB), ensuring crisp visuals while saving maximum LocalStorage quota.
* **Click-to-Zoom Lightbox**: Tap any photo thumbnail in the table or card grid to view the full picture.

### 🏷️ Complete Product Management
* **Fields**: Product Name, SKU / Product Code, Category, Unit Price (₱ Philippine Peso), Stock Quantity, Low-Stock Alert Threshold, Storage Location / Shelf, and Description.
* **⚡ Auto SKU Generator**: Click `⚡ Auto SKU` to automatically suggest formatted SKU numbers (e.g. `TS-001`, `CA-005`).
* **+/- Quick Steppers**: Quickly increase or decrease physical stock count with one click directly in the table or product card.
* **✏️ Edit & 🗑️ Delete**: Easily edit product details, swap photos, or remove discontinued items.

### ⚠️ Stock Health & Analytics
* **Automatic Status Tracking**:
  * 🟢 **In Stock**: Available stock exceeds minimum threshold.
  * 🟡 **Low Stock**: Stock is less than or equal to alert threshold.
  * 🔴 **Out of Stock**: Stock count is 0.
* **Real-time Dashboard Metrics**: Total Products, Total Stock Units, Total Inventory Value (₱), and Low / Out of Stock alerts count.
* **One-Click Alert Filtering**: Tap the **"Stock Alerts"** dashboard card to instantly isolate items that need urgent restocking.

### 🔍 Search, Filter & View Controls
* **Live Instant Search**: Filter in real-time across Product Name, SKU, Category, Location, and Description.
* **Category Filter**: Dynamically populated from your existing inventory.
* **Status Filter**: View only items in stock, low stock, or out of stock.
* **Multi-sort**: Sort by Newest, Name (A–Z), SKU (A–Z), Price (Low/High), or Stock (Low/High).
* **Two View Modes**: Toggle between **📑 Table View** and **🔲 Visual Cards Grid View**.

### 💾 Backup, Export & Offline PWA
* **100% Offline (PWA)**: Equipped with `manifest.json` and `sw.js` (Service Worker) — works without active internet connectivity.
* **📥 Export CSV**: Exports inventory to an Excel-friendly CSV spreadsheet with UTF-8 BOM encoding for proper Peso `₱` currency display.
* **💾 JSON Backup & Restore**: Download a full `.json` backup of your catalog (including compressed photo data) to transfer to another computer or phone.
* **✨ One-Click Sample Data**: Pre-loaded with realistic products including the exact example requested (*Black Oversized T-Shirt, White Oversized T-Shirt, Black Cap, Cargo Pants, and Canvas Tote Bag*).

---

## 🚀 How to Launch the Application

### Option 1: Double-Click Launcher (Recommended)
1. Navigate to the folder:
   ```
   C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app
   ```
2. Double-click **`Launch-App.bat`**.
3. A local server will start and open `http://localhost:8080` in your default browser.

---

### Option 2: Open on your Smartphone over Wi-Fi (To test your phone camera!)
1. Run **`Launch-App.bat`** on your computer.
2. Note the Wi-Fi IP address shown in the console window (e.g., `http://192.168.1.15:8080`).
3. Connect your phone to the **same Wi-Fi network**.
4. Open Chrome, Safari, or Edge on your phone and visit that URL.
5. Tap **"📸 Camera / Gallery"** to snap pictures of physical products using your phone's camera!

---

### Option 3: Direct File Opening
You can also directly double-click `index.html` to open it in any browser as a `file:///` page. LocalStorage and native file camera capture work out of the box.

---

## 🏗️ Software Design Patterns Used

* **Factory Pattern (`ProductFactory`)**: Standardizes the creation and formatting of product objects.
* **Singleton Pattern (`InventoryDatabase`)**: Manages the single authoritative inventory store and handles serialization to `localStorage`.
* **Strategy Pattern (`StockStrategy`)**: Encapsulates stock status calculation rules, valuation math, and currency formatting.
* **Image Optimizer Pipeline (`ImageOptimizer`)**: Handles asynchronous canvas compression and dimensions clamping.
