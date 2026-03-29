# Android WebView JavaScript Interface Implementation Guide

## Overview

This document provides complete implementation details for the native Android development team to integrate FloraSonics' JavaScript interface bridge with the Android WebView.

---

## 1. Architecture Diagram

```
┌──────────────────────────────┐
│   JavaScript (React App)     │
│   window.Android.*           │
└────────────┬─────────────────┘
             │
     ┌───────▼────────┐
     │  WebView Bridge│
     │  (JS Interface)│
     └───────┬────────┘
             │
┌────────────▼──────────────┐
│  Android Native Activity  │
│  (Kotlin/Java)            │
│  Custom JS Interface Class│
└─────────────────────────────┘
```

---

## 2. JavaScript Interface Requirements

### 2.1 What FloraSonics Expects from Android

The app expects the following methods available on `window.Android`:

#### Core Methods

| Method | Signature | Purpose | Android 5.0+ |
|--------|-----------|---------|-------------|
| `closeApp()` | `void` | Close WebView app | ✅ |
| `getDeviceInfo()` | `string (JSON)` | Get device specs | ✅ |
| `requestPermission(permission: string)` | `void` | Request OS permission | ✅ |
| `shareTo(text: string, title?: string)` | `void` | Native share sheet | ✅ |
| `openUrl(url: string)` | `void` | Open external URL | ✅ |
| `logEvent(eventName: string, data?: JSON)` | `void` | Analytics logging | ✅ |
| `vibrate(duration: number)` | `void` | Device vibration | ✅ |
| `requestNotificationPermission()` | `void` | Notification access | ✅ |
| `scheduleNotification(title, body, delay)` | `void` | Schedule notification | ✅ |
| `playSystemSound(soundType: string)` | `void` | System beep/vibrate | ✅ |
| `setScreenBrightness(brightness: 0-1)` | `void` | Control brightness | ✅ |
| `getNetworkStatus()` | `string (JSON)` | Online/offline info | ✅ |
| `getStorageInfo()` | `string (JSON)` | Free disk space | ✅ |
| `downloadFile(url: string, filename: string)` | `void` | Download to device | ✅ |

---

## 3. Implementation Guide

### 3.1 Create Custom JavaScript Interface Class

**File:** `src/main/java/com/yourcompany/florasonics/FloraSonicsJSInterface.kt`

```kotlin
package com.yourcompany.florasonics

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import android.provider.Settings
import android.net.ConnectivityManager
import android.os.Environment
import java.io.File

/**
 * JavaScript Interface Bridge for FloraSonics
 * 
 * Usage in WebView:
 *   webView.addJavascriptInterface(FloraSonicsJSInterface(activity), "Android")
 * 
 * In JavaScript:
 *   window.Android.closeApp()
 *   window.Android.getDeviceInfo()
 *   etc.
 */
class FloraSonicsJSInterface(
    private val activity: Activity,
    private val context: Context = activity.applicationContext
) {

    // ============================================================
    // APP LIFECYCLE METHODS
    // ============================================================

    /**
     * Close the WebView app gracefully
     * Called when user presses back at root with no history
     */
    @JavascriptInterface
    fun closeApp() {
        activity.runOnUiThread {
            activity.finish()
        }
    }

    /**
     * Minimize app (send to background)
     */
    @JavascriptInterface
    fun minimizeApp() {
        activity.runOnUiThread {
            val intent = Intent(Intent.ACTION_MAIN)
            intent.addCategory(Intent.CATEGORY_HOME)
            activity.startActivity(intent)
        }
    }

    // ============================================================
    // DEVICE INFORMATION METHODS
    // ============================================================

    /**
     * Get device information as JSON string
     * Returns: { osVersion, manufacturer, model, screenDensity, appVersion }
     */
    @JavascriptInterface
    fun getDeviceInfo(): String {
        return try {
            val deviceInfo = JSONObject()
            deviceInfo.put("osVersion", Build.VERSION.SDK_INT)
            deviceInfo.put("manufacturer", Build.MANUFACTURER)
            deviceInfo.put("model", Build.MODEL)
            deviceInfo.put("device", Build.DEVICE)
            deviceInfo.put("screenDensity", context.resources.displayMetrics.density)
            deviceInfo.put("screenWidth", context.resources.displayMetrics.widthPixels)
            deviceInfo.put("screenHeight", context.resources.displayMetrics.heightPixels)
            deviceInfo.put("appVersion", context.packageManager
                .getPackageInfo(context.packageName, 0).versionName)
            deviceInfo.toString()
        } catch (e: Exception) {
            JSONObject().apply { put("error", e.message) }.toString()
        }
    }

    /**
     * Get network status as JSON string
     * Returns: { isConnected, type, isMetered }
     */
    @JavascriptInterface
    fun getNetworkStatus(): String {
        return try {
            val connectivityManager = context.getSystemService(
                Context.CONNECTIVITY_SERVICE
            ) as ConnectivityManager

            val isConnected = connectivityManager.activeNetwork != null
            val networkInfo = connectivityManager.activeNetwork
            val isMetered = connectivityManager.isActiveNetworkMetered

            val status = JSONObject()
            status.put("isConnected", isConnected)
            status.put("isMetered", isMetered)
            status.put("type", if (isConnected) "connected" else "disconnected")
            status.toString()
        } catch (e: Exception) {
            JSONObject().apply { put("error", e.message) }.toString()
        }
    }

    /**
     * Get storage information as JSON string
     * Returns: { freeSpace, totalSpace, storageState }
     */
    @JavascriptInterface
    fun getStorageInfo(): String {
        return try {
            val external = Environment.getExternalStorageDirectory()
            val stat = android.os.StatFs(external.path)
            val freeSpace = stat.availableBlocksLong * stat.blockSizeLong / (1024 * 1024) // MB
            val totalSpace = stat.blockCountLong * stat.blockSizeLong / (1024 * 1024) // MB

            val storageInfo = JSONObject()
            storageInfo.put("freeSpace", freeSpace)
            storageInfo.put("totalSpace", totalSpace)
            storageInfo.put("freeSpaceGB", freeSpace / 1024.0)
            storageInfo.put("usedPercentage", ((totalSpace - freeSpace) * 100 / totalSpace))
            storageInfo.toString()
        } catch (e: Exception) {
            JSONObject().apply { put("error", e.message) }.toString()
        }
    }

    // ============================================================
    // HAPTIC & AUDIO FEEDBACK METHODS
    // ============================================================

    /**
     * Vibrate device
     * @param duration Duration in milliseconds
     */
    @JavascriptInterface
    fun vibrate(duration: Long = 100) {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(
                VibrationEffect.createOneShot(
                    duration,
                    VibrationEffect.DEFAULT_AMPLITUDE
                )
            )
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    /**
     * Play system sound
     * @param soundType: "beep" | "click" | "success" | "error"
     */
    @JavascriptInterface
    fun playSystemSound(soundType: String = "beep") {
        try {
            val toneGenerator = android.media.ToneGenerator(
                android.media.AudioManager.STREAM_NOTIFICATION,
                android.media.ToneGenerator.MAX_VOLUME
            )

            when (soundType) {
                "beep" -> toneGenerator.startTone(android.media.ToneGenerator.TONE_CDMA_DIAL_TONE_LITE, 100)
                "click" -> toneGenerator.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 50)
                "success" -> {
                    toneGenerator.startTone(android.media.ToneGenerator.TONE_CDMA_CONFIRM, 200)
                }
                "error" -> {
                    toneGenerator.startTone(android.media.ToneGenerator.TONE_CDMA_NETWORK_BUSY, 200)
                }
            }
        } catch (e: Exception) {
            logDebug("playSystemSound failed: ${e.message}")
        }
    }

    // ============================================================
    // PERMISSIONS & NOTIFICATIONS
    // ============================================================

    /**
     * Request Android permission
     * @param permission e.g. "android.permission.POST_NOTIFICATIONS"
     */
    @JavascriptInterface
    fun requestPermission(permission: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val requiredPermissions = arrayOf(permission)
            activity.requestPermissions(requiredPermissions, 0)
        }
    }

    /**
     * Request notification permission (Android 13+)
     */
    @JavascriptInterface
    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermission("android.permission.POST_NOTIFICATIONS")
        }
    }

    /**
     * Schedule a notification
     * @param title Notification title
     * @param body Notification message
     * @param delayMs Delay in milliseconds (0 = immediate)
     */
    @JavascriptInterface
    fun scheduleNotification(title: String, body: String, delayMs: Long = 0) {
        val channelId = "florasonics_wellness"
        val notificationId = System.currentTimeMillis().toInt()

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Replace with your icon
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .build()

        val notificationManager = NotificationManagerCompat.from(context)

        if (delayMs > 0) {
            // Schedule for later (requires WorkManager)
            scheduleNotificationDelayed(notification, notificationId, delayMs)
        } else {
            // Show immediately
            notificationManager.notify(notificationId, notification)
        }
    }

    private fun scheduleNotificationDelayed(
        notification: android.app.Notification,
        id: Int,
        delayMs: Long
    ) {
        // TODO: Implement with WorkManager or AlarmManager
        // For now, log that this requires WorkManager setup
        logDebug("Delayed notification scheduled (requires WorkManager): $delayMs ms")
    }

    // ============================================================
    // UI CONTROL METHODS
    // ============================================================

    /**
     * Set screen brightness (0.0 - 1.0)
     * @param brightness Float 0.0 (min) to 1.0 (max)
     */
    @JavascriptInterface
    fun setScreenBrightness(brightness: Float) {
        activity.runOnUiThread {
            val layoutParams = activity.window.attributes
            layoutParams.screenBrightness = brightness.coerceIn(0.1f, 1.0f)
            activity.window.attributes = layoutParams
        }
    }

    /**
     * Get current screen brightness
     * Returns: 0.0 (min) to 1.0 (max), or -1 if automatic
     */
    @JavascriptInterface
    fun getScreenBrightness(): Float {
        return try {
            Settings.System.getInt(
                context.contentResolver,
                Settings.System.SCREEN_BRIGHTNESS,
                -1
            ).toFloat() / 255.0f
        } catch (e: Exception) {
            -1.0f // Automatic brightness
        }
    }

    // ============================================================
    // SHARING & EXTERNAL COMMUNICATION
    // ============================================================

    /**
     * Show native share sheet
     * @param text Text to share
     * @param title Optional title (for chooser)
     */
    @JavascriptInterface
    fun shareTo(text: String, title: String = "Share") {
        activity.runOnUiThread {
            val intent = Intent(Intent.ACTION_SEND)
            intent.type = "text/plain"
            intent.putExtra(Intent.EXTRA_TEXT, text)
            activity.startActivity(Intent.createChooser(intent, title))
        }
    }

    /**
     * Open external URL in default browser
     * @param url URL to open
     */
    @JavascriptInterface
    fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url))
            activity.startActivity(intent)
        } catch (e: Exception) {
            logDebug("Failed to open URL: $url - ${e.message}")
        }
    }

    /**
     * Download file (saves to Downloads folder)
     * @param url File URL
     * @param filename Desired filename
     */
    @JavascriptInterface
    fun downloadFile(url: String, filename: String) {
        try {
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) 
                as android.app.DownloadManager
            
            val uri = android.net.Uri.parse(url)
            val request = android.app.DownloadManager.Request(uri)
            request.setTitle(filename)
            request.setDescription("Downloading...")
            request.setNotificationVisibility(
                android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            )
            request.setDestinationInExternalPublicDir(
                Environment.DIRECTORY_DOWNLOADS,
                filename
            )
            
            downloadManager.enqueue(request)
        } catch (e: Exception) {
            logDebug("Download failed: ${e.message}")
        }
    }

    // ============================================================
    // ANALYTICS & LOGGING
    // ============================================================

    /**
     * Log event for analytics
     * @param eventName Event name (e.g., "meditation_started")
     * @param data Optional JSON data
     */
    @JavascriptInterface
    fun logEvent(eventName: String, data: String = "{}") {
        try {
            val eventData = JSONObject(data)
            logDebug("Event: $eventName - $eventData")
            
            // TODO: Send to Firebase Analytics, Mixpanel, etc.
            // FirebaseAnalytics.getInstance(context)
            //     .logEvent(eventName, Bundle().apply { /* populate */ })
        } catch (e: Exception) {
            logDebug("logEvent error: ${e.message}")
        }
    }

    /**
     * Show toast message (temporary notification)
     * @param message Message text
     * @param duration "short" or "long"
     */
    @JavascriptInterface
    fun showToast(message: String, duration: String = "short") {
        activity.runOnUiThread {
            val toastDuration = if (duration == "long") Toast.LENGTH_LONG else Toast.LENGTH_SHORT
            Toast.makeText(context, message, toastDuration).show()
        }
    }

    // ============================================================
    // DEBUGGING HELPERS
    // ============================================================

    private fun logDebug(message: String) {
        android.util.Log.d("FloraSonicsJS", message)
    }

    /**
     * Get all available methods
     */
    @JavascriptInterface
    fun getAvailableMethods(): String {
        val methods = listOf(
            "closeApp()",
            "minimizeApp()",
            "getDeviceInfo() -> JSON",
            "getNetworkStatus() -> JSON",
            "getStorageInfo() -> JSON",
            "vibrate(duration?)",
            "playSystemSound(type?)",
            "requestPermission(permission)",
            "requestNotificationPermission()",
            "scheduleNotification(title, body, delayMs?)",
            "setScreenBrightness(brightness: 0-1)",
            "getScreenBrightness() -> Float",
            "shareTo(text, title?)",
            "openUrl(url)",
            "downloadFile(url, filename)",
            "logEvent(eventName, data?)",
            "showToast(message, duration?)"
        )
        return JSONObject().apply {
            put("methods", methods)
        }.toString()
    }
}
```

---

### 3.2 Register Interface in WebView Activity

**File:** `src/main/java/com/yourcompany/florasonics/MainActivity.kt`

```kotlin
package com.yourcompany.florasonics

import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.web_view)

        // ========================================================
        // CRITICAL: Configure WebView Settings
        // ========================================================
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            
            // Enable localStorage & sessionStorage
            setAppCacheEnabled(true)
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            
            // Optimize for performance
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        // ========================================================
        // REGISTER JAVASCRIPT INTERFACE
        // ========================================================
        val jsInterface = FloraSonicsJSInterface(this)
        webView.addJavascriptInterface(jsInterface, "Android")

        // ========================================================
        // SET CLIENT HANDLERS
        // ========================================================
        webView.webChromeClient = CustomWebChromeClient()
        webView.webViewClient = CustomWebViewClient()

        // ========================================================
        // LOAD APP
        // ========================================================
        webView.loadUrl("https://your-florasonics-domain.com")
        // OR for local testing:
        // webView.loadUrl("file:///android_asset/index.html")
    }

    /**
     * Handle back button
     * WebViewBackHandler in React handles routing, but Android back button
     * should trigger popstate event in the WebView
     */
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    /**
     * Custom WebChromeClient for alerts, permissions, etc.
     */
    private inner class CustomWebChromeClient : WebChromeClient() {
        override fun onPermissionRequest(request: android.webkit.PermissionRequest?) {
            // Handle camera, microphone, geolocation requests
            request?.grant(request.resources)
        }
    }

    /**
     * Custom WebViewClient for page loading, SSL errors
     */
    private inner class CustomWebViewClient : WebViewClient() {
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
            super.onPageStarted(view, url, favicon)
            // Show loading indicator
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Hide loading indicator
        }

        override fun onReceivedError(
            view: WebView?,
            request: android.webkit.WebResourceRequest?,
            error: android.webkit.WebResourceError?
        ) {
            super.onReceivedError(view, request, error)
            // Handle errors gracefully
        }
    }
}
```

---

### 3.3 Update Android Manifest

**File:** `AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourcompany.florasonics">

    <!-- ========== REQUIRED PERMISSIONS ========== -->
    <!-- Internet access -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Audio playback -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Notifications (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Vibration feedback -->
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <!-- Downloads -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    
    <!-- Optional: Fine location (for location-based soundscapes) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- ========== APPLICATION ========== -->
    <application
        android:allowBackup="false"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@drawable/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.FloraSonics"
        android:debuggable="false">

        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

---

## 4. Testing the Integration

### 4.1 Test JavaScript Calls from Browser Console

```javascript
// In browser, verify interface is available
console.log(window.Android); // Should log the interface

// Test methods
window.Android.getDeviceInfo(); // Should return JSON string
window.Android.vibrate(100);
window.Android.showToast("Hello from JS!");
window.Android.getNetworkStatus();
```

### 4.2 Test from React App

```javascript
// In src/components/TestWebView.jsx
function TestWebView() {
  const testAndroidInterface = () => {
    if (window.Android) {
      const info = window.Android.getDeviceInfo();
      console.log('Device Info:', JSON.parse(info));
      
      window.Android.vibrate(200);
      window.Android.showToast("Testing WebView Interface!");
    } else {
      console.warn("Android interface not available");
    }
  };

  return (
    <button onClick={testAndroidInterface}>
      Test Android Interface
    </button>
  );
}
```

---

## 5. Error Handling & Debugging

### 5.1 Detect WebView Environment

```javascript
// In JavaScript, detect if running in WebView
const isAndroidWebView = () => {
  return typeof window.Android !== 'undefined' &&
         window.Android !== null;
};

// Use it:
if (isAndroidWebView()) {
  window.Android.vibrate(100);
} else {
  console.log("Running in browser, vibration unavailable");
}
```

### 5.2 Enable Debug Mode

```kotlin
// In MainActivity.onCreate()
webView.apply {
  // Enable debug logging
  WebView.setWebContentsDebuggingEnabled(true)
  
  // Enable JavaScript error reporting
  settings.javaScriptCanOpenWindowsAutomatically = true
}
```

---

## 6. Best Practices

### 6.1 Async/Await Pattern
```javascript
// Methods return synchronously, but wrap in async for consistency
async function getDeviceInfo() {
  const info = window.Android?.getDeviceInfo();
  return info ? JSON.parse(info) : null;
}

// Usage
const device = await getDeviceInfo();
```

### 6.2 Feature Detection
```javascript
// Always check before calling
if (window.Android?.getDeviceInfo) {
  const info = JSON.parse(window.Android.getDeviceInfo());
}
```

### 6.3 Security Considerations
- ✅ Only use @JavascriptInterface on intentional methods
- ✅ Validate all input from JavaScript
- ✅ Never expose sensitive APIs (e.g., file system access)
- ✅ Set `android:debuggable="false"` in production

---

## 7. Integration Checklist

- [ ] Create `FloraSonicsJSInterface.kt` with all methods
- [ ] Update `MainActivity.kt` to register interface
- [ ] Add required permissions to `AndroidManifest.xml`
- [ ] Test back button handling (WebViewBackHandler)
- [ ] Test vibrate/haptics
- [ ] Test notifications
- [ ] Test download functionality
- [ ] Test network status detection
- [ ] Test brightness control
- [ ] Enable debug mode during development
- [ ] Set `debuggable=false` for production release
- [ ] Test on actual Android devices (5.0+)

---

**Documentation Version:** 1.0  
**Last Updated:** 2026-03-26  
**Target Android:** 5.0+ (API 21+)