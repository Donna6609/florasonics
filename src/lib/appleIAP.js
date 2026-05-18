/**
 * Apple In-App Purchase Service
 *
 * Uses @capawesome-team/capacitor-in-app-purchases for native StoreKit.
 *
 * Product IDs in App Store Connect (must match exactly):
 *   com.florasonics.wellness.basic.monthly    ($4.99/mo)
 *   com.florasonics.wellness.premium.monthly  ($9.99/mo)
 *   com.florasonics.wellness.basic.annual     ($49.99/yr)
 *   com.florasonics.wellness.premium.annual   ($99.99/yr)
 */

import { base44 } from '@/api/base44Client';

export const IAP_PRODUCTS = {
  basic:           'com.florasonics.wellness.basic.monthly',
  premium:         'com.florasonics.wellness.premium.monthly',
  basic_annual:    'com.florasonics.wellness.basic.annual',
  premium_annual:  'com.florasonics.wellness.premium.annual',
};

export function isIAPAvailable() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.Capacitor !== 'undefined' &&
      window.Capacitor?.isNativePlatform?.() === true &&
      window.Capacitor?.getPlatform?.() === 'ios'
    );
  } catch {
    return false;
  }
}

async function getPlugin() {
  if (!isIAPAvailable()) {
    throw new Error('IAP is only available in the native iOS app');
  }
  const pkg = '@capawesome-team/capacitor-in-app-purchases';
  const mod = await import(/* @vite-ignore */ pkg);
  const plugin = mod.InAppPurchases || mod.default?.InAppPurchases;
  if (!plugin) throw new Error('InAppPurchases plugin not found. Run: npm install @capawesome-team/capacitor-in-app-purchases && npx cap sync ios');
  return plugin;
}

export async function loadIAPProducts() {
  const plugin = await getPlugin();
  const productIds = Object.values(IAP_PRODUCTS);
  const { products } = await plugin.getProducts({ productIds });
  return products || [];
}

export async function purchaseSubscription(tier) {
  const productId = IAP_PRODUCTS[tier];
  if (!productId) throw new Error(`Unknown tier: ${tier}`);

  const plugin = await getPlugin();

  const result = await plugin.purchaseProduct({ productId });

  if (!result?.transaction) {
    throw new Error('Purchase cancelled or failed');
  }

  const receiptBase64 = result.transaction.appStoreReceiptURL
    ? await fetchReceiptBase64()
    : result.transaction.receipt;

  if (!receiptBase64) throw new Error('Could not retrieve purchase receipt');

  const response = await base44.functions.invoke('verifyAppleIAP', {
    receiptData: receiptBase64,
    productId,
  });

  if (response.data?.error) throw new Error(response.data.error);

  await plugin.finishTransaction({ transactionId: result.transaction.transactionId });

  return response.data;
}

async function fetchReceiptBase64() {
  const plugin = await getPlugin();
  const { receipt } = await plugin.getTransactions();
  return receipt || null;
}

export async function restorePurchases() {
  const plugin = await getPlugin();

  const { transactions } = await plugin.restoreTransactions();

  if (!transactions?.length) {
    return { tier: 'free', message: 'No purchases to restore' };
  }

  const latest = transactions[transactions.length - 1];
  const receiptBase64 = latest.receipt;

  if (!receiptBase64) return { tier: 'free', message: 'No receipt available' };

  const response = await base44.functions.invoke('restoreAppleIAP', {
    receiptData: receiptBase64,
  });

  if (response.data?.error) throw new Error(response.data.error);

  return response.data;
}