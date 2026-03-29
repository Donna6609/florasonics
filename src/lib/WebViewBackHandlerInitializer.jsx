/**
 * WebViewBackHandlerInitializer with Retry Mechanism
 * Robust back-button handling with delayed Android bridge detection
 * Graceful fallback if window.Android is not available on first mount
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { detectWebView, signalAppClose } from './WebViewBackHandler';

export default function WebViewBackHandlerInitializer() {
  const navigate = useNavigate();
  const location = useLocation();
  const debounceTimerRef = useRef(null);
  const lastNavigationRef = useRef(0);
  const isWebViewRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetriesRef = useRef(3);
  const retryDelayRef = useRef(250); // ms between retry attempts

  /**
   * Attempt to detect WebView with retry mechanism
   * Window.Android may not be available immediately on app startup
   * This handles the case where Android bridge initializes after React
   */
  const detectWebViewWithRetry = () => {
    if (isWebViewRef.current !== null) {
      return isWebViewRef.current; // Already detected
    }

    const detected = detectWebView();
    
    if (!detected && window.Android && retryCountRef.current < maxRetriesRef.current) {
      // Window.Android exists but detectWebView returned false
      // Likely a timing issue — schedule retry
      if (!retryTimerRef.current) {
        retryTimerRef.current = setTimeout(() => {
          retryCountRef.current++;
          retryTimerRef.current = null;
          detectWebViewWithRetry(); // Recursive retry
        }, retryDelayRef.current);
      }
      return false; // Assume not WebView yet
    }

    isWebViewRef.current = detected;
    return detected;
  };

  /**
   * Respond to physical back-button events (Android/iOS)
   * Debounced to prevent rapid-fire navigation that can break router state
   * React Router maintains the history stack — we only intervene at root
   */
  useEffect(() => {
    const handlePopState = () => {
      const now = Date.now();
      
      // Debounce: ignore events within 150ms of last navigation
      if (now - lastNavigationRef.current < 150) {
        return;
      }

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the actual navigation to prevent race conditions
      debounceTimerRef.current = setTimeout(() => {
        // Check current location (always fresh from React Router)
        const isAtRoot = location.pathname === '/' || location.pathname === '';
        
        lastNavigationRef.current = Date.now();

        if (isAtRoot) {
          // At root: signal native context to close app
          // Use retry-aware detection for delayed Android bridge initialization
          const isWebView = detectWebViewWithRetry();
          signalAppClose(isWebView);
        } else {
          // Not at root: let React Router handle backward navigation
          // navigate(-1) is automatic when popstate fires — just document intent
        }
      }, 100); // 100ms debounce window for router state stability
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [location]);

  return null; // Initializer only, no UI rendered
}