# ⚡ CHOY APPAREL — Inventory Management & Product Camera System

> 🌐 **Live Website Link (Share with Friends):**  
> **[https://roljune.github.io/inventory-manangement-app/](https://roljune.github.io/inventory-manangement-app/)**

A fast, lightweight, and offline-capable **Streetwear Inventory Management Web Application** designed specifically for **Choy Apparel**.

Built with the same serverless approach as the Student Record App—no MySQL, no XAMPP, and no complicated backend setup needed. All data and compressed photos persist locally in your device's **LocalStorage**.

---

## 🌟 What's New in this Version

### 🌓 Light vs. Dark Mode Switch
* **Toggle Anywhere**: Tap the **☀️ / 🌙** theme toggle in the top-right header or on the floating mobile bottom dock.
* **Dual Design System**:
  * **Dark Mode**: Deep matte obsidian and graphite surfaces with the Choy Apparel wallpaper background.
  * **Light Mode**: Ultra-clean high-fashion silver & crisp white cards with inverted contrast badges.
* **Instant Persistence**: Your chosen mode is saved in `localStorage` so it stays selected every time you open the app.

### 🖼️ Choy Apparel Artwork Background
* The official **Choy Apparel** artwork is integrated as a full-bleed textured background with an adaptive translucent overlay that ensures maximum readability for all text, numbers, and product photos.

### 📲 Download App to Device (PWA)
* **Direct Installation**: Tap the pulsing **"📲 Download App"** button in the header or bottom dock to install Choy Apparel onto your Android device, iPhone/iPad, or Windows PC.
* **100% Offline**: Includes `manifest.json` and a Service Worker (`sw.js`) that caches all code and Choy Apparel assets for offline work.
* **Windows Desktop 1-Click Shortcut**: Double-click `Create-Desktop-App-Shortcut.bat` to place a dedicated shortcut right on your Windows desktop.

### 📷 Product Camera & Photos
* **Phone Rear Camera**: Tap **"📸 Camera / Gallery"** on your phone to open your smartphone's rear camera directly (`capture="environment"`).
* **Live Webcam Viewfinder**: Click **"🔴 Live Viewfinder"** on PC or mobile to get a live video viewfinder with snap, retake, and accept controls.
* **Smart Canvas Compression**: Photos are automatically compressed to ~35KB–65KB to ensure dozens of items fit without exceeding storage limits.
* **Lightbox Zoom**: Click any photo thumbnail in the table or card grid to view an enlarged version.

### 🎛️ Reference UI Architecture (Pills, Metrics, & Health Ring)
* **Pill Chips Bar**: Instant 1-tap filtering for `All Items`, `T-Shirts`, `Hoodies`, `Caps`, `Pants`, `Bags`, and `⚠️ Stock Alerts`.
* **Stock Health Meter**: Live circular gauge showing your in-stock percentage and alert breakdown.
* **Inline Quick Steppers**: Increase or decrease stock counts with `+` / `-` buttons directly from the table or card view.
* **Auto-SKU Generator**: Click `⚡ Auto SKU` to suggest formatted codes (e.g. `CA-001`, `TS-002`).

---

## 🚀 How to Run & Download the App

### Option 1: Double-Click Launcher (Windows PC)
1. Open the folder:
   ```
   C:\Users\monte\.gemini\antigravity\scratch\inventory-management-app
   ```
2. Double-click **`Launch-App.bat`**.
3. The local server opens `http://localhost:8080` in your browser.

---

### Option 2: Use on your Phone (To shoot actual photos with your phone camera!)
1. Run **`Launch-App.bat`** on your PC.
2. Note your computer's local Wi-Fi IP address shown in the black console window (e.g., `http://192.168.1.XX:8080`).
3. Connect your smartphone to the **same Wi-Fi network**.
4. Open Chrome, Safari, or Edge on your phone and go to that address.
5. Tap **"📲 Download App"** or tap your browser's menu $\rightarrow$ **"Add to Home Screen"** to install it like a native app!

---

### Option 3: Create Windows Desktop App Shortcut
* Double-click **`Create-Desktop-App-Shortcut.bat`**.
* A shortcut named **"Choy Apparel Inventory"** with the official Choy icon will appear right on your Windows Desktop!
