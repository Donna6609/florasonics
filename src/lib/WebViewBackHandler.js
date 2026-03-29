/**
 * WebView Detection Utilities
 * Pure functions for detecting WebView environment
 * 100% declarative — no stateful classes
 */

/**
 * Detect if running in Android WebView
 * @returns {boolean}
 */
export function detectWebView() {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /android/i.test(userAgent) &&
    (/webview/i.test(userAgent) || /; wv\)/i.test(userAgent))
  );
}

/**
 * Signal app close to native context if in WebView
 * @param {boolean} isWebView - whether running in WebView
 */
export function signalAppClose(isWebView) {
  if (isWebView && window.Android) {
    window.Android.closeApp?.();
  } else if (isWebView) {
    window.dispatchEvent(new CustomEvent('webviewClose'));
  }
}