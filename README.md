# 📸 InstaCopy AI — Mobile Instagram Text Content Generator

A mobile-first, Progressive Web App (PWA) tool built for content creators and social media managers. Generate high-converting, human-sounding captions, hashtags, SEO keywords, and pinned comments from **text**, an **image (OCR)**, a **PDF**, or an **Excel file** in one click.

---

## 🚀 Quick Start (Open on your Phone in 1 Click)

### Method 1: Local Wi-Fi (Scan QR Code with Phone)
1. Double-click `start_mobile_tool.bat` (or run `python run_mobile.py` in terminal).
2. A **scannable QR code** will appear in your terminal.
3. Open your phone camera, scan the QR code, and tap the link!
4. *(Optional)* In Safari (iOS) tap **Share -> Add to Home Screen** or in Chrome (Android) tap **Menu -> Add to Home screen** to use it like a native mobile app.

### Method 2: Free 1-Click Cloud Hosting (Access Anywhere)
Because InstaCopy AI runs 100% client-side with zero backend dependencies:
- **Netlify Drop**: Drag and drop this folder onto [app.netlify.com/drop](https://app.netlify.com/drop) to get a free live `https://...` URL.
- **GitHub Pages**: Push this directory to a GitHub repository and turn on GitHub Pages.
- **Vercel**: Deploy with one command (`vercel`).

---

## 🌟 Key Features & Problem Solvers

### 1. Token-Saving Local Pre-Extraction
Images, PDFs, and Excel spreadsheets are parsed **directly inside your browser** before reaching Groq:
- **Images**: In-browser OCR via Tesseract.js (no Groq vision token spend).
- **PDF Documents**: In-browser PDF.js extracts all text across pages.
- **Excel & CSV**: In-browser SheetJS converts sheets to clean, readable tables.
- **Extracted Text Drawer**: An expandable drawer lets you review and tweak the text before generating.

### 2. Flexible Input (Fixed the "Must provide both" bug)
- **Text only?** Works instantly.
- **Image / File only?** Works instantly without needing extra text.
- **Both text and file?** Combines them seamlessly.

### 3. Permanently Saved Groq API Key
- Enter your Groq API key once in the **Settings** tab.
- It is saved permanently in your phone's `localStorage` — you never have to re-enter it.

### 4. Resolved Groq 404 Model Error
- Implements auto-detection of available models on your account.
- Includes automatic fallback chain:
  `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` → `llama3-70b-8192` → `llama3-8b-8192`
  If any model 404s, it seamlessly retries the next model without failing.

### 5. Strict Human Copywriting Standards
- **Hook at the start**: Every caption starts with a scroll-stopping hook on line 1.
- **Zero AI Clichés**: No *"In today's fast-paced world..."* or *"Elevate your journey..."*.
- **NO Em-Dash `—`**: Strictly prevented in the system prompt and scrubbed via post-processing filter.
- **No Fabricated Facts**: Unspecified numbers or stats are left as `[insert price]` placeholders.

### 6. Always Outputs 4 Labeled Sections
1. **3 Caption Options** (Direct hook, Story/Value hook, Punchy hook)
2. **Hashtags (15–20)** (Mix of broad reach and niche tags)
3. **Instagram SEO Keywords** (Natural search terms for the Instagram search algorithm)
4. **Pinned Comment** (Conversation starter to post immediately after publishing)

### 7. Fast Mobile Copying
- Dedicated **"Copy Everything"** button.
- One-tap **"📋 Copy"** buttons for each caption, the hashtag block, the SEO words, and the pinned comment.
- Haptic-ready visual toast feedback.

### 8. Personalize & Guide Tab
- **Brand Persona**: Save your niche, tone of voice, target audience, and custom rules (signature sign-off, do's/don'ts). Automatically applied to all generations.
- **Guide & Tips Assistant**: Ask the built-in AI copywriter for hook formulas, posting strategies, or caption revisions.
