/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import React, { lazy, Suspense } from 'react';
import __Layout from './layout.jsx';

// Eager-load Home for instant first paint; lazy-load all others
import Home from './pages/Home';

const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const Analytics       = lazy(() => import('./pages/Analytics'));
const Chat            = lazy(() => import('./pages/Chat'));
const CommunityPresets= lazy(() => import('./pages/CommunityPresets'));
const CorporateWellness=lazy(() => import('./pages/CorporateWellness'));
const Landing         = lazy(() => import('./pages/Landing'));
const PrivacyPolicy   = lazy(() => import('./pages/PrivacyPolicy'));
const Profile         = lazy(() => import('./pages/Profile'));
const Ratings         = lazy(() => import('./pages/Ratings'));
const Settings        = lazy(() => import('./pages/Settings'));
const Subscriptions   = lazy(() => import('./pages/Subscriptions'));

// Suspense fallback — no JSX so this file stays .js
const PageFallback = () => React.createElement(
  'div',
  { className: 'fixed inset-0 flex items-center justify-center bg-slate-950' },
  React.createElement('div', { className: 'w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin' })
);

const withSuspense = (Component) => (props) =>
  React.createElement(Suspense, { fallback: React.createElement(PageFallback) },
    React.createElement(Component, props)
  );

export const PAGES = {
    "AdminDashboard":   withSuspense(AdminDashboard),
    "Analytics":        withSuspense(Analytics),
    "Chat":             withSuspense(Chat),
    "CommunityPresets": withSuspense(CommunityPresets),
    "CorporateWellness":withSuspense(CorporateWellness),
    "Home":             Home,
    "Landing":          withSuspense(Landing),
    "PrivacyPolicy":    withSuspense(PrivacyPolicy),
    "Profile":          withSuspense(Profile),
    "Ratings":          withSuspense(Ratings),
    "Settings":         withSuspense(Settings),
    "Subscriptions":    withSuspense(Subscriptions),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};