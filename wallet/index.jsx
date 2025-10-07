import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import SimpleWallet from "./SimpleWallet";

// Buffer polyfill for browser
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window.global || window;
  global.Buffer = Buffer;
}

// Wait for DOM to be ready
function initWallet() {
  const walletRoot = document.getElementById("privy-wallet-root");
  
  if (!walletRoot) {
    console.error("❌ Wallet root element not found!");
    // Retry after a short delay
    setTimeout(initWallet, 100);
    return;
  }
  
  console.log("✅ Wallet root element found, initializing React...");
  
  try {
    const root = createRoot(walletRoot);
    
    // Try to render the full Privy app first
    try {
      root.render(<App />);
      console.log("✅ React Privy wallet component mounted successfully!");
    } catch (privyError) {
      console.warn("⚠️ Privy component failed, falling back to simple wallet:", privyError);
      // Fallback to simple wallet
      root.render(<SimpleWallet />);
      console.log("✅ Simple wallet component mounted successfully!");
    }
  } catch (error) {
    console.error("❌ Failed to mount React wallet component:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWallet);
} else {
  initWallet();
}
