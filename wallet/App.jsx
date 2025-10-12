import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { defineChain, createWalletClient, custom } from 'viem';

// Suppress CORS warnings from Privy (development only)
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('origins don\'t match') && message.includes('auth.privy.io')) {
      return; // Suppress CORS warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Define Monad Testnet as custom chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.drpc.org'],
    },
    public: {
      http: ['https://monad-testnet.drpc.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

function WalletUI() {
  console.log("🚀 WalletUI COMPONENT RENDERING...");
  
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  
  // Global error handler for debugging
  useEffect(() => {
    const handleError = (event) => {
      console.error("🚨 Global error caught in WalletUI:", event.error);
      console.error("🚨 Error details:", {
        message: event.error?.message,
        stack: event.error?.stack,
        name: event.error?.name,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  const [balance, setBalance] = useState(0);
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [profit, setProfit] = useState(0);
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // SIMPLE MOUNT TEST - Bu her zaman çalışmalı
  useEffect(() => {
    console.log("🎯 WalletUI MOUNTED - useEffect çalışıyor!");
  }, []); // Boş dependency array

  // Login modal control
  useEffect(() => {
    if (ready && !authenticated) {
      console.log("🔐 User not authenticated, showing login modal");
      setShowLoginModal(true);
      console.log("🔍 Login modal state:", showLoginModal);
    } else if (authenticated) {
      console.log("✅ User authenticated, hiding login modal");
      setShowLoginModal(false);
    }
  }, [ready, authenticated]);
  
  // EXPOSE PRIVY WALLET TO VANILLA JAVASCRIPT
  useEffect(() => {
    console.log("🚨 FIRST useEffect RUNNING - This should always appear!");
    console.log("🔍 EXPOSE EFFECT TRIGGERED - Checking conditions:");
    console.log("🔍 authenticated:", authenticated);
    console.log("🔍 ready:", ready);
    console.log("🔍 wallets.length:", wallets.length);
    console.log("🔍 wallets:", wallets);
    
    if (authenticated && ready && wallets.length > 0) {
      const privyEmbeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      console.log("🔍 privyEmbeddedWallet found:", !!privyEmbeddedWallet);
      console.log("🔍 privyEmbeddedWallet details:", privyEmbeddedWallet);
      
      if (privyEmbeddedWallet) {
        console.log("🔍 EXPOSING Privy wallet to vanilla JavaScript...");
        
        // Expose Privy wallet functionality to global scope
        window.privyWallet = {
          authenticated,
          ready,
          user,
          wallets,
          sessionReady,
          embeddedWallet: privyEmbeddedWallet,
          getEthereumProvider: async () => {
            try {
              console.log("🔍 Getting Ethereum provider from embedded wallet...");
              const provider = await privyEmbeddedWallet.getEthereumProvider();
              console.log("✅ Got Ethereum provider:", provider);
              return provider;
            } catch (error) {
              console.log("❌ Failed to get Ethereum provider:", error);
              throw error;
            }
          },
          signTransaction: async (txParams) => {
            try {
              console.log("🔍 SIMPLE MODE: Direct provider transaction (no viem)...");
              
              // Get Privy wallet and provider
              const privyWallet = wallets.find(w => w.walletClientType === 'privy');
              if (!privyWallet) {
                throw new Error("Privy wallet not found in wallets array");
              }
              
              const provider = await privyWallet.getEthereumProvider();
              console.log("✅ Got Privy provider");
              
              // SIMPLE MODE: Direct eth_sendTransaction call with ALL parameters
              console.log("🔍 Using direct eth_sendTransaction (SIMPLE MODE)...");
              const fullTxParams = {
                to: txParams.to,
                data: txParams.data,
                value: txParams.value,
                gas: txParams.gas,
                maxFeePerGas: txParams.maxFeePerGas,
                maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
                nonce: txParams.nonce
              };
              
              console.log("🔍 Transaction parameters:", fullTxParams);
              
              const hash = await provider.request({ 
                method: 'eth_sendTransaction', 
                params: [fullTxParams] 
              });
              
              console.log("✅ SIMPLE MODE transaction sent:", hash);
              return { txHash: hash };
              
            } catch (error) {
              console.log("❌ SIMPLE MODE transaction failed:", error);
              
              // Fallback to minimal parameters
              try {
                console.log("🔍 Fallback: minimal parameters...");
                const privyWallet = wallets.find(w => w.walletClientType === 'privy');
                const provider = await privyWallet.getEthereumProvider();
                
                const minimal = {
                  to: txParams.to,
                  data: txParams.data,
                  value: txParams.value
                };
                
                const hash = await provider.request({ 
                  method: 'eth_sendTransaction', 
                  params: [minimal] 
                });
                
                console.log("✅ Minimal fallback transaction sent:", hash);
                return { txHash: hash };
              } catch (fallbackError) {
                console.log("❌ All transaction methods failed:", fallbackError);
                throw fallbackError;
              }
            }
          }
        };
        
        console.log("✅ window.privyWallet exposed with methods:", Object.keys(window.privyWallet));
        console.log("✅ window.privyWallet full object:", window.privyWallet);
        // Also expose a strict-only provider reference for the game (no top-level await)
        privyEmbeddedWallet.getEthereumProvider().then((provider) => {
          window.realPrivyProvider = provider;
        }).catch((e) => console.log('⚠️ Failed to expose realPrivyProvider:', e));
      } else {
        console.log("❌ No embedded wallet found in wallets");
      }
    } else {
      console.log("❌ Conditions not met for exposing wallet:");
      console.log("❌ authenticated:", authenticated);
      console.log("❌ ready:", ready);
      console.log("❌ wallets.length:", wallets.length);
      
      // Clear the exposed wallet if not authenticated
      if (window.privyWallet) {
        console.log("🧹 Clearing window.privyWallet - not authenticated");
        delete window.privyWallet;
      }
    }
  }, [authenticated, ready, wallets.length, user?.wallet?.address]);

  // FORCE TRIGGER: Additional useEffect to ensure window.privyWallet is exposed
  useEffect(() => {
    console.log("🚨 FORCE TRIGGER EFFECT - Ensuring window.privyWallet exposure...");
    console.log("🚨 authenticated:", authenticated);
    console.log("🚨 ready:", ready);
    console.log("🚨 wallets.length:", wallets.length);
    console.log("🚨 window.privyWallet exists:", !!window.privyWallet);
    
    if (authenticated && ready && wallets.length > 0 && !window.privyWallet) {
      console.log("🚨 FORCE TRIGGER: Exposing window.privyWallet...");
      const privyEmbeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      if (privyEmbeddedWallet) {
        window.privyWallet = {
          authenticated,
          ready,
          user,
          wallets,
          sessionReady,
          embeddedWallet: privyEmbeddedWallet,
          getEthereumProvider: async () => {
            try {
              console.log("🔍 Getting Ethereum provider from embedded wallet...");
              const provider = await privyEmbeddedWallet.getEthereumProvider();
              console.log("✅ Got Ethereum provider:", provider);
              return provider;
            } catch (error) {
              console.log("❌ Failed to get Ethereum provider:", error);
              throw error;
            }
          },
          signTransaction: async (txParams) => {
            try {
              console.log("🔍 Signing transaction with embedded wallet...");
              const provider = await privyEmbeddedWallet.getEthereumProvider();
              
              // Create wallet client for signing
              const createWalletClient = window.viemCreateWalletClient;
              const custom = window.viemCustomTransport;
              if (!createWalletClient || !custom) throw new Error('viem globals missing');
              const walletClient = createWalletClient({
                chain: monadTestnet,
                transport: custom(provider)
              });
              
              console.log("🔍 Wallet client created, signing transaction...");
              const signedTx = await walletClient.signTransaction(txParams);
              console.log("✅ Transaction signed:", signedTx);
              return signedTx;
            } catch (error) {
              console.log("❌ Failed to sign transaction:", error);
              throw error;
            }
          }
        };
        console.log("✅ FORCE TRIGGER: window.privyWallet exposed with methods:", Object.keys(window.privyWallet));
      }
    }
  }, [authenticated, ready, wallets.length, user?.wallet?.address]);

  // SIMPLE DEBUG: Why is useEffect not running?
  useEffect(() => {
    console.log("🟡 useEffect TRIGGERED - Dependency check:");
    console.log("🟡 authenticated:", authenticated);
    console.log("🟡 ready:", ready);
    console.log("🟡 wallets.length:", wallets.length);
    console.log("🟡 user?.wallet?.address:", user?.wallet?.address);
    console.log("🟡 window.ethereum:", !!window.ethereum);
    
    // MANUAL TRIGGER: Force window.privyWallet exposure if conditions are met
    if (authenticated && ready && wallets.length > 0 && !window.privyWallet) {
      console.log("🚨 MANUAL TRIGGER: Forcing window.privyWallet exposure...");
      const privyEmbeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      if (privyEmbeddedWallet) {
        console.log("🚨 MANUAL: Exposing window.privyWallet...");
        window.privyWallet = {
          authenticated,
          ready,
          user,
          wallets,
          sessionReady,
          embeddedWallet: privyEmbeddedWallet,
          getEthereumProvider: async () => {
            try {
              console.log("🔍 Getting Ethereum provider from embedded wallet...");
              const provider = await privyEmbeddedWallet.getEthereumProvider();
              console.log("✅ Got Ethereum provider:", provider);
              return provider;
            } catch (error) {
              console.log("❌ Failed to get Ethereum provider:", error);
              throw error;
            }
          },
          signTransaction: async (txParams) => {
            try {
              console.log("🔍 Signing transaction with embedded wallet...");
              const provider = await privyEmbeddedWallet.getEthereumProvider();
              
              // Create wallet client for signing
              const createWalletClient = window.viemCreateWalletClient;
              const custom = window.viemCustomTransport;
              if (!createWalletClient || !custom) throw new Error('viem globals missing');
              const walletClient = createWalletClient({
                chain: monadTestnet,
                transport: custom(provider)
              });
              
              console.log("🔍 Wallet client created, signing transaction...");
              const signedTx = await walletClient.signTransaction(txParams);
              console.log("✅ Transaction signed:", signedTx);
              return signedTx;
            } catch (error) {
              console.log("❌ Failed to sign transaction:", error);
              throw error;
            }
          }
        };
        console.log("✅ MANUAL: window.privyWallet exposed with methods:", Object.keys(window.privyWallet));
      }
    }
    
    console.log("🔍 WALLET DEBUG - Full analysis:", {
      authenticated: authenticated,
      ready: ready,
      walletsLength: wallets.length,
      userWallet: user?.wallet?.address,
      wallets: wallets.map(w => ({
        type: w.walletClientType,
        address: w.address,
        hasProvider: !!w.provider,
        providerInfo: w.provider ? Object.keys(w.provider).slice(0, 5) : null
      }))
    });
    // METHOD 1: Wait for Privy to properly initialize and override our fake provider
    if (authenticated && user?.wallet?.address && window.ethereum && !window.ethereum.isPrivyFake) {
      console.log("🎯 METHOD 1 SUCCESS - Privy has overridden fake provider!");
      console.log("🔍 Real Privy provider details:", {
        address: user.wallet.address,
        hasRequest: !!window.ethereum.request,
        isPrivyFake: window.ethereum.isPrivyFake,
        keys: Object.keys(window.ethereum).slice(0, 5)
      });
      
      // EXPOSE AS SEPARATE NAME to avoid any confusion
      window.realPrivyProvider = window.ethereum;
      window.privyWalletAddress = user.wallet.address;
      console.log("✅ REAL Privy provider exposed as realPrivyProvider - Privy initialization complete!");
      
      // Force contract setup
      if (window.walletManager) {
        setTimeout(() => window.walletManager._setupContract(), 500);
      }
      return;
    }
    
    // METHOD 2: Try to find embedded wallet from wallets array (FALLBACK)
    if (authenticated && wallets.length > 0) {
      const foundWallet = wallets.find(wallet =>
        wallet.walletClientType === 'privy' ||
        wallet.address?.toLowerCase() === user?.wallet?.address?.toLowerCase()
      );
      
      if (foundWallet) {
        console.log("🔍 METHOD 2 - Found wallet in array:", {
          type: foundWallet.walletClientType,
          address: foundWallet.address,
          hasProvider: !!foundWallet.provider,
          providerKeys: foundWallet.provider ? Object.keys(foundWallet.provider).slice(0, 5) : null
        });
        if (foundWallet.provider) {
          // EXPOSE AS SEPARATE NAME to avoid circular reference with fake provider
          window.realPrivyProvider = foundWallet.provider;
          window.privyWalletAddress = foundWallet.address;
          console.log("✅ REAL Privy provider exposed as realPrivyProvider via METHOD 2!");
          
          // Force contract setup
          if (window.walletManager) {
            setTimeout(() => window.walletManager._setupContract(), 500);
          }
          return;
        } else {
          // FALLBACK: Use window.ethereum which should now be Privy's provider
          console.log("🔧 METHOD 2 FALLBACK - Wallet found but no provider, using window.ethereum");
          if (window.ethereum && !window.ethereum.isPrivyFake) {
            window.realPrivyProvider = window.ethereum;
            window.privyWalletAddress = foundWallet.address;
            console.log("✅ REAL Privy provider exposed via METHOD 2 fallback (window.ethereum)!");
            
            // Force contract setup
            if (window.walletManager) {
              setTimeout(() => window.walletManager._setupContract(), 500);
            }
            return;
          } else {
            console.log("⚠️ METHOD 2 FALLBACK failed - window.ethereum still fake or missing");
          }
        }
        }
      }
    // METHOD 3: Polling approach - keep checking until Privy replaces fake provider
    if (authenticated && user?.wallet?.address && window.ethereum && window.ethereum.isPrivyFake) {
      console.log("🔄 METHOD 3 - Polling for Privy to replace fake provider...");
      
      const pollForRealProvider = () => {
        // Check every 500ms for up to 10 seconds
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkProvider = () => {
          attempts++;
          console.log(`🔄 Poll attempt ${attempts}/${maxAttempts} - checking for real Privy provider`);
          
          if (window.ethereum && !window.ethereum.isPrivyFake) {
            console.log("🎯 SUCCESS! Privy has replaced fake provider!");
            window.realPrivyProvider = window.ethereum;
            window.privyWalletAddress = user.wallet.address;
            console.log("✅ Real provider found via polling method!");
            
            // Force contract setup
            if (window.walletManager) {
              setTimeout(() => window.walletManager._setupContract(), 200);
            }
            return;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkProvider, 500);
          } else {
            console.warn("⚠️ Polling timeout - Privy didn't replace fake provider");
          }
        };
        
        setTimeout(checkProvider, 500);
      };
      
      pollForRealProvider();
    }
    
    console.log("❌ Both methods failed - no Privy provider found");
    console.log("🔍 Debug info:", {
      windowEthereum: !!window.ethereum,
      isPrivyFake: window.ethereum?.isPrivyFake,
      walletsLength: wallets.length,
      hasWalletProvider: wallets.length > 0 ? !!wallets[0].provider : false
    });
    
  }, [authenticated, wallets.length, user?.wallet?.address, ready]);

  // REMOVED: Don't use window.ethereum anymore - use REAL Privy provider from wallets array

  // SIMPLE MODE: Skip session signer completely
  useEffect(() => {
    const setupSimpleMode = async () => {
      try {
        if (!authenticated || !user?.wallet?.address) return;
        
        console.log('🔄 Setting up SIMPLE MODE (no session signer) for address:', user.wallet.address);
        console.log('✅ SIMPLE MODE: Session signer completely bypassed');
        
        // Set session ready to true immediately - no server call needed
        setSessionReady(true);
        
        // Expose direct transaction mode flag with additional info
        window.PRIVY_DIRECT_TX_MODE = {
          enabled: true,
          address: user.wallet.address,
          timestamp: Date.now()
        };
        
        // Find the embedded wallet from wallets array
        const privyEmbeddedWallet = wallets.find(w => w.walletClientType === 'privy');
        
        // Make sure the provider is properly exposed
        if (privyEmbeddedWallet) {
          try {
            console.log('🔄 Getting and exposing Ethereum provider...');
            const provider = await privyEmbeddedWallet.getEthereumProvider();
            window.realPrivyProvider = provider;
            console.log('✅ Ethereum provider exposed as window.realPrivyProvider');
          } catch (providerError) {
            console.error('❌ Failed to expose provider:', providerError);
          }
        }
        
        // Dispatch event for WalletManager
        window.dispatchEvent(new CustomEvent('privySessionReady', { 
          detail: { 
            address: user.wallet.address,
            directMode: true,
            timestamp: Date.now()
          }
        }));
        
        // Log success
        console.log('✅ DIRECT TRANSACTION MODE enabled with details:', window.PRIVY_DIRECT_TX_MODE);
        
        // Session server removed - no longer needed
        console.log('✅ Session server calls removed - using direct transaction mode only');
      } catch (e) {
        console.error('❌ Direct transaction mode setup failed:', e);
        // Force ready anyway
        setSessionReady(true);
        window.PRIVY_DIRECT_TX_MODE = {
          enabled: true,
          address: user?.wallet?.address,
          timestamp: Date.now(),
          error: e.message
        };
        
        // Make sure the provider is properly exposed even in error case
        const privyEmbeddedWallet = wallets.find(w => w.walletClientType === 'privy');
        if (privyEmbeddedWallet) {
          try {
            const provider = await privyEmbeddedWallet.getEthereumProvider();
            window.realPrivyProvider = provider;
            console.log('✅ Ethereum provider exposed as window.realPrivyProvider (error recovery)');
          } catch (providerError) {
            console.error('❌ Failed to expose provider in error recovery:', providerError);
          }
        }
        
        window.dispatchEvent(new CustomEvent('privySessionReady', { 
          detail: { 
            address: user?.wallet?.address,
            directMode: true,
            error: true
          }
        }));
      }
    };
    
    // Run immediately when authenticated changes
    setupSimpleMode();
  }, [authenticated, user?.wallet?.address, wallets]);

  // ENHANCED: Force Monad Network FIRST, then get balance with better error handling
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      console.log("🔄 Starting balance update process...");
      
      const updateBalanceWithNetworkForce = async () => {
        try {
          console.log("🚀 ENHANCED: Forcing Monad testnet BEFORE balance check...");
          console.log("🔍 User wallet address:", user.wallet.address);
          
          // Get real Privy provider
          let realPrivyProvider = null;
          
          if (window.realPrivyProvider) {
            realPrivyProvider = window.realPrivyProvider;
            console.log("✅ Using existing window.realPrivyProvider");
          } else if (wallets.length > 0) {
            console.log("🔍 Searching wallets array for Privy provider...");
            const foundWallet = wallets.find(w =>
              w.walletClientType === 'privy' ||
              w.address?.toLowerCase() === user.wallet.address.toLowerCase()
            );
            if (foundWallet && foundWallet.provider) {
              realPrivyProvider = foundWallet.provider;
              window.realPrivyProvider = realPrivyProvider;
              console.log("✅ Found Privy provider in wallets array");
            } else {
              console.log("⚠️ No Privy wallet found in wallets array");
            }
          }
          
          if (!realPrivyProvider) {
            console.error("❌ No REAL Privy provider for network/balance update");
            console.log("🔍 Available providers:", {
              windowRealPrivyProvider: !!window.realPrivyProvider,
              walletsLength: wallets.length,
              walletTypes: wallets.map(w => w.walletClientType)
            });
            setBalance(0);
            return;
          }
          
          console.log("✅ Privy provider found, proceeding with balance update");
          
          // STEP 1: FORCE switch to Monad testnet
          const MONAD_CHAIN_ID = '0x279f'; // 10143 in hex
          const MONAD_CONFIG = {
            chainId: MONAD_CHAIN_ID,
            chainName: 'Monad Testnet',
            rpcUrls: ['https://monad-testnet.drpc.org'],
            nativeCurrency: {
              name: 'MON',
              symbol: 'MON',
              decimals: 18
            },
            blockExplorerUrls: ['https://testnet.monadexplorer.com']
          };
          
          try {
            // Check current network
            const currentChain = await realPrivyProvider.request({ method: 'eth_chainId' });
            console.log("🔍 Current network:", currentChain, "Target:", MONAD_CHAIN_ID);
            
            if (currentChain !== MONAD_CHAIN_ID) {
              console.log("🚀 FORCING switch to Monad testnet...");
              
              try {
                await realPrivyProvider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: MONAD_CHAIN_ID }]
                });
                console.log("✅ Successfully switched to Monad testnet!");
              } catch (switchError) {
                console.log("⚠️ Switch failed, adding network first:", switchError.message);
                
                try {
                  await realPrivyProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [MONAD_CONFIG]
                  });
                  console.log("✅ Monad network added successfully");
                  
                  // Try switch again
                  await realPrivyProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: MONAD_CHAIN_ID }]
                  });
                  console.log("✅ Successfully switched after adding!");
                } catch (addError) {
                  console.error("❌ Failed to add/switch Monad network:", addError);
                  throw addError;
                }
              }
              
              // Wait for network switch to propagate
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // STEP 2: Verify we're on Monad testnet
            const finalChain = await realPrivyProvider.request({ method: 'eth_chainId' });
            console.log("🔍 Final network check:", finalChain);
            
            if (finalChain !== MONAD_CHAIN_ID) {
              throw new Error(`Still not on Monad testnet! Current: ${finalChain}, Expected: ${MONAD_CHAIN_ID}`);
            }
            
            // STEP 3: Get balance from Monad testnet
            console.log("💰 Getting balance from MONAD TESTNET...");
            const balance = await realPrivyProvider.request({
              method: 'eth_getBalance',
              params: [user.wallet.address, 'latest']
            });
            
            const balanceInMon = parseInt(balance, 16) / Math.pow(10, 18);
            setBalance(balanceInMon);
            
            console.log("✅ MON Balance from MONAD TESTNET:", balanceInMon.toFixed(4), "MON");
            console.log("🔍 Raw balance:", balance, "Address:", user.wallet.address);
            
            // Dispatch wallet connected event with correct balance
            window.dispatchEvent(new CustomEvent("walletConnected", {
              detail: {
                address: user.wallet.address,
                balance: balanceInMon,
                authenticated: true,
                network: 'monad-testnet'
              }
            }));
            
          } catch (networkError) {
            console.error("❌ Network/Balance operation failed:", networkError);
            console.error("❌ Will try balance on current network as fallback");
            
            // Fallback: get balance on whatever network we're on
            try {
              const balance = await realPrivyProvider.request({
                method: 'eth_getBalance',
                params: [user.wallet.address, 'latest']
              });
              
              const balanceInMon = parseInt(balance, 16) / Math.pow(10, 18);
              setBalance(balanceInMon);
              
              console.log("⚠️ Fallback balance:", balanceInMon.toFixed(4), "MON (may be wrong network)");
            } catch (fallbackError) {
              console.error("❌ Even fallback balance failed:", fallbackError);
              setBalance(0);
            }
          }
          
        } catch (error) {
          console.error("❌ Complete balance update failed:", error);
          setBalance(0);
        }
      };

      // Initial update with delay to ensure provider is ready
      setTimeout(() => {
        updateBalanceWithNetworkForce();
      }, 1000);
      
      // Update every 15 seconds (more frequent)
      const interval = setInterval(updateBalanceWithNetworkForce, 15000);
      
      return () => clearInterval(interval);
    } else {
      console.log("⚠️ Not authenticated or no wallet address, setting balance to 0");
      setBalance(0);
    }
  }, [authenticated, user?.wallet?.address, wallets.length]);

  // Listen for profit updates from the game
  useEffect(() => {
    const handleProfitUpdate = (event) => {
      setProfit(event.detail.profit);
    };

    window.addEventListener("profitUpdate", handleProfitUpdate);
    return () => window.removeEventListener("profitUpdate", handleProfitUpdate);
  }, []);
  
  // Load profit from leaderboard when wallet is available
  const loadProfitFromLeaderboard = async () => {
    if (!user?.wallet?.address || !window.s_oLeaderboardManager) return;
    
    try {
      console.log("📊 Loading profit from leaderboard for:", user.wallet.address);
      const playerStats = await window.s_oLeaderboardManager.getPlayerStats(user.wallet.address);
      
      if (playerStats && playerStats.player) {
        const player = playerStats.player;
        const games = playerStats.games || [];
        
        // Use the correct profit calculation from GhostGraphService
        const totalWinnings = player.totalWinnings || 0;
        const totalLossesAmount = player.totalLossesAmount || 0;
        const netProfit = totalWinnings - totalLossesAmount;
        
        console.log("💰 Correct profit calculation:", {
          totalWinnings,
          totalLossesAmount,
          netProfit,
          playerData: player
        });
        
        console.log("💰 Net profit from leaderboard:", netProfit);
        setProfit(netProfit);
      }
    } catch (error) {
      console.error("❌ Error loading profit from leaderboard:", error);
    }
  };
  
  useEffect(() => {
    loadProfitFromLeaderboard();
  }, [user?.wallet?.address]);
  
  // Listen for leaderboard updates to refresh profit
  useEffect(() => {
    const handleLeaderboardUpdate = () => {
      console.log("📢 Leaderboard updated, reloading profit...");
      loadProfitFromLeaderboard();
    };

    window.addEventListener("leaderboardUpdated", handleLeaderboardUpdate);
    return () => window.removeEventListener("leaderboardUpdated", handleLeaderboardUpdate);
  }, [user?.wallet?.address]);

  // Listen for balance updates from WalletManager
  useEffect(() => {
    const handleBalanceUpdate = (event) => {
      console.log("💰 Balance update event received:", event.detail);
      setBalance(event.detail.balance);
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);
    return () => window.removeEventListener("balanceUpdate", handleBalanceUpdate);
  }, []);

  const handleLogin = async () => {
    try {
      await login({ loginMethods: ['email', 'wallet'] });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setBalance(0);
      setProfit(0);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRefreshBalance = async () => {
    console.log("🔄 Manual balance refresh requested");
    if (authenticated && user?.wallet?.address) {
      try {
        // Force balance update
        const realPrivyProvider = window.realPrivyProvider;
        if (realPrivyProvider) {
          // Force network switch first
          await realPrivyProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279f' }]
          });
          
          // Get balance
          const balance = await realPrivyProvider.request({
            method: 'eth_getBalance',
            params: [user.wallet.address, 'latest']
          });
          
          const balanceInMon = parseInt(balance, 16) / Math.pow(10, 18);
          setBalance(balanceInMon);
          
          console.log("✅ Manual balance refresh successful:", balanceInMon.toFixed(4), "MON");
        } else {
          console.error("❌ No Privy provider available for manual refresh");
        }
      } catch (error) {
        console.error("❌ Manual balance refresh failed:", error);
      }
    }
  };

  const handleSendTransaction = async () => {
    if (!sendToAddress.trim() || !sendAmount.trim()) {
      setNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in both address and amount fields',
        timestamp: Date.now()
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setNotification({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount greater than 0',
        timestamp: Date.now()
      });
      return;
    }

    if (amount > balance) {
      setNotification({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You only have ${balance.toFixed(4)} MON available`,
        timestamp: Date.now()
      });
      return;
    }

    try {
      setIsSending(true);
      console.log('🚀 Sending transaction:', { to: sendToAddress, amount });

      // Get the Privy provider
      const provider = window.realPrivyProvider || window.ethereum;
      if (!provider) {
        throw new Error('No wallet provider found');
      }

      // Convert amount to wei (assuming 18 decimals for MON)
      const amountInWei = (amount * Math.pow(10, 18)).toString(16);
      const amountHex = '0x' + amountInWei;

      // Send transaction
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: user?.wallet?.address,
          to: sendToAddress,
          value: amountHex,
          gas: '0x5208', // 21000 gas for simple transfer
        }]
      });

      console.log('✅ Transaction sent:', txHash);

      // Show success notification with transaction details
      setNotification({
        type: 'success',
        title: 'Transaction Sent!',
        message: `Successfully sent ${amount} MON to ${sendToAddress.substring(0, 10)}...`,
        txHash: txHash,
        toAddress: sendToAddress,
        timestamp: Date.now()
      });

      // Clear form
      setSendToAddress('');
      setSendAmount('');

      // Refresh balance after a delay
      setTimeout(() => {
        if (window.refreshBalance) {
          window.refreshBalance();
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Send transaction failed:', error);
      
      let errorMessage = 'Transaction failed';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        switch (error.code) {
          case 4001:
            errorMessage = 'Transaction rejected by user';
            break;
          case -32603:
            errorMessage = 'Internal error - insufficient funds or gas';
            break;
          default:
            errorMessage = `Transaction failed (${error.code})`;
        }
      }

      setNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: errorMessage,
        timestamp: Date.now()
      });
    } finally {
      setIsSending(false);
    }
  };

  const showTransactionNotification = (txHash, amount, toAddress) => {
    const notificationData = {
      type: 'success',
      title: 'Transaction Sent!',
      message: `${amount} MON sent successfully`,
      txHash: txHash,
      toAddress: toAddress,
      timestamp: Date.now()
    };
    
    setNotification(notificationData);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleAddressClick = async () => {
    if (user?.wallet?.address) {
      try {
        await navigator.clipboard.writeText(user.wallet.address);
        console.log("📋 Address copied to clipboard:", user.wallet.address);
        
        // Show temporary feedback
        const addressElement = document.querySelector('.address-value');
        if (addressElement) {
          const originalText = addressElement.textContent;
          addressElement.textContent = 'Copied!';
          addressElement.style.color = '#00FF00';
          
          setTimeout(() => {
            addressElement.textContent = originalText;
            addressElement.style.color = '#FFD700';
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Failed to copy address:", error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = user.wallet.address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log("📋 Address copied using fallback method");
      }
    }
  };

  // Auto-hide notification after 8 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Update online player count
  useEffect(() => {
    const updateOnlinePlayerCount = () => {
      if (window.socialFeatures && window.socialFeatures.getOnlinePlayerCount) {
        const count = window.socialFeatures.getOnlinePlayerCount();
        setOnlinePlayerCount(count);
      } else {
        // Fallback: simulate player count
        const baseCount = 150;
        const variation = Math.floor(Math.random() * 50) - 25;
        const timeOfDay = new Date().getHours();
        const peakBonus = (timeOfDay >= 12 && timeOfDay <= 18) ? 30 : 0;
        const count = Math.max(50, baseCount + variation + peakBonus);
        setOnlinePlayerCount(count);
      }
    };

    // Update immediately
    updateOnlinePlayerCount();

    // Update every 30 seconds
    const interval = setInterval(updateOnlinePlayerCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleProfileToggle = () => {
    const newShowState = !showProfileDrawer;
    setShowProfileDrawer(newShowState);
    console.log("👤 Profile drawer toggled:", newShowState);
    
    // Load player stats when opening profile
    if (newShowState && authenticated && user?.wallet?.address) {
      loadPlayerStats();
    }
  };

  const loadPlayerStats = async () => {
    if (!authenticated || !user?.wallet?.address) return;
    
    try {
      setIsLoadingStats(true);
      console.log("📊 Loading player stats for:", user.wallet.address);
      
      // Get player stats from leaderboard manager
      if (window.s_oLeaderboardManager && window.s_oLeaderboardManager.getPlayerStats) {
        console.log("📊 Using cached player stats for:", user.wallet.address);
        const playerData = await window.s_oLeaderboardManager.getPlayerStats(user.wallet.address);
        console.log("✅ Player stats loaded:", playerData);
        setPlayerStats(playerData);
      } else {
        console.log("⚠️ LeaderboardManager not available");
        setPlayerStats(null);
      }
    } catch (error) {
      console.error("❌ Failed to load player stats:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setPlayerStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Safe render function for player stats
  const renderPlayerStats = () => {
    try {
      if (isLoadingStats) {
        return (
          <div className="stats-loading">
            <div className="loading-spinner-small"></div>
            <span>Loading stats...</span>
          </div>
        );
      }
      
      if (playerStats && playerStats.player) {
        const player = playerStats.player;
        const totalGames = Number(player.totalGames || 0);
        const totalWins = Number(player.totalWins || 0);
        const totalLosses = Number(player.totalLosses || 0);
        const totalWinnings = Number(player.totalWinnings || 0);
        const totalLossesAmount = Number(player.totalLossesAmount || 0);
        const netProfit = totalWinnings - totalLossesAmount;
        const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
        
        return (
          <div className="stats-grid-detailed">
            <div className="stat-item">
              <span className="stat-label">Total Games:</span>
              <span className="stat-value">{totalGames}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Wins:</span>
              <span className="stat-value">{totalWins} games</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Losses:</span>
              <span className="stat-value">{totalLosses} games</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Winnings:</span>
              <span className="stat-value">{totalWinnings.toFixed(2)} MON</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Losses:</span>
              <span className="stat-value">{totalLossesAmount.toFixed(2)} MON</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Net Profit:</span>
              <span className={`stat-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)} MON
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Win Rate:</span>
              <span className="stat-value">{winRate.toFixed(1)}%</span>
            </div>
          </div>
        );
      }
      
      return (
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Games:</span>
            <span className="stat-value">-</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Profit:</span>
            <span className={`stat-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(4)} MON
            </span>
          </div>
        </div>
      );
    } catch (error) {
      console.error("❌ Error rendering player stats:", error);
      return (
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Error:</span>
            <span className="stat-value">Failed to load stats</span>
          </div>
        </div>
      );
    }
  };

  if (!ready) {
    return (
      <div className="wallet-loading">
        <div className="loading-spinner"></div>
        <span>Loading wallet...</span>
      </div>
    );
  }

  return (
    <div className="privy-wallet-container">
      <div className="wallet-content">
        <div className="wallet-info">
          <div className="wallet-status">
            <span className="status-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {authenticated ? 'Connected' : 'Not Connected'}
            </span>
            <span className={`status-indicator ${authenticated ? 'connected' : 'disconnected'}`} style={{ marginLeft: '10px', fontSize: '18px' }}>
              ●
            </span>
            {authenticated && user?.wallet && (
              <span 
                className="address-value clickable-address" 
                onClick={handleAddressClick}
                title="Click to copy full address"
                style={{ fontSize: '16px', marginLeft: '15px', fontWeight: 'bold' }}
              >
                {user.wallet.address ? 
                  `${user.wallet.address.substring(0, 6)}...${user.wallet.address.substring(user.wallet.address.length - 4)}` : 
                  'N/A'
                }
              </span>
            )}
            {authenticated && (
              <button 
                className="profile-toggle-btn"
                onClick={handleProfileToggle}
                title="Profile"
                style={{
                  marginLeft: '15px',
                  background: 'transparent',
                  border: '2px solid #676FFF',
                  borderRadius: '8px',
                  color: '#676FFF',
                  padding: '8px 16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#676FFF';
                  e.target.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#676FFF';
                }}
              >
                👤 Profile
              </button>
            )}
          </div>
          
          {/* MON Balance ve Profit Bilgileri */}
          {authenticated && (
            <div className="balance-profit-section">
              <div className="balance-item">
                <span className="balance-label">MON Balance:</span>
                <span className="balance-value" style={{ color: '#FFD700', fontWeight: 'bold' }}>
                  {balance.toFixed(2)} MON
                </span>
              </div>
              <div className="profit-item">
                <span className="profit-label">Profit:</span>
                <span className={`profit-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`} style={{ fontWeight: 'bold' }}>
                  {profit >= 0 ? '+' : ''}{profit.toFixed(2)} MON
                </span>
              </div>
            </div>
          )}

          {/* Social Media Links */}
          <div className="social-links-section">
            <div className="social-links-title">Follow Us</div>
            <div className="social-links-container">
              <a 
                href="https://x.com/ChogNFT" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link twitter-link"
                title="Follow us on X (Twitter)"
              >
                <img src="/sprites/but_twitter.png" alt="Twitter" className="social-icon-img" />
              </a>
              <a 
                href="https://discord.gg/chog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link discord-link"
                title="Join our Discord"
              >
                <img src="/sprites/but_dc.png" alt="Discord" className="social-icon-img" />
              </a>
              <a 
                href="https://chog.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link website-link"
                title="Visit our website"
              >
                <img src="/sprites/but_web.png" alt="Website" className="social-icon-img" />
              </a>
            </div>
          </div>

          {/* Online Players Count */}
          <div className="online-players-section">
            <div className="online-players-title">Online Players</div>
            <div className="online-indicator">
              <span className="green-light"></span>
              <span className="player-count">{onlinePlayerCount}</span>
            </div>
          </div>
        </div>
        
        <div className="wallet-actions">
          {/* Disconnect button moved to profile drawer */}
        </div>
      </div>
      
      {/* Profile Drawer */}
      {showProfileDrawer && authenticated && (
        <div className="profile-drawer">
          <div className="profile-drawer-content">
            <div className="profile-header">
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>👤 Profile</h3>
              <div className="profile-header-actions">
                <button 
                  className="disconnect-btn-profile" 
                  onClick={handleLogout}
                  style={{
                    background: '#ff4444',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: '0.2s',
                    marginRight: '8px'
                  }}
                >
                  Disconnect
                </button>
                <button 
                  className="close-profile-btn" 
                  onClick={handleProfileToggle}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#676FFF',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="profile-section">
              <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>📊 Game Statistics</h4>
              {renderPlayerStats()}
            </div>
            
            <div className="profile-section">
              <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>🔗 Wallet Info</h4>
              <div className="wallet-info-detail">
                <div className="info-item">
                  <span className="info-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Address:</span>
                  <span 
                    className="info-value clickable" 
                    onClick={handleAddressClick}
                    style={{ cursor: 'pointer', color: '#676FFF', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {user?.wallet?.address ? 
                      `${user.wallet.address.substring(0, 10)}...${user.wallet.address.substring(user.wallet.address.length - 8)}` : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Network:</span>
                  <span className="info-value" style={{ fontSize: '16px', fontWeight: 'bold' }}>Monad Testnet</span>
                </div>
                <div className="info-item">
                  <span className="info-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Balance:</span>
                  <span className="info-value" style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFD700' }}>{balance.toFixed(2)} MON</span>
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>💸 Withdraw MON</h4>
              <div className="send-mon-form">
                <div className="form-group">
                  <label>To Address:</label>
                  <input
                    type="text"
                    value={sendToAddress}
                    onChange={(e) => setSendToAddress(e.target.value)}
                    placeholder="Enter recipient address..."
                    className="address-input"
                  />
                </div>
                <div className="form-group">
                  <label>Amount (MON):</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.0000"
                    step="0.0001"
                    min="0"
                    max={balance}
                    className="amount-input"
                  />
                  <div className="balance-info">
                    Available: {balance.toFixed(2)} MON
                  </div>
                </div>
                <div className="send-actions">
                  <button
                    onClick={handleSendTransaction}
                    disabled={isSending || !sendToAddress.trim() || !sendAmount || parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > balance}
                    className="send-submit-btn"
                  >
                    {isSending ? 'Withdrawing...' : 'Withdraw MON'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Send Modal */}
      
      {/* Transaction Notification */}
      {notification && (
        <div className="transaction-notification">
          <div className="notification-content">
            <div className="notification-header">
              <div className="notification-icon">✅</div>
              <div className="notification-title">{notification.title}</div>
              <button 
                className="notification-close" 
                onClick={() => setNotification(null)}
              >
                ×
              </button>
            </div>
            <div className="notification-body">
              <div className="notification-message">{notification.message}</div>
              <div className="notification-details">
                <div className="tx-hash">
                  <span className="label">Hash:</span>
                  <span className="value" title={notification.txHash}>
                    {notification.txHash.substring(0, 10)}...{notification.txHash.substring(notification.txHash.length - 8)}
                  </span>
                </div>
                <div className="to-address">
                  <span className="label">To:</span>
                  <span className="value" title={notification.toAddress}>
                    {notification.toAddress.substring(0, 6)}...{notification.toAddress.substring(notification.toAddress.length - 4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      {showLoginModal && createPortal(
        <div className="login-modal-overlay" style={{zIndex: 999999}} onClick={(e) => e.stopPropagation()}>
          <div className="login-modal">
            <div className="login-modal-header">
              <h2>Welcome to ChogCross</h2>
              <p>Please login to play the game</p>
            </div>
            <div className="login-modal-content">
              <button 
                className="login-modal-btn" 
                onClick={handleLogin}
                style={{
                  background: '#676FFF',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: '0.2s',
                  width: '100%',
                  marginTop: '16px'
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function App() {
  console.log("🚀 React App component rendering...");
  
  try {
    return (
      <PrivyProvider
        appId="cmfhaf46w000wjm0bzdc69uu4"
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#676FFF',
            showWalletLoginFirst: false,
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'all-users',
              noPromptOnSignature: true,
            },
          },
          // Offer both Email and Wallet sign-in in the Privy modal
          loginMethods: ['email', 'wallet'],
          // Allow users to sign in with an external wallet as well
          externalWallets: {
            evm: {
              metamask: true,
              coinbaseWallet: true,
              walletConnect: { projectId: import.meta.env.VITE_WC_PROJECT_ID },
              defaultChain: monadTestnet,
            },
          },
          supportedChains: [monadTestnet], // ONLY Monad testnet - no mainnet
          defaultChain: monadTestnet, // FORCE Monad testnet as only option
        }}
      >
        <WalletUI />
      </PrivyProvider>
    );
  } catch (error) {
    console.error("❌ Error in App component:", error);
    return (
      <div style={{ padding: '20px', color: 'red', background: 'white' }}>
        <h3>Wallet Error</h3>
        <p>Failed to initialize wallet component</p>
        <p>Error: {error.message}</p>
      </div>
    );
  }
}

// Function to render wallet in left panel
export function renderWalletInLeftPanel() {
  console.log("🎯 Rendering wallet in left panel...");
  
  const leftPanelRoot = document.getElementById('privy-wallet-root-left');
  if (leftPanelRoot && window.React && window.ReactDOM && window.createRoot) {
    try {
      const root = window.createRoot(leftPanelRoot);
      root.render(window.React.createElement(App, {}));
      console.log("✅ Wallet rendered in left panel successfully!");
    } catch (error) {
      console.error("❌ Failed to render wallet in left panel:", error);
    }
  } else {
    console.log("⏳ Left panel root or React not ready, will retry...");
    setTimeout(() => {
      renderWalletInLeftPanel();
    }, 1000);
  }
}
