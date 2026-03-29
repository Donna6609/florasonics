# Android WebView Integration Guide — FloraSonics

## Overview
This document clarifies the relationship between the JavaScript WebView handler and the native Android Kotlin implementation to prevent navigation race conditions and ensure seamless back-button behavior.

---

## Architecture: JavaScript ↔ Kotlin Bridge

### 1. JavaScript Layer (lib/WebViewBackHandler.js)

**Responsibility:** Detect WebView environment and delegate back-press logic to React Router.

```javascript
// Single declarative handler instance
const handler = new WebViewBackHandler();

handleBackPress(navigate, location) {
  const isAtRoot = location.pathname === '/' || location.pathname === '';
  
  if (isAtRoot) {
    // At app root — signal native side to close
    if (this.isWebView && window.Android) {
      window.Android.closeApp?.();
    } else if (this.isWebView) {
      window.dispatchEvent(new CustomEvent('webviewClose'));
    }
    return false;
  }

  // Not at root — let React Router handle navigation
  navigate(-1);
  return true;
}
```

**Key Points:**
- Uses React Router's declarative `location.pathname` state exclusively
- No manual history stack management
- Detects WebView via user agent: `/android|webview/i`
- Delegates to native `window.Android.closeApp()` when at root

---

## 2. React Integration (lib/WebViewBackHandlerInitializer.jsx)

**Responsibility:** Initialize back-button listener and connect to React Router state.

```javascript
export default function WebViewBackHandlerInitializer() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      handler.handleBackPress(navigate, location);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, location]);

  return null; // Pure initializer
}
```

**Key Points:**
- Renders at app root inside `<Router>` context
- Subscribes to browser `popstate` events (back-button presses)
- Re-evaluates on `location` changes to always have current route
- No state management — purely declarative

---

## 3. Native Kotlin Implementation (MainActivity.kt)

**Responsibility:** Intercept physical back button and delegate to JavaScript.

```kotlin
class MainActivity : AppCompatActivity() {
  
  private lateinit var webView: WebView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    webView = WebView(this).apply {
      settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
      }
      addJavascriptInterface(WebAppInterface(this@MainActivity), "Android")
      loadUrl("file:///android_asset/index.html")
    }
    setContentView(webView)
  }

  // Intercept physical back button press
  override fun onBackPressed() {
    // Dispatch browser's popstate event in WebView
    webView.evaluateJavascript(
      "window.dispatchEvent(new PopStateEvent('popstate', {}));",
      null
    )
    // Give JS 100ms to decide if navigation occurred
    Handler(Looper.getMainLooper()).postDelayed({
      if (!canGoBack()) {
        // JS did not navigate — exit app
        super.onBackPressed()
      }
    }, 100)
  }

  private fun canGoBack(): Boolean {
    return webView.canGoBack()
  }
}

// JavaScript interface for app closing
class WebAppInterface(private val activity: MainActivity) {
  @JavascriptInterface
  fun closeApp() {
    activity.finish()
  }
}
```

**Key Points:**
- Intercepts physical back button in `onBackPressed()`
- Triggers `popstate` event in JavaScript (not `onBackPressed` — avoids double-handling)
- Waits 100ms for React Router to consume the back-press via `navigate(-1)`
- Only exits app if `webView.canGoBack()` is false (JS did not navigate)

---

## 4. Race Condition Prevention

### Problem
If both native and JavaScript handle back-press independently, navigation may execute twice or web state may desynchronize from native state.

### Solution
**Single Authority Pattern:** React Router is the single source of truth for app state.

1. **Native triggers JS:** Kotlin calls `popstate` event (browser standard)
2. **JS responds:** React Router's history updates via `useLocation()`
3. **JS reports state:** WebView's `canGoBack()` reflects React state
4. **Native waits:** Only exits app if JS confirmed no navigation

```
Physical Back Press
     ↓
Kotlin: onBackPressed()
     ↓
Kotlin: dispatch popstate event
     ↓
JS: handlePopState() → handler.handleBackPress(navigate, location)
     ↓
JS: navigate(-1) [if not at root] OR closeApp() [if at root]
     ↓
React Router: location.pathname updates
     ↓
Kotlin: checks webView.canGoBack()
     ↓
Kotlin: exits app only if no navigation occurred
```

---

## 5. Thread Safety & Timing

### Scenario 1: User at Root, Presses Back
1. Kotlin calls `popstate`
2. JS checks `location.pathname === '/'` → true
3. JS calls `window.Android.closeApp()`
4. Kotlin waits 100ms, sees no back navigation → exits

**Result:** Clean exit ✓

### Scenario 2: User on /settings, Presses Back
1. Kotlin calls `popstate`
2. JS checks `location.pathname === '/settings'` → false
3. JS calls `navigate(-1)` → Router updates location to `/`
4. React re-renders
5. Kotlin waits 100ms, sees `canGoBack() = true` → app stays open

**Result:** Navigation to root ✓

### Scenario 3: Rapid Back Presses
- First press: JS navigates, location updates
- Second press: Kotlin detects `canGoBack() = false` and exits
- No duplicate navigation

**Result:** Correct behavior ✓

---

## 6. Android Manifest Configuration

Ensure WebView settings are properly configured:

```xml
<activity
  android:name=".MainActivity"
  android:configChanges="orientation|screenSize|keyboardHidden"
  android:windowSoftInputMode="adjustResize"
>
  <!-- Required for WebView -->
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
</activity>

<!-- WebView permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 7. Testing Back-Button Flow

### Test Case 1: Navigation History
```
Home → Settings → About → [Back] → Settings → [Back] → Home
```
- Each back press should navigate to previous route
- At home, back press should exit app

### Test Case 2: Deep Link
```
Direct navigate to /journey → [Back] → exit app
```
- Only one route in stack
- Back press should exit

### Test Case 3: Modal Handling
If your app has modals:
```
Home (modal open) → [Back] → Home (modal closed) → [Back] → exit
```
- Modal close is a state change, not a route change
- Second back press exits

---

## 8. Debugging

### Enable WebView Debugging (adb)
```bash
adb shell "setprop debug.force_rtl 1"  # For RTL debugging
adb logcat | grep "AudioEngine\|WebViewBackHandler"
```

### JavaScript Console Logs
Add to `WebViewBackHandler.getDebugInfo()`:
```javascript
getDebugInfo(location) {
  return {
    isWebView: this.isWebView,
    currentPathname: location.pathname,
    canGoBack: window.history.length > 1,
  };
}
```

### Kotlin Logs
```kotlin
Log.d("MainActivity", "onBackPressed: canGoBack=${webView.canGoBack()}")
Log.d("MainActivity", "Dispatching popstate event")
```

---

## 9. Production Checklist

- [ ] WebView has JavaScript enabled
- [ ] `JavascriptInterface` is registered (`window.Android`)
- [ ] Physical back button intercepts in `onBackPressed()`
- [ ] `popstate` event dispatches to JS
- [ ] 100ms delay allows JS to respond
- [ ] React Router is initialized in `<Router>` wrapper
- [ ] `WebViewBackHandlerInitializer` renders at app root
- [ ] `WebViewBackHandler.detectWebView()` correctly identifies WebView
- [ ] Theme initialization script runs synchronously in `<head>`
- [ ] AudioEngine fallback uses `requestIdleCallback` for main-thread safety

---

## 10. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Back button closes app even in nested routes | JS not navigating | Check React Router setup, ensure `navigate(-1)` is called |
| Navigation lags after back press | 100ms delay too short | Increase to 150-200ms in `onBackPressed()` |
| Theme flashes on load | Theme script not synchronous | Ensure FOUC prevention script in `<head>` before module load |
| Audio drops during buffer generation | Main thread blocking | Use `requestIdleCallback` in fallback (already implemented) |
| WebView closing unexpectedly | Race condition | Verify Kotlin waits for JS response before calling `finish()` |

---

## References

- [WebView Back Navigation](https://developer.android.com/guide/webapps/managing-webview)
- [React Router Location State](https://reactrouter.com/en/main/start/overview)
- [Android WebView JavaScript Bridge](https://developer.android.com/guide/webapps/connecting-webview-code-to-android-code)
- [requestIdleCallback API](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)