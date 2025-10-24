# 🔧 InvisiAI Troubleshooting Guide

## 🚨 **APP WENT BLANK AFTER CHANGING API PROVIDER?**

### **Quick Fix Option 1: Browser Console Reset**
1. **Open the app** (even if it's blank)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Type and press Enter:**
   ```javascript
   resetToGemini()
   ```
5. **Refresh the app** (Ctrl+R or F5)

### **Quick Fix Option 2: Manual LocalStorage Clear**
1. **Press F12** → **Application/Storage tab** → **Local Storage**
2. **Delete these keys:**
   - `selected_ai_provider`
   - `custom_ai_providers` 
3. **Refresh the app**

### **Quick Fix Option 3: Nuclear Reset**
1. **Open Console** (F12)
2. **Type:**
   ```javascript
   clearAppData()
   ```
3. **Refresh app** - You'll need to reconfigure everything

---

## ✅ **PDF SUPPORT ISSUES**

### **"Can't access local files" Error**
**FIXED!** ✅ The app now properly:
- Extracts text from PDFs automatically
- Includes PDF content in AI conversations
- Shows enhanced system prompts for document analysis

### **PDF Upload Not Working**
- ✅ Check file is actually a PDF (not image)
- ✅ Try smaller PDF files (< 5MB)
- ✅ Ensure PDF contains text (not scanned images only)

---

## ⚙️ **API PROVIDER SWITCHING**

### **Safe Provider Switching Steps:**
1. **Go to Settings** ⚙️
2. **Select new provider** (Gemini, Claude, OpenAI, Mistral, etc.)
3. **Enter valid API key**
4. **Select appropriate model**
5. **Save settings** 
6. **Test with a simple message**

### **If App Goes Blank After Switching:**
- **The app now has auto-recovery** - it should fall back to Gemini
- **Use console reset:** `resetToGemini()` (F12 → Console)
- **Check API key format** - some providers need specific formats

### **Provider-Specific Notes:**
- **Gemini**: `gemini-1.5-flash` (most stable)
- **OpenAI**: `gpt-4` or `gpt-3.5-turbo`
- **Claude**: `claude-3-sonnet-20240229`
- **Mistral**: `mistral-large-latest`

---

## 🎤 **Voice & Speech Issues**

### **Voice Not Working:**
- ✅ Check microphone permissions
- ✅ Configure Speech Provider in Settings
- ✅ Test with pause/resume buttons

### **Transcription Problems:**
- ✅ Speak clearly and wait for text to appear
- ✅ Check AssemblyAI or other STT provider API key

---

## 🛠️ **App Startup Issues**

### **App Won't Start:**
```powershell
# Navigate to app directory
Set-Location "c:\Users\VolcanO\Dropbox\PC\Desktop\Plu\pluely-app-v0.1.2"

# Kill existing processes
Get-Process -Name pluely -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean install
Remove-Item -Recurse -Force node_modules
npm install --force

# Start fresh
npm run tauri dev
```

### **Build Errors:**
```powershell
# Clear build cache
npm run build
# If that fails:
Remove-Item -Recurse -Force dist
npm run build
```

---

## 🏥 **Emergency Recovery Commands**

Open **F12 → Console** and use these:

```javascript
// Reset to Gemini (safest provider)
resetToGemini()

// Validate provider settings
validateProviders()  

// Nuclear option - clears ALL data
clearAppData()

// Check what's stored
console.log(localStorage)
```

---

## ✅ **Current App Status**

**✅ WORKING FEATURES:**
- PDF text extraction and Q&A
- Enhanced voice controls with pause/resume
- Stable API provider switching with auto-recovery
- Live transcription display
- File attachments (images + PDFs)

**🔧 AUTO-FIXES IMPLEMENTED:**
- Provider validation on app start
- Automatic fallback to Gemini if provider fails
- Enhanced error handling for API switches
- Global reset functions for troubleshooting

**🚀 APP IS READY TO USE!**

Your InvisiAI app now has robust error handling and should handle API provider switching smoothly. PDF support is fully functional for reading and answering questions from your documents.