# 🚀 How to Run InvisiAI App

## ✅ **Current Status: RUNNING & READY!**
Your InvisiAI app is currently running with **PDF support + Enhanced Voice features**.

---

## 📋 **How to Start the App**

### **Method 1: Development Mode (Recommended)**
```powershell
# Navigate to project directory
Set-Location "c:\Users\VolcanO\Dropbox\PC\Desktop\Plu\pluely-app-v0.1.2"

# Start development server (with hot reload)
npm run tauri dev
```

### **Method 2: Production Build**
```powershell
# Build the app first
npm run build

# Then start production version
npm run tauri build
```

### **Method 3: Direct Development Server**
```powershell
# Start just the web server (for browser testing)
npm run dev
# Open http://localhost:1420 in browser
```

---

## 🎯 **New PDF Features - How to Test**

### **1. Upload PDF Files**
- Click the **📎 Attach button**
- Select **Images & PDFs** from file picker
- Choose any `.pdf` file
- PDF text will be **automatically extracted**

### **2. Ask Questions from PDF**
- Upload a PDF document
- Ask questions like:
  - *"What is this document about?"*
  - *"Summarize the main points"*
  - *"What does page 2 say about [topic]?"*
  - *"Extract key information from this PDF"*

### **3. Visual Indicators**
- **📄 PDF icon** shows in attachment area
- **Word count** displayed (e.g., "• 1,250 words")
- **Red gradient background** for PDF preview
- **Text preview** shows first 100 characters

---

## 🎤 **Enhanced Voice Features**

### **1. Pause/Resume Control**
- **Blue Pause Button** (⏸) - Pause voice input while AI responds
- **Orange Play Button** (▶) - Resume listening when ready

### **2. Live Transcription**
- **Real-time text display** as you speak
- **Auto-fills search bar** with transcribed text
- **Auto-submits** after 1-second delay

### **3. Smart Status Indicators**
- **🎤 Listening...** (Blue) - Detecting speech
- **⏸ Paused** (Orange) - Voice input paused
- **✓ Ready** (Green) - Ready for input

---

## 🔧 **Technical Requirements**

### **Dependencies Installed:**
- ✅ `pdfjs-dist` - PDF text extraction
- ✅ `@ricky0123/vad-web` - Voice activity detection
- ✅ All existing dependencies (React 19, Tauri, etc.)

### **API Configuration Required:**
1. **AI Provider** (Gemini/OpenAI/Claude) - Set in Settings
2. **Speech-to-Text** (AssemblyAI) - Configure API key
3. **Internet connection** - For PDF.js worker & API calls

---

## 🐛 **Troubleshooting**

### **App Won't Start:**
```powershell
# Kill existing processes
Get-Process -Name pluely -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear node modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install --force

# Try starting again
npm run tauri dev
```

### **PDF Not Working:**
- ✅ Check internet connection (PDF.js worker loads from CDN)
- ✅ Try smaller PDF files first (< 5MB recommended)
- ✅ Ensure PDF has actual text (not scanned images)

### **Voice Features Issues:**
- ✅ Allow microphone permissions
- ✅ Check speech provider API key in Settings
- ✅ Test with clear audio input

---

## ⚡ **Current Build Status**
- **Last Build:** ✅ Successful (21.25s) 
- **App Status:** ✅ Running (InvisiAI - AI Assistant)
- **PDF Features:** ✅ Active & AI-Integrated
- **Voice Features:** ✅ Enhanced with pause control
- **API Switching:** ✅ Fixed with auto-recovery
- **File Size:** 1.66MB (production build)

---

## 🎉 **You're All Set!**

**Your InvisiAI app now supports:**
- 📄 **PDF document analysis** - Upload PDFs and ask questions
- 🎤 **Advanced voice control** - Pause/resume with live transcription
- 🖼️ **Image analysis** - Existing image attachment support
- 💬 **Intelligent AI responses** - Using your configured AI provider

**Ready to use!** Start uploading PDFs and asking questions!