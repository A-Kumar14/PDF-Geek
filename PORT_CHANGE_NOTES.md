# Port Change & Deprecation Warning Notes

## Port Change: 5000 → 5001

### Issue
macOS uses port 5000 for **AirPlay Receiver** service by default, causing port conflicts when starting the Flask backend.

### Solution
Changed default Flask port from `5000` to `5001`.

### Files Updated
1. **backend/config.py** - Changed `PORT` default from 5000 to 5001
2. **backend/app.py** - Now uses `Config.PORT` instead of hardcoded 5000
3. **frontend/.env.local** - Updated `REACT_APP_API_URL` to `http://localhost:5001`
4. **frontend/.env.example** - Updated documentation to reflect port 5001

### Environment Variable Override
You can still use port 5000 (or any other port) by setting:
```bash
export FLASK_PORT=5000
```

### Alternative Solutions (Not Implemented)
1. **Disable AirPlay Receiver**:
   - System Preferences → General → AirDrop & Handoff
   - Turn off "AirPlay Receiver"

2. **Kill Process on Port 5000**:
   ```bash
   lsof -ti:5000 | xargs kill -9
   ```

---

## Deprecation Warning: google.generativeai → google.genai

### Warning Message
```
All support for the `google.generativeai` package has ended.
Please switch to the `google.genai` package as soon as possible.
```

### Current Situation
- Using `langchain-google-genai>=2.0.0`
- This package internally uses the deprecated `google.generativeai`
- Warning is non-blocking - server still functions correctly

### Future Migration Required
The LangChain team will need to update their package to use `google.genai` instead.

**Action Items:**
1. Monitor LangChain releases for updated version
2. When available, update `langchain-google-genai` to version that uses new package
3. Test that embeddings and chat models still work correctly
4. Update `requirements.txt` accordingly

### Timeline
- **Current**: Warning only, no functionality affected
- **Future**: Package may stop receiving updates and bug fixes
- **Action Required**: Migrate when LangChain releases compatible version

### References
- [Deprecated Package README](https://github.com/google-gemini/deprecated-generative-ai-python/blob/main/README.md)
- [New google.genai Package](https://github.com/googleapis/python-genai)

---

**Date:** February 18, 2026
**Status:** Port change implemented ✅ | Deprecation noted for future action ⚠️
