/**
 * Detects if the app is running inside an iOS WebView (native app shell).
 * Used to hide Stripe checkout buttons and show Apple-compliant messaging instead.
 */
export function useIsIOSWebView() {
  const ua = window.navigator.userAgent;
  // Base44 iOS WebView sets a custom user agent or exposes a native bridge
  const hasNativeBridge = typeof window.ReactNativeWebView !== 'undefined' ||
    typeof window.webkit?.messageHandlers !== 'undefined' ||
    typeof window.Base44Native !== 'undefined';

  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isWebView = hasNativeBridge || (isIOS && !/Safari/.test(ua));

  return isWebView;
}