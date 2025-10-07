import React, { useEffect, useState } from "react";
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
  const [balance, setBalance] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [profit, setProfit] = useState(0);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // SIMPLE MOUNT TEST - Bu her zaman çalışmalı
  useEffect(() => {
    console.log("🎯 WalletUI MOUNTED - useEffect çalışıyor!");
  }, []); // Boş dependency array
  
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
        
        // Calculate net profit like in leaderboard
        const totalWinnings = player.totalWinnings || 0;
        const totalLosses = games
          .filter(g => g.winnings === 0)
          .reduce((sum, g) => sum + g.betAmount, 0);
        const netProfit = totalWinnings - totalLosses;
        
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

  const handleSendClick = () => {
    setShowSendModal(true);
    setSendToAddress('');
    setSendAmount('');
  };

  const handleSendClose = () => {
    setShowSendModal(false);
    setSendToAddress('');
    setSendAmount('');
    setIsSending(false);
  };

  const handleSendSubmit = async () => {
    if (!sendToAddress || !sendAmount || isSending) return;
    
    try {
      setIsSending(true);
      console.log("🚀 Sending MON:", sendAmount, "to:", sendToAddress);
      
      // Validate address
      if (!/^0x[a-fA-F0-9]{40}$/.test(sendToAddress)) {
        alert("Invalid Ethereum address format");
        return;
      }
      
      // Validate amount
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) {
        alert("Invalid amount");
        return;
      }
      
      if (amount > balance) {
        alert("Insufficient balance");
        return;
      }
      
      // Get real Privy provider
      const realPrivyProvider = window.realPrivyProvider;
      if (!realPrivyProvider) {
        alert("Wallet provider not available");
        return;
      }
      
      // Convert amount to wei
      const amountWei = (amount * Math.pow(10, 18)).toString(16);
      
      // Get gas price
      const gasPrice = await realPrivyProvider.request({
        method: 'eth_gasPrice'
      });
      
      // Estimate gas
      const gasEstimate = await realPrivyProvider.request({
        method: 'eth_estimateGas',
        params: [{
          from: user.wallet.address,
          to: sendToAddress,
          value: '0x' + amountWei
        }]
      });
      
      // Send transaction with higher gas limit
      const txHash = await realPrivyProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: user.wallet.address,
          to: sendToAddress,
          value: '0x' + amountWei,
          gas: '0x186A0', // 100,000 in hex
          gasPrice: gasPrice
        }]
      });
      
      console.log("✅ Transaction sent:", txHash);
      
      // Show custom notification instead of alert
      showTransactionNotification(txHash, amount, sendToAddress);
      
      // Refresh balance
      await handleRefreshBalance();
      
      // Close modal
      handleSendClose();
      
    } catch (error) {
      console.error("❌ Failed to send transaction:", error);
      alert("Failed to send transaction: " + error.message);
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
            <span className={`status-indicator ${authenticated ? 'connected' : 'disconnected'}`}>
              ●
            </span>
            <span className="status-text">
              {authenticated ? 'Connected' : 'Not Connected'}
            </span>
            {authenticated && (
              <span className="status-text" style={{ marginLeft: 8 }}>
                {sessionReady ? '(Session Ready)' : '(Preparing Session...)'}
              </span>
            )}
            {authenticated && user?.wallet && (
              <span 
                className="address-value clickable-address" 
                onClick={handleAddressClick}
                title="Click to copy full address"
              >
                {user.wallet.address ? 
                  `${user.wallet.address.substring(0, 6)}...${user.wallet.address.substring(user.wallet.address.length - 4)}` : 
                  'N/A'
                }
              </span>
            )}
          </div>
        </div>
        
        {authenticated && user?.wallet && (
          <div className="wallet-balance">
            <div className="balance-item" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
              <span className="balance-label">MON Balance:</span>
              <span className="balance-value" id="react-balance-display" style={{ marginLeft: '8px', whiteSpace: 'nowrap' }}>
                {balance.toFixed(4)} MON
                <span 
                  className="refresh-icon" 
                  onClick={handleRefreshBalance} 
                  title="Refresh Balance"
                  style={{
                    marginLeft: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    opacity: 0.7,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    display: 'inline',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'rotate(180deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '0.7';
                    e.target.style.transform = 'rotate(0deg)';
                  }}
                >
                  🔄
                </span>
              </span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Profit:</span>
              <span id="profit-display" className={`balance-value ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                {profit >= 0 ? '+' : ''}{profit.toFixed(4)} MON
              </span>
            </div>
          </div>
        )}
        
        <div className="wallet-actions">
          {authenticated ? (
            <>
              <button className="wallet-btn send-btn" onClick={handleSendClick}>
                Send MON
              </button>
              <button className="wallet-btn disconnect-btn" onClick={handleLogout}>
                Disconnect
              </button>
            </>
          ) : (
            <button className="wallet-btn connect-btn" onClick={handleLogin}>
              Login
            </button>
          )}
        </div>
      </div>
      
      {/* Send Modal */}
      {showSendModal && (
        <div className="send-modal-overlay">
          <div className="send-modal">
            <div className="send-modal-header">
              <h3>Send MON</h3>
              <button className="close-btn" onClick={handleSendClose}>×</button>
            </div>
            
            <div className="send-modal-content">
              <div className="form-group">
                <label>To Address:</label>
                <input
                  type="text"
                  value={sendToAddress}
                  onChange={(e) => setSendToAddress(e.target.value)}
                  placeholder="0x..."
                  className="address-input"
                />
              </div>
              
              <div className="form-group">
                <label>Amount (MON):</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.0001"
                  min="0"
                  max={balance}
                  className="amount-input"
                />
                <div className="balance-info">
                  Available: {balance.toFixed(4)} MON
                </div>
              </div>
            </div>
            
            <div className="send-modal-actions">
              <button 
                className="wallet-btn cancel-btn" 
                onClick={handleSendClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                className="wallet-btn send-submit-btn" 
                onClick={handleSendSubmit}
                disabled={isSending || !sendToAddress || !sendAmount}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
