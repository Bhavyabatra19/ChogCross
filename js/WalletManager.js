/**
 * WalletManager.js - Privy Embedded Wallet Entegrasyonu
 * Chog Cross Gambling Game için React Privy cüzdan yönetimi
 * Contract Integration: ChogCrossGameMON
 */

function WalletManager() {
    var _bConnected = false;
    var _sWalletAddress = null;
    var _fBalance = 0;
    var _fProfit = 0;
    var _oProvider = null;
    var _iChainId = null;
    var _oContract = null;
    var _sCurrentRoundId = null;
    var _bGameActive = false;
    var _bVRFReady = false;
    var _bContractFailed = false; // Contract fail durumunu takip et
    var _eventListeners = [];
    var _vrfChecker = null; // VRF readiness checker interval
    var _lastAuthRequest = 0; // Rate limiting için
    var _authCooldown = 2000; // 2 saniye cooldown
    var _contractEventListeners = []; // Contract event listeners array for cleanup
    
    // Local nonce/balance management for signless flow
    var _localNonce = null; // number | null
    var _localBalanceWei = null; // string | null
    
    // Initialize/refresh local nonce & balance from network
    this.resetNonceAndBalance = async function() {
        try {
            if (!_sWalletAddress || !window.realPrivyProvider) return;
            const provider = window.realPrivyProvider;
            const [nonceHex, balanceHex] = await Promise.all([
                provider.request({ method: 'eth_getTransactionCount', params: [_sWalletAddress, 'latest'] }),
                provider.request({ method: 'eth_getBalance', params: [_sWalletAddress, 'latest'] })
            ]);
            _localNonce = typeof nonceHex === 'string' ? parseInt(nonceHex, 16) : 0;
            _localBalanceWei = typeof balanceHex === 'string' ? balanceHex : '0x0';
            console.log('🔢 Local nonce set to:', _localNonce, ' balance:', _localBalanceWei);
        } catch (e) {
            console.warn('⚠️ resetNonceAndBalance failed:', e && e.message ? e.message : e);
        }
    };
    
    // Core helper: sign raw tx and broadcast via RPC (popup-free)
    this.sendSignedTx = async function(params) {
        const { to, data, gas, maxFeePerGas, maxPriorityFeePerGas, value } = params;
        if (!window.realPrivyProvider) throw new Error('Privy provider not available');
        if (!_sWalletAddress) throw new Error('Wallet address not available');
        
        // Rate limiting check
        const now = Date.now();
        if (now - _lastAuthRequest < _authCooldown) {
            const waitTime = _authCooldown - (now - _lastAuthRequest);
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        _lastAuthRequest = Date.now();
        
        // Ensure local nonce
        if (_localNonce === null) {
            await this.resetNonceAndBalance();
            if (_localNonce === null) throw new Error('Failed to initialize local nonce');
        }
        const useNonce = _localNonce;
        _localNonce = useNonce + 1; // optimistic increment
        
        try {
            const isNonceErr = (m) => /nonce/i.test(m) || /already known/i.test(m) || /replacement/i.test(m) || /underpriced/i.test(m);

            const tryOnce = async (nonceToUse) => {
                // STRATEGY 1: viem wallet client signTransaction (preferred for Privy)
                try {
                    const createWalletClient = window.viemCreateWalletClient;
                    const custom = window.viemCustomTransport;
                    if (createWalletClient && custom) {
                        const monadChain = { id: 10143, name: 'Monad Testnet', network: 'monad-testnet', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } } };
                        const walletClient = createWalletClient({ chain: monadChain, transport: custom(window.realPrivyProvider) });
                        const toBigInt = (hex) => {
                            if (!hex) return undefined;
                            try { return BigInt(hex); } catch (_) { try { return ethers.BigNumber.from(hex).toBigInt(); } catch { return undefined; } }
                        };
                        // Privy embedded wallet address'ini kullan
                        const privyAddress = window.localStorage.getItem('privyEmbeddedWalletAddress') || _sWalletAddress;
                        
                        const signedTx = await walletClient.signTransaction({
                            to,
                            account: privyAddress,
                            data,
                            nonce: nonceToUse,
                            gas: toBigInt(gas),
                            maxFeePerGas: toBigInt(maxFeePerGas),
                            maxPriorityFeePerGas: toBigInt(maxPriorityFeePerGas),
                            value: toBigInt(value || '0x0')
                        });
                        const rpcHash = await window.fetch((window.MONAD_RPC_URL) || 'https://testnet-rpc.monad.xyz', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ id: 0, jsonrpc: '2.0', method: 'eth_sendRawTransaction', params: [signedTx] })
                        }).then(r => r.json());
                        if (rpcHash && rpcHash.error) {
                            throw new Error(rpcHash.error.message || 'eth_sendRawTransaction failed');
                        }
                        const txHash = rpcHash && rpcHash.result ? rpcHash.result : null;
                        if (!txHash) throw new Error('No transaction hash returned');
                        console.log('📤 Raw transaction sent (viem):', txHash);
                        return { success: true, txHash };
                    }
                } catch (viemErr) {
                    const vmsg = viemErr && viemErr.message ? viemErr.message : String(viemErr);
                    console.log('ℹ️ viem signTransaction not available/failed:', vmsg);
                }

                // STRATEGY 2: Direct provider request eth_sendTransaction (confirmation modals disabled)
                const minimalTx = {
                    from: _sWalletAddress,
                    to,
                    data,
                    value: value || '0x0',
                    gas,
                    maxFeePerGas,
                    maxPriorityFeePerGas,
                    nonce: ethers.utils.hexlify(nonceToUse),
                    chainId: '0x279f'
                };
                const txHash = await window.realPrivyProvider.request({
                    method: 'eth_sendTransaction',
                    params: [minimalTx]
                });
                console.log('📤 Sent via provider eth_sendTransaction:', txHash);
                return { success: true, txHash };
            };

            try {
                return await tryOnce(useNonce);
            } catch (firstErr) {
                const msg1 = firstErr && firstErr.message ? firstErr.message : String(firstErr);
                console.warn('❌ sendSignedTx first attempt failed:', msg1);
                if (isNonceErr(msg1)) {
                    try { await this.resetNonceAndBalance(); } catch (_) {}
                    const freshNonce = _localNonce;
                    _localNonce = freshNonce + 1; // optimistic for the retry too
                    try {
                        return await tryOnce(freshNonce);
                    } catch (secondErr) {
                        const msg2 = secondErr && secondErr.message ? secondErr.message : String(secondErr);
                        console.warn('❌ sendSignedTx second attempt failed:', msg2);
                        return { success: false, error: msg2 };
                    }
                }
                return { success: false, error: msg1 };
            }
        } catch (err) {
            const msg = err && err.message ? err.message : String(err);
            console.warn('❌ sendSignedTx failed:', msg);
            return { success: false, error: msg };
        }
    };
    
    // Monad Test Ağı Konfigürasyonu
    var MONAD_CONFIG = {
        chainId: '0x279f', // 10143 in hex (corrected)
        chainName: 'Monad Testnet',
        rpcUrls: ['https://testnet-rpc.monad.xyz'],
        nativeCurrency: {
            name: 'MON',
            symbol: 'MON',
            decimals: 18
        },
        blockExplorerUrls: ['https://testnet.monadexplorer.com']
    };
    
    this._init = function() {
        console.log("🔗 WalletManager initializing with PURE Privy ONLY...");
        console.log("🚫 ALL external wallet detection PERMANENTLY DISABLED");
        console.log("✅ Using PURE Privy embedded wallet ONLY");
        
        // DISABLED: No fake window.ethereum creation
        // Privy will handle its own provider setup
        console.log("🔧 Letting Privy handle its own provider setup");
        
        // Event listeners ekle (external wallet events disabled)
        this._addEventListeners();
        
        // Add cleanup on page unload
        this._addCleanupListeners();
        
        // Privy wallet events dinle
        this._addPrivyEventListeners();
        
        // Contract'ı başlat
        this._initContract();
        
        console.log("✅ WalletManager initialized successfully");
    };
    
    this._addCleanupListeners = function() {
        var self = this;
        
        // Cleanup on page unload/refresh
        window.addEventListener('beforeunload', function() {
            console.log("🧹 Page unloading - cleaning up contract listeners");
            self._removeContractEventListeners();
        });
        
        // Cleanup on page hide (mobile/tab switch)
        window.addEventListener('pagehide', function() {
            console.log("🧹 Page hiding - cleaning up contract listeners");
            self._removeContractEventListeners();
        });
        
        console.log("✅ Cleanup listeners added");
    };
    
    this._initContract = function() {
        try {
            if (typeof window.CHOG_CROSS_CONTRACT === 'undefined') {
                console.warn("⚠️ ChogCrossABI.js not loaded yet, contract will be initialized after wallet connection");
                return;
            }
            
            console.log("🔗 Initializing ChogCross contract...");
            console.log("📍 Contract address:", window.CHOG_CROSS_CONTRACT.address);
            
        } catch (error) {
            console.error("❌ Contract initialization failed:", error);
        }
    };
    
    this._setupContract = async function() {
        try {
            if (!_bConnected || !window.CHOG_CROSS_CONTRACT) {
                console.warn("⚠️ Prerequisites not met for contract setup");
                return false;
            }
            
            // Smart provider detection for Privy
            let provider = null;
            
            console.log("🔍 Detecting Privy provider...");
            
            // ONLY Method 1: Use window.privyProvider (set by React Privy component)
            // ONLY Method 1: Use window.realPrivyProvider (set by React Privy component)
            // NO FALLBACK TO window.ethereum - this prevents external wallet interference
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("✅ Found window.realPrivyProvider - using ONLY Privy provider");
            } else {
                console.error("❌ window.realPrivyProvider not found - external wallets disabled");
                console.log("🔍 Provider detection status:", {
                    windowRealPrivyProvider: !!window.realPrivyProvider,
                    windowEthereum: !!window.ethereum,
                    note: "Only window.realPrivyProvider accepted - no external wallet fallback"
                });
            }
            if (!provider) {
                console.error("❌ No Privy provider available - contract setup failed");
                console.error("❌ Available providers:", {
                    windowEthereum: !!window.ethereum,
                    windowRealPrivyProvider: !!window.realPrivyProvider,
                    providersArray: window.ethereum?.providers?.length || 0
                });
                return false;
            }
            
            // ethers.js kontrolü
            if (typeof ethers !== 'undefined') {
                console.log("✅ ethers.js available, setting up contract with DETECTED PRIVY PROVIDER");
                
                // Web3 provider ile contract setup
                _oProvider = new ethers.providers.Web3Provider(provider);
                
                // Create signer with explicit address from wallet connection
                let signer;
                if (_sWalletAddress) {
                    console.log("🔗 Creating signer with wallet address:", _sWalletAddress);
                    // Use specific address for signer instead of account #0
                    signer = _oProvider.getSigner(_sWalletAddress);
                } else {
                    console.log("🔗 Creating default signer");
                    signer = _oProvider.getSigner();
                }
                
                _oContract = new ethers.Contract(
                    window.CHOG_CROSS_CONTRACT.address,
                    window.CHOG_CROSS_CONTRACT.abi,
                    signer
                );
                
                console.log("✅ Contract setup completed with PRIVY PROVIDER and explicit address");
                this._setupContractEventListeners();
            } else {
                console.warn("⚠️ ethers.js not available, using raw provider calls");
                _oProvider = provider;
            }
            
            return true;
            
        } catch (error) {
            console.error("❌ Contract setup failed:", error);
            return false;
        }
    };
    
    // Cleanup existing contract event listeners
    this._removeContractEventListeners = function() {
        console.log("🧹 Cleaning up contract event listeners...");
        try {
            if (_oContract && _contractEventListeners.length > 0) {
                // Remove all stored listeners
                _contractEventListeners.forEach(function(listener) {
                    _oContract.off(listener.event, listener.handler);
                });
                _contractEventListeners = [];
                console.log("✅ Contract event listeners cleaned up");
            }
        } catch (error) {
            console.error("❌ Error cleaning up contract listeners:", error);
        }
    };

    this._setupContractEventListeners = function() {
        if (!_oContract) return;
        
        // Clean up existing listeners first
        this._removeContractEventListeners();
        
        try {
            // Round Started Event
            const roundStartedFilter = _oContract.filters.RoundStarted(_sWalletAddress);
            const roundStartedHandler = (roundId, player, level, betAmount, entropySequenceNumber, timestamp) => {
                console.log("🎮 Round started:", {
                    roundId: roundId,
                    level: level,
                    betAmount: betAmount.toString()
                });
                
                _sCurrentRoundId = roundId;
                _bGameActive = true;
                
                // Game'e round started event'i gönder
                window.dispatchEvent(new CustomEvent("contractRoundStarted", {
                    detail: {
                        roundId: roundId,
                        level: level,
                        betAmount: betAmount.toString(),
                        timestamp: timestamp.toString()
                    }
                }));
            };
            _oContract.on(roundStartedFilter, roundStartedHandler);
            _contractEventListeners.push({event: roundStartedFilter, handler: roundStartedHandler});
            
            // Platform Jumped Event
            const platformJumpedFilter = _oContract.filters.PlatformJumped();
            const platformJumpedHandler = (roundId, platform, multiplier, timestamp) => {
                if (roundId === _sCurrentRoundId) {
                    console.log("🚀 Platform jumped:", {
                        platform: platform,
                        multiplier: multiplier.toString()
                    });
                    
                    window.dispatchEvent(new CustomEvent("contractPlatformJumped", {
                        detail: {
                            roundId: roundId,
                            platform: platform,
                            multiplier: multiplier.toString(),
                            timestamp: timestamp.toString()
                        }
                    }));
                }
            };
            _oContract.on(platformJumpedFilter, platformJumpedHandler);
            _contractEventListeners.push({event: platformJumpedFilter, handler: platformJumpedHandler});
            
            // Round Ended Event
            const roundEndedFilter = _oContract.filters.RoundEnded(_sWalletAddress);
            const roundEndedHandler = (roundId, player, level, betAmount, finalPlatform, winAmount, failed, endReason, timestamp) => {
                console.log("🏁 Round ended:", {
                    roundId: roundId,
                    finalPlatform: finalPlatform,
                    winAmount: winAmount.toString(),
                    failed: failed,
                    endReason: endReason
                });
                
                _sCurrentRoundId = null;
                _bGameActive = false;
                
                // Balance'ı güncelle
                this._updateBalance();
                
                window.dispatchEvent(new CustomEvent("contractRoundEnded", {
                    detail: {
                        roundId: roundId,
                        finalPlatform: finalPlatform,
                        winAmount: winAmount.toString(),
                        failed: failed,
                        endReason: endReason,
                        timestamp: timestamp.toString()
                    }
                }));
                
                // Contract round bitme durumunu işaretle - karakter iniş yaptığında kontrol edilecek
                if (failed) {
                    console.log("💀 CONTRACT FAILED - Will check on character landing");
                    _bContractFailed = true; // Contract fail durumunu işaretle
                }
            };
            _oContract.on(roundEndedFilter, roundEndedHandler);
            _contractEventListeners.push({event: roundEndedFilter, handler: roundEndedHandler});
            
            console.log("✅ Contract event listeners set up");
            
        } catch (error) {
            console.error("❌ Contract event listeners setup failed:", error);
        }
    };
    
    this._addEventListeners = function() {
        var self = this;
        
        // Window focus event - disabled due to multiple wallet conflicts
        // window.addEventListener('focus', function() {
        //     self._checkWalletConnection();
        // });
        console.log("⚠️ Window focus wallet check disabled");
        // Account change event - DISABLED due to multiple wallet extension conflicts
        // Privy wallet kendi account management'ini kullanacak
        /*
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', function(accounts) {
                console.log("🔄 Account changed:", accounts);
                if (accounts.length === 0) {
                    self.disconnectWallet();
                } else {
                    self._updateWalletInfo(accounts[0]);
                }
            });
            
            // Chain change event
            window.ethereum.on('chainChanged', function(chainId) {
                console.log("🔄 Chain changed:", chainId);
                self._checkChainId();
            });
        }
        */
        console.log("⚠️ External wallet event listeners disabled - using Privy wallet events only");
    };
    
    this._addPrivyEventListeners = function() {
        var self = this;
        
        // Privy wallet connected event
        // Privy wallet connected event
        window.addEventListener('walletConnected', function(event) {
            console.log("🎉 Privy wallet connected:", event.detail);
            console.log("🔍 Event details:", {
                address: event.detail.address,
                authenticated: event.detail.authenticated,
                balance: event.detail.balance,
                hasAddress: !!event.detail.address,
                isAuthenticated: !!event.detail.authenticated
            });
            
            // Remove emergency fallback to window.ethereum; enforce embedded provider only
            console.log("🛡️ Using embedded provider only; no window.ethereum fallback");
            
            // Check if this is a real embedded wallet (not external)
            if (event.detail.address && event.detail.authenticated) {
                // Prevent duplicate connections
                if (_bConnected && _sWalletAddress === event.detail.address) {
                    console.log("🔄 Wallet already connected, updating balance only");
                    _fBalance = event.detail.balance;
                    
                    // FORCE contract setup even for existing connections
                    console.log("🔄 FORCING contract setup for existing wallet");
                    setTimeout(() => {
                        self._setupContract();
                    }, 500);
                    return;
                }
                
                console.log("✅ Valid embedded wallet detected:", event.detail.address);
                console.log("💰 Balance from event:", event.detail.balance, "MON");
                console.log("🔍 Event balance details:", {
                    balance: event.detail.balance,
                    balanceType: typeof event.detail.balance,
                    balanceValue: event.detail.balance
                });
                self._updateWalletInfo(event.detail.address, event.detail.balance);
                
                // FORCE contract setup immediately
                console.log("🚀 FORCING contract setup for new wallet");
                setTimeout(() => {
                    self._setupContract();
                }, 1000);
                
                // Automatically switch to Monad testnet
                setTimeout(() => {
                    self._switchToMonadNetwork().catch(error => {
                        console.warn("⚠️ Auto Monad network switch failed:", error);
                    });
                }, 1500);
            } else {
                console.log("⚠️ Invalid wallet connection - skipping:", {
                    reason: !event.detail.address ? "No address" : "Not authenticated"
                });
            }
        });
        // Privy wallet disconnected event - TEMPORARILY DISABLED
        // Bu event yanlış tetikleniyor ve bakiyeyi sıfırlıyor
        /*
        window.addEventListener('walletDisconnected', function(event) {
            console.log("🔌 Privy wallet disconnected event received:", event.detail);
            
            // Only disconnect if we have a valid wallet connection
            if (_bConnected && _sWalletAddress) {
                console.log("🔌 Disconnecting wallet:", _sWalletAddress);
                self.disconnectWallet();
            } else {
                console.log("🔌 Wallet already disconnected, ignoring event");
            }
        });
        */
        
        // Profit update event from game
        window.addEventListener('profitUpdate', function(event) {
            console.log("📈 Profit update received:", event.detail.profit);
            _fProfit = event.detail.profit;
            
            // React component'inde profit state'i güncelleniyor
            // DOM manipülasyonu gereksiz, sadece log
            console.log("📈 Profit updated:", _fProfit.toFixed(4), "MON");
        });
    };
    
    this.connectWallet = async function() {
        // Bu fonksiyon artık React Privy tarafından handle ediliyor
        console.log("🔗 Wallet connection is handled by React Privy component");
    };
    this._switchToMonadNetwork = async function() {
        // PREVENT multiple concurrent network switches
        if (this._networkSwitching) {
            console.log("🔄 Network switch already in progress, waiting...");
            return this._networkSwitchPromise;
        }
        
        this._networkSwitching = true;
        this._networkSwitchPromise = this._performNetworkSwitch();
        
        try {
            const result = await this._networkSwitchPromise;
            return result;
        } finally {
            this._networkSwitching = false;
            this._networkSwitchPromise = null;
        }
    };
    
    this._performNetworkSwitch = async function() {
        try {
            // FORCE switch - use ONLY realPrivyProvider
            let provider = null;
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("🚀 SINGLE SWITCH: Using ONLY window.realPrivyProvider");
            } else {
                console.error("❌ CRITICAL: window.realPrivyProvider not available");
                return false;
            }
            
            if (!provider) {
                console.error("❌ CRITICAL: No Privy provider");
                return false;
            }
            
            // Check current network ONCE
            var currentChainId = await provider.request({ method: 'eth_chainId' });
            console.log("🔍 Current:", currentChainId, "Target:", MONAD_CONFIG.chainId);
            
            if (currentChainId === MONAD_CONFIG.chainId) {
                console.log("✅ Already on Monad Testnet!");
                return true;
            }
            
            try {
                // Try to switch
                console.log("🚀 Switching to Monad Testnet...");
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: MONAD_CONFIG.chainId }]
                });
                
                console.log("✅ Network switch SUCCESS");
                return true;
                
            } catch (switchError) {
                console.log("⚠️ Switch failed:", switchError.message);
                
                // If network not found, add it ONCE
                if (switchError.code === 4902) {
                    console.log("➕ Adding Monad Testnet...");
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [MONAD_CONFIG]
                    });
                    
                    console.log("✅ Monad Testnet ADDED - now switching...");
                    
                    // Switch after adding
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: MONAD_CONFIG.chainId }]
                    });
                    
                    console.log("✅ Network switch SUCCESS after adding");
                    return true;
                } else {
                    throw switchError;
                }
            }
            
        } catch (error) {
            console.error("❌ Network switch failed:", error);
            return false;
        }
    };
    
    this._updateWalletInfo = function(address, balance) {
        console.log("📊 _updateWalletInfo called:", {
            address: address,
            balance: balance,
            previousConnected: _bConnected,
            previousAddress: _sWalletAddress
        });
        
        _sWalletAddress = address;
        _bConnected = true;
        
        if (balance !== undefined) {
            _fBalance = balance;
            console.log("💰 Balance set from parameter:", _fBalance, "MON");
            console.log("🔍 Balance details:", {
                balance: balance,
                _fBalance: _fBalance,
                balanceType: typeof balance,
                _fBalanceType: typeof _fBalance
            });
        } else {
            console.log("⚠️ Balance parameter undefined, will fetch from network");
        }
        
        console.log("📊 Wallet info updated:", {
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            _fBalance: _fBalance
        });
        
        // Dispatch walletConnected event for LeaderboardManager
        const walletConnectedEvent = new CustomEvent('walletConnected', {
            detail: {
                address: _sWalletAddress,
                balance: _fBalance
            }
        });
        window.dispatchEvent(walletConnectedEvent);
        console.log("📢 walletConnected event dispatched:", {
            address: _sWalletAddress,
            balance: _fBalance
        });
        
        // Also try to set directly on LeaderboardManager as fallback
        if (window.s_oLeaderboardManager && window.s_oLeaderboardManager.setPlayerAddress) {
            window.s_oLeaderboardManager.setPlayerAddress(_sWalletAddress);
            console.log("📢 Direct setPlayerAddress called on LeaderboardManager:", _sWalletAddress);
        }
        
        // Monad testnet'e geç
        this._switchToMonadNetwork().then(() => {
            // Contract'ı setup et
            this._setupContract();
        }).catch(error => {
            console.warn("⚠️ Monad network switch failed:", error);
        });
        
        // UI'yi güncelle
        this._updateUI();
        
        // Balance'ı güncelle (eğer balance parametresi verilmemişse)
        if (balance === undefined) {
            this._updateBalance();
        }
        
        console.log("📊 Wallet info updated:", address, "MON Balance:", _fBalance);
    };
    
    this._updateUI = function() {
        // UI artık React Privy component tarafından handle ediliyor
        // Bu fonksiyon sadece game logic için gerekli
        console.log("📱 UI is handled by React Privy component");
    };
    
    this._shortenAddress = function(address) {
        if (!address) return '0x0000...0000';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    };
    
    this._updateBalance = async function() {
        if (!_bConnected || !_sWalletAddress) {
            console.log("⚠️ Cannot update balance - not connected or no address");
            return;
        }
        
        try {
            console.log("💰 ENHANCED: FORCE Monad Testnet balance check for:", _sWalletAddress);
            
            // Smart provider detection - same as other methods
            let provider = null;
            
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("🔧 Using ONLY window.realPrivyProvider for balance update");
            } else {
                console.error("❌ window.realPrivyProvider not available for balance update - external wallets disabled");
                console.log("🔍 Debug info:", {
                    windowRealPrivyProvider: !!window.realPrivyProvider,
                    windowEthereum: !!window.ethereum,
                    connected: _bConnected,
                    address: _sWalletAddress
                });
                return;
            }
            
            if (!provider) {
                console.error("❌ No provider available for balance update");
                return;
            }
            
            // CRITICAL FIX: FORCE network to Monad testnet FIRST
            try {
                console.log("🚀 FORCING network to Monad Testnet for balance check...");
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: MONAD_CONFIG.chainId }]
                });
                console.log("✅ Successfully switched to Monad for balance check");
                
                // Wait for network switch to propagate
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (switchError) {
                console.log("⚠️ Network switch for balance failed, trying to add network:", switchError.message);
                
                // Add network if not exists
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [MONAD_CONFIG]
                    });
                    console.log("✅ Monad network added successfully");
                    
                    // Switch after adding
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: MONAD_CONFIG.chainId }]
                    });
                    console.log("✅ Switched to Monad after adding");
                    
                    // Wait for network switch to propagate
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (addError) {
                    console.error("❌ Failed to add/switch Monad network:", addError);
                    return;
                }
            }
            
            // Verify we're on correct network
            const currentChain = await provider.request({ method: 'eth_chainId' });
            console.log("🔍 Current network for balance check:", currentChain, "Expected:", MONAD_CONFIG.chainId);
            
            if (currentChain !== MONAD_CONFIG.chainId) {
                console.error("❌ Still not on Monad testnet, cannot get accurate balance");
                console.error("❌ Current:", currentChain, "Expected:", MONAD_CONFIG.chainId);
                return;
            }
            
            // MON balance'ı al (now guaranteed to be on Monad testnet)
            var balance = await provider.request({
                method: 'eth_getBalance',
                params: [_sWalletAddress, 'latest']
            });
            
            console.log("💰 Raw balance on MONAD TESTNET:", balance, "for address:", _sWalletAddress);
            
            // Wei'den MON'a çevir
            _fBalance = parseInt(balance, 16) / Math.pow(10, 18);
            
            // UI'yi güncelle - multiple elements
            var balanceElement = document.getElementById('mon-balance');
            if (balanceElement) {
                balanceElement.textContent = _fBalance.toFixed(4) + ' MON';
                console.log("✅ Updated #mon-balance element");
            }
            
            // Also update React component balance via event
            window.dispatchEvent(new CustomEvent("balanceUpdate", {
                detail: { 
                    balance: _fBalance,
                    address: _sWalletAddress,
                    network: 'monad-testnet'
                }
            }));
            
            console.log("✅ MON Balance updated on MONAD TESTNET:", _fBalance.toFixed(4), "MON");
            
        } catch (error) {
            console.error("❌ MON Balance update failed:", error);
            console.error("❌ Error details:", {
                connected: _bConnected,
                address: _sWalletAddress,
                realPrivyProvider: !!window.realPrivyProvider,
                ethereum: !!window.ethereum,
                errorMessage: error.message,
                errorStack: error.stack
            });
        }
    };
    this._startBalanceUpdate = function() {
        // Balance güncelleme artık React component tarafından handle ediliyor
        console.log("💰 Balance updates are handled by React Privy component");
    };
    
    this._checkWalletConnection = function() {
        // External wallet connection check disabled
        // Sadece Privy wallet event'lerini kullanıyoruz
        console.log("⚠️ External wallet connection check disabled - using Privy events only");
    };
    
    this._checkChainId = function() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_chainId' })
                .then(chainId => {
                    console.log("🔍 Current chain ID:", chainId, "Expected:", MONAD_CONFIG.chainId);
                    if (chainId !== MONAD_CONFIG.chainId) {
                        console.log("⚠️ Wrong network detected. Please switch to Monad Testnet.");
                        this._showError("Please switch to Monad Testnet in your wallet.");
                    } else {
                        console.log("✅ Correct network (Monad Testnet) detected");
                    }
                })
                .catch(error => {
                    console.error("❌ Chain ID check failed:", error);
                });
        }
    };
    
    this.disconnectWallet = function() {
        _bConnected = false;
        _sWalletAddress = null;
        _fBalance = 0;
        
        // Profit'ı sıfırla
        this.updateProfit(0);
        
        console.log("🔌 Wallet disconnected");
    };
    
    this.updateProfit = function(profit) {
        _fProfit = profit;
        
        // React component'ine profit güncellemesi gönder
        window.dispatchEvent(new CustomEvent("profitUpdate", {
            detail: { profit: _fProfit }
        }));
        
        console.log("📈 Profit updated:", _fProfit.toFixed(4), "MON");
    };
    
    this._showError = function(message) {
        console.error("❌ Wallet Error:", message);
        
        // Basit alert göster (gelecekte daha güzel bir modal yapılabilir)
        if (window.errorLogger) {
            window.errorLogger.showErrorToUser(message);
        } else {
            alert("Wallet Error: " + message);
        }
    };
    
    // Public getter methods (moved to better location later)
    
    this.getAddress = function() {
        return _sWalletAddress;
    };
    
    // Clear game state (called when game ends/fails)
    this.clearGameState = function() {
        console.log("🧹 Clearing WalletManager game state...");
        _bGameActive = false;
        _sCurrentRoundId = null;
        _bContractFailed = false; // Contract fail durumunu temizle
        
        // Clear any pending timeout checker
        if (this._timeoutChecker) {
            clearTimeout(this._timeoutChecker);
            this._timeoutChecker = null;
        }
        
        // Clear any pending VRF checker
        if (this._vrfChecker) {
            clearInterval(this._vrfChecker);
            this._vrfChecker = null;
            console.log("🎲 VRF checker cleared");
        }
        
        console.log("✅ Game state cleared - ready for new game");
    };
    
    // NEW: Wait for VRF (Pyth Entropy) to be ready before allowing jumps
    this._waitForVRFReady = async function(roundId) {
        console.log("🎲 Waiting for VRF to be ready for round:", roundId);
        
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait
        
        _vrfChecker = setInterval(async () => {
            attempts++;
            try {
                        const contract = _oContract;
                if (!contract) {
                    console.log("⚠️ Contract not available for VRF check");
                    return;
                }
                
                // Check if VRF is ready via getPlayerRoundInfo
                const roundInfo = await contract.getPlayerRoundInfo(_sWalletAddress);
                const vrfReady = roundInfo.vrfReady;
                
                console.log(`🎲 VRF Check ${attempts}/${maxAttempts} - Ready: ${vrfReady}`);
                
                if (vrfReady) {
                    console.log("✅ VRF is ready! Players can now jump.");
                    _bVRFReady = true; // VRF hazır olduğunu işaretle
                    clearInterval(_vrfChecker);
                    _vrfChecker = null;
                    
                    // Notify game that VRF is ready
                    if (window.s_oGame && window.s_oGame.onVRFReady) {
                        window.s_oGame.onVRFReady();
                    }
                    
                    // Dispatch VRF ready event
                    window.dispatchEvent(new CustomEvent("vrfReady", {
                        detail: {
                            roundId: _sCurrentRoundId,
                            ready: true
                        }
                    }));
                    
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error("❌ VRF not ready after 60 seconds - something may be wrong");
                    clearInterval(_vrfChecker);
                    _vrfChecker = null;
                    
                    // Show warning to user
                    if (window.s_oGame && window.s_oGame._showGameNotification) {
                        window.s_oGame._showGameNotification(
                            "⚠️ Network Delay", 
                            "Randomness provider is slow. You may experience delays with jumps.", 
                            "warning"
                        );
                    }
                }
                
            } catch (error) {
                console.log("⚠️ VRF check error:", error.message);
                
                if (attempts >= maxAttempts) {
                    clearInterval(_vrfChecker);
                    _vrfChecker = null;
                }
            }
        }, 1000); // Check every second
    };
    
    // End round on contract (when player fails)
    this.endRoundOnFail = async function(roundId) {
        try {
            // Use provided roundId or fallback to current round ID
            const targetRoundId = roundId || _sCurrentRoundId;
            
            if (!_bConnected || !targetRoundId) {
                console.warn("⚠️ Cannot end round - not connected or no round ID");
                return { success: false, error: "Not connected or no active round" };
            }
            
            console.log("💀 Sending endRound transaction after fail for round:", targetRoundId);
            
            // Get provider
            const provider = window.realPrivyProvider;
            if (!provider) {
                throw new Error("Privy provider not available");
            }
            
            // Get current nonce
            const nonce = await provider.request({
                method: 'eth_getTransactionCount',
                params: [_sWalletAddress, 'pending']
            });
            
            // Encode function data for endRoundOnFail(bytes32 roundId)
            const functionSignature = "endRoundOnFail(bytes32)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
            const encodedRoundId = ethers.utils.defaultAbiCoder.encode(['bytes32'], [targetRoundId]);
            const transactionData = functionSelector + encodedRoundId.slice(2);
            
            console.log("🔍 EndRoundOnFail function signature:", functionSignature);
            console.log("🔍 EndRoundOnFail function selector:", functionSelector);
            console.log("🔍 Round ID to end:", targetRoundId);
            
            const txParams = {
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                value: '0x0', // No value needed
                gas: ethers.utils.hexlify(250000), // Standard gas limit
                maxFeePerGas: ethers.utils.hexlify(ethers.utils.parseUnits('54', 'gwei')),
                maxPriorityFeePerGas: ethers.utils.hexlify(ethers.utils.parseUnits('8', 'gwei')),
                nonce: nonce
            };
            
            console.log("🚀 Sending endRound transaction...");
            
            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            });
            
            console.log("✅ EndRound transaction sent:", txHash);
            
            // Clear game state after sending transaction
            this.clearGameState();
            
            return {
                success: true,
                txHash: txHash
            };
            
        } catch (error) {
            console.error("❌ EndRound transaction failed:", error);
            // Still clear game state even if transaction fails
            this.clearGameState();
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    this.getBalance = function() {
        return _fBalance;
    };
    
    // Start timeout checker for 5-minute inactivity
    this._startTimeoutChecker = function() {
        console.log("⏰ Starting 5-minute timeout checker...");
        
        // Clear any existing checker
        if (this._timeoutChecker) {
            clearTimeout(this._timeoutChecker);
        }
        
        // Set 5-minute (300 seconds) timeout
        this._timeoutChecker = setTimeout(async () => {
            try {
                console.log("⏰ 5-minute timeout reached - checking if round needs recovery...");
                
                if (!_bGameActive || !_sCurrentRoundId) {
                    console.log("✅ No active round - timeout checker not needed");
                    return;
                }
                
                // Check if round is still active in contract
                const hasActive = await _oContract.hasActiveRound(_sWalletAddress);
                
                if (hasActive) {
                    console.log("🚨 Round timed out - ending round automatically...");
                    
                    // Show timeout notification to user
                    if (s_oGame && s_oGame._showGameNotification) {
                        s_oGame._showGameNotification(
                            "⏰ Round Timeout", 
                            "Your round timed out. Round will be ended automatically.", 
                            "warning"
                        );
                    }
                    
                    // End round automatically due to timeout (no recovery needed)
                    try {
                        const endResult = await this.endTimedOutRound();
                        if (endResult.success) {
                            console.log("✅ Round ended due to timeout");
                            if (s_oGame && s_oGame._showGameNotification) {
                                s_oGame._showGameNotification(
                                    "✅ Round Ended", 
                                    "Round ended due to timeout. You can start a new game.", 
                                    "success"
                                );
                            }
                        } else {
                            console.error("❌ Failed to end timed out round:", endResult.error);
                        }
                    } catch (error) {
                        console.error("❌ Error ending timed out round:", error);
                    }
                } else {
                    console.log("✅ Round already ended - no timeout recovery needed");
                    this.clearGameState();
                }
                
            } catch (error) {
                console.error("❌ Timeout checker error:", error.message);
            }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
        
        console.log("✅ Timeout checker set for 5 minutes");
    };
    
    // Immediate cashout for active rounds (for resume scenarios)
    this.immediateRecovery = async function() {
        try {
            console.log("🚀 Attempting immediate recovery via cashout (works anytime)...");
            
            if (!_bConnected || !_sWalletAddress) {
                throw new Error("Wallet not connected");
            }
            
            // Try cashout - this works anytime (no 5-minute wait required)
            try {
                console.log("💰 Trying immediate cashout (available anytime)...");
                const cashoutResult = await this.cashOut();
                
                if (cashoutResult.success) {
                    console.log("✅ Immediate cashout successful - no waiting required!");
                    return {
                        success: true,
                        method: 'cashout',
                        txHash: cashoutResult.txHash,
                        message: "Successfully cashed out your current position (no wait time)"
                    };
                }
            } catch (cashoutError) {
                console.log("⚠️ Cashout failed:", cashoutError.message);
                
                // If cashout fails, inform user they need to wait for timeout
                return {
                    success: false,
                    error: "Cannot cashout or recover immediately. Please wait 5 minutes for timeout recovery.",
                    needsTimeout: true
                };
            }
            
        } catch (error) {
            console.error("❌ Immediate recovery failed:", error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    this.isConnected = function() {
        return _bConnected && _sWalletAddress !== null;
    };
    
    /**
     * Get current wallet address
     */
    this.getWalletAddress = function() {
        return _sWalletAddress;
    };
    
    this.hasEmbeddedWallet = function() {
        // Check if we have an embedded wallet (not external)
        var hasWallet = _bConnected && _sWalletAddress !== null && _sWalletAddress.length > 0;
        console.log("🔍 hasEmbeddedWallet check:", {
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            addressLength: _sWalletAddress ? _sWalletAddress.length : 0,
            result: hasWallet
        });
        return hasWallet;
    };
    
    this.getProfit = function() {
        return _fProfit;
    };
    
    this.getChainId = function() {
        return _iChainId;
    };
    
    // Game integration methods
    this.canPlaceBet = function(betAmount) {
        console.log("🔍 canPlaceBet called:", {
            _fBalance: _fBalance,
            betAmount: betAmount,
            _bConnected: _bConnected,
            _sWalletAddress: _sWalletAddress,
            balanceType: typeof _fBalance,
            balanceValue: _fBalance
        });
        
        // Sadece bakiye kontrolü yap (minimum 1 MON)
        if (_fBalance < betAmount) {
            console.log("❌ Insufficient balance:", _fBalance, "MON, needed:", betAmount, "MON");
            console.log("🔍 Balance check details:", {
                balance: _fBalance,
                betAmount: betAmount,
                comparison: _fBalance + " < " + betAmount + " = " + (_fBalance < betAmount)
            });
            return false;
        }
        
        console.log("✅ Sufficient balance:", _fBalance, "MON, bet amount:", betAmount, "MON");
        return true;
    };
    
    this.processWin = function(amount) {
        this.updateProfit(_fProfit + amount);
        console.log("🎉 Win processed:", amount.toFixed(4), "MON");
    };
    
    this.processLoss = function(amount) {
        this.updateProfit(_fProfit - amount);
        console.log("💸 Loss processed:", amount.toFixed(4), "MON");
    };
    
    this.startRound = async function(level, betAmountMON) {
        try {
            if (!_bConnected) {
                throw new Error("Wallet not connected");
            }
            
            if (!_sWalletAddress) {
                throw new Error("Wallet address not available");
            }
            
            if (_bGameActive) {
                throw new Error("Game already active, cannot start new round");
            }
            
            // CRITICAL FIX: Convert level to correct contract values
            // Contract mapping: 0=easy, 1=hard (direct mapping, no correction needed)
            let contractLevel = level;
            console.log("🎯 Using contract level:", contractLevel, contractLevel === 0 ? "(easy mode)" : "(hard mode)");
            console.log("📊 Expected max multiplier:", contractLevel === 0 ? "7.19x" : "34.30x");
            
            // DEBUG: Check treasury and exposure limits before bet
            try {
                console.log("🔍 Checking treasury status before bet...");
                const treasuryInfo = await _oContract.getTreasuryInfo();
                console.log("📊 Treasury Status:");
                console.log("   Balance:", ethers.utils.formatEther(treasuryInfo[0]), "MON");
                console.log("   Current Exposure:", ethers.utils.formatEther(treasuryInfo[1]), "MON");
                console.log("   Exposure Limit:", ethers.utils.formatEther(treasuryInfo[2]), "MON");
                
                // Calculate what this bet would add to exposure
                const maxWin = contractLevel === 0 ? 
                    (BigInt(betAmountMON * 1e18) * BigInt(719)) / BigInt(100) :  // Easy: 7.19x max
                    (BigInt(betAmountMON * 1e18) * BigInt(3430)) / BigInt(100);  // Hard: 34.30x max
                const betWei = BigInt(betAmountMON * 1e18);
                const worstCaseNet = maxWin > betWei ? maxWin - betWei : BigInt(0);
                console.log("💰 This bet exposure:", ethers.utils.formatEther(worstCaseNet), "MON");
                console.log("🔍 Total after bet:", ethers.utils.formatEther(treasuryInfo[1] + worstCaseNet), "MON");
                console.log("🚨 Would exceed limit:", (treasuryInfo[1] + worstCaseNet > treasuryInfo[2]));
                
                if (treasuryInfo[1] + worstCaseNet > treasuryInfo[2]) {
                    console.error("❌ EXPOSURE LIMIT EXCEEDED PREDICTION!");
                    console.error("   Need treasury with at least:", ethers.utils.formatEther((treasuryInfo[1] + worstCaseNet) * BigInt(100) / BigInt(15)), "MON");
                }
            } catch (infoError) {
                console.log("ℹ️ Could not fetch treasury info:", infoError.message);
            }
            
            console.log("🎮 Starting round with AUTOMATIC transaction:", {
                originalLevel: level,
                contractLevel: contractLevel,
                betAmount: betAmountMON
            });
            
            // Get real Privy provider for automatic signing
            let provider = null;
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("✅ Using window.realPrivyProvider for automatic transaction");
            } else {
                console.error("❌ window.realPrivyProvider not available for automatic transaction");
                throw new Error("Privy provider not available");
            }
            
            // CRITICAL: First get Pyth Entropy fee from wallet contract instance
            console.log("🔍 Getting Pyth Entropy fee from wallet contract...");
            let entropyFee;
            try {
                // Get entropy fee from wallet's contract instance
                if (_oContract && _oContract.getEntropyFee) {
                    entropyFee = await _oContract.getEntropyFee();
                    console.log("✅ Pyth Entropy fee from wallet contract:", entropyFee.toString(), "wei");
                } else {
                    throw new Error("Wallet contract getEntropyFee not available");
                }
            } catch (feeError) {
                console.log("❌ Failed to get entropy fee from wallet contract:", feeError?.message || feeError);
                // Fallback: Use higher fee of 0.05 MON to ensure we pass validation
                entropyFee = ethers.utils.parseEther("0.05");
                console.log("⚠️ Using fallback entropy fee (0.05 MON):", entropyFee.toString(), "wei");
            }
            
            // Convert user's bet amount to Wei
            const betAmountWei = ethers.utils.parseEther(betAmountMON.toString());
            console.log("💰 User bet amount in Wei:", betAmountWei.toString());
            
            // Total value = bet amount + entropy fee
            const totalValueWei = betAmountWei.add(entropyFee);
            console.log("💰 Total value (bet + entropy fee) in Wei:", totalValueWei.toString());
            console.log("🔍 Breakdown: Bet =", betAmountWei.toString(), "Fee =", entropyFee.toString());
            console.log("🎯 Contract level parameter:", contractLevel);
            
            // Get current nonce - use Privy address with direct RPC call
            if (!_sWalletAddress) {
                throw new Error("Wallet address not available for nonce check");
            }
            
            // Try to get nonce directly from Privy's RPC (bypass Chrome extensions)
            let nonce;
            try {
                console.log("🔢 Getting nonce from Privy RPC...");
                nonce = await provider.request({
                    method: 'eth_getTransactionCount',
                    params: [_sWalletAddress, 'latest']
                });
                console.log("✅ Nonce from Privy RPC:", parseInt(nonce, 16));
            } catch (error) {
                console.log("❌ Privy RPC failed, trying alternative approach:", error.message);
                
                // Alternative: Use ethers.js to get nonce directly
                try {
                    console.log("🔢 Getting nonce with ethers.js...");
                    const ethersProvider = new ethers.providers.Web3Provider(provider);
                    nonce = await ethersProvider.getTransactionCount(_sWalletAddress);
                    console.log("✅ Nonce from ethers.js:", nonce);
                    // Convert to hex for consistency
                    nonce = '0x' + nonce.toString(16);
                } catch (error2) {
                    console.log("❌ Ethers.js also failed:", error2.message);
                    throw new Error("Unable to get nonce from any source");
                }
            }
            
            console.log("🔢 Current nonce:", parseInt(nonce, 16));
            
            // Encode function data for startRound
            // Get function selector safely
            const startRoundFunction = window.CHOG_CROSS_CONTRACT.abi.find(f => f.name === 'startRound');
            if (!startRoundFunction) {
                throw new Error("startRound function not found in contract ABI");
            }
            
            // Calculate function selector manually using ethers.js
            const functionSignature = "startRound(uint8)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
            console.log("🔍 Function signature:", functionSignature);
            console.log("🔍 Function selector:", functionSelector);
            
            // Encode function parameters
            const functionData = ethers.utils.defaultAbiCoder.encode(
                ['uint8'],
                [contractLevel]
            );
            console.log("📦 Function data:", functionData);
            
            // Create transaction data - fix hexConcat issue
            const transactionData = functionSelector + functionData.slice(2); // Remove 0x prefix from functionData
            console.log("📦 Final transaction data:", transactionData);
            
            // Use stored Privy address directly - don't rely on eth_accounts
            const privyAddress = _sWalletAddress;
            console.log("🔍 Stored Privy embedded wallet address:", privyAddress);
            
            // Validate Privy address
            if (!privyAddress) {
                throw new Error("Privy embedded wallet address not available");
            }
            
            // Verify address format
            if (!privyAddress.startsWith('0x') || privyAddress.length !== 42) {
                throw new Error("Invalid Privy wallet address format");
            }
            
            console.log("✅ Using stored Privy embedded wallet address:", privyAddress);
            // LOCAL NONCE PATH: Use unified signer + raw send helper
            console.log("🚀 Sending startRound via local-nonce sendSignedTx...");
            const gas = ethers.utils.hexlify(500000);
            const maxFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('54', 'gwei'));
            const maxPriorityFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('8', 'gwei'));
            const sendRes = await this.sendSignedTx({
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                gas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                value: ethers.utils.hexlify(totalValueWei)
            });
            if (!sendRes.success) throw new Error(sendRes.error || 'sendSignedTx failed');
            const hash = sendRes.txHash;
            // Toast notification removed - only transaction progress shown
            _bGameActive = true;

            try {
                const self = this;
                setTimeout(async () => {
                    try {
                        const actualRoundId = await self.fetchActualRoundId();
                        if (actualRoundId) {
                            console.log("✅ Round ID fetched after transaction:", actualRoundId);
                            _sCurrentRoundId = actualRoundId;
                            _bVRFReady = false;
                            self._waitForVRFReady(actualRoundId);
                            self._startTimeoutChecker();
                        }
                    } catch (e) {
                        console.warn("⚠️ Could not fetch round ID after local-nonce path:", e?.message || e);
                    }
                }, 3000);
            } catch (_) {}

            return { success: true, txHash: hash, roundId: _sCurrentRoundId };
            
            // PRIMARY: Use Privy provider.request with minimal params (no from/fees/nonce)
            try {
                console.log("🔐 Primary attempt: provider.request with MINIMAL params (no from/fees/nonce)...");
                const minimal = {
                    to: txParams.to,
                    data: txParams.data,
                    value: txParams.value
                };
                console.log("🔍 Minimal tx params:", minimal);
                txHash = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [minimal]
                });
                console.log("✅ Sent with minimal eth_sendTransaction:", txHash);
            } catch (primaryErr) {
                console.log("❌ Minimal eth_sendTransaction failed:", primaryErr?.message || primaryErr);
            }

            if (txHash) {
                // continue to receipt handling below
            } else {
            // Method 1: Try sendTransaction (Privy's own method)
            try {
                console.log("🔐 Trying Privy sendTransaction...");
                txHash = await provider.sendTransaction(txParams);
                console.log("✅ Transaction sent with sendTransaction:", txHash);
            } catch (error) {
                console.log("❌ sendTransaction failed:", error.message);
                
                // Method 2: Try using ethers.js with Privy provider (bypass Chrome extensions)
                try {
                    console.log("🔐 Trying ethers.js with Privy provider...");
                    const ethersProvider = new ethers.providers.Web3Provider(provider);
                    const signer = ethersProvider.getSigner();
                    
                    // Create transaction object for ethers.js
                    const ethersTx = {
                        to: txParams.to,
                        data: txParams.data,
                        value: txParams.value,
                        gasLimit: txParams.gas,
                        maxFeePerGas: txParams.maxFeePerGas,
                        maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
                        nonce: txParams.nonce
                    };
                    
                    console.log("🔍 Ethers.js transaction object:", ethersTx);
                    
                    // Try to send transaction with automatic signing (no user approval)
                    console.log("🔐 Attempting automatic transaction with ethers.js...");
                    txHash = await signer.sendTransaction(ethersTx);
                    console.log("✅ Transaction sent with ethers.js:", txHash.hash);
                    txHash = txHash.hash; // Extract hash for consistency
                } catch (error2) {
                    console.log("❌ Ethers.js failed:", error2.message);
                    
                    // Method 2.5: Try using Privy's internal RPC directly (bypass Chrome extensions)
                    try {
                        console.log("🔐 Trying Privy's internal RPC directly...");
                        
                        // Use Privy's internal RPC endpoint directly
                        const privyRpcUrl = "https://auth.privy.io/api/v1/chains/ethereum/rpc";
                        
                        // Prepare transaction for direct RPC call
                        const rpcTxParams = {
                            to: txParams.to,
                            data: txParams.data,
                            value: txParams.value,
                            gas: txParams.gas,
                            maxFeePerGas: txParams.maxFeePerGas,
                            maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
                            nonce: txParams.nonce
                        };
                        
                        console.log("🔍 RPC transaction parameters:", rpcTxParams);
                        
                        // Make direct RPC call to Privy's internal endpoint
                        const rpcResponse = await fetch(privyRpcUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${provider._privyToken || 'anonymous'}`
                            },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'eth_sendTransaction',
                                params: [rpcTxParams],
                                id: 1
                            })
                        });
                        
                        const rpcResult = await rpcResponse.json();
                        console.log("🔍 RPC response:", rpcResult);
                        
                        if (rpcResult.result) {
                            txHash = rpcResult.result;
                            console.log("✅ Transaction sent via Privy RPC:", txHash);
                        } else {
                            throw new Error(rpcResult.error?.message || "RPC call failed");
                        }
                    } catch (error2_5) {
                        console.log("❌ Privy RPC direct call failed:", error2_5.message);
                        
                        // Method 2.6: Try using provider's internal methods
                        try {
                            console.log("🔐 Trying provider's internal methods...");
                            
                            // Check all available methods on provider
                            console.log("🔍 All provider methods:", Object.getOwnPropertyNames(provider));
                            console.log("🔍 Provider prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(provider)));
                            console.log("🔍 Provider keys:", Object.keys(provider));
                            
                            // Try different internal method approaches
                            let txHashFound = false;
                            
        // Session signer removed - using direct transaction mode
        if (!window.privyWallet) {
            console.log("⏳ Waiting for Privy wallet to be ready...");
            throw new Error("privy_wallet_not_ready");
        }

        // Method 2.6.1: Try Privy embedded wallet provider approach (2048-frontend method)
                            console.log("🔍 Checking for Privy embedded wallet provider approach...");
                            console.log("🔍 window.privyWallet exists:", !!window.privyWallet);
                            console.log("🔍 window.privyWallet.signTransaction exists:", !!window.privyWallet?.signTransaction);
                            console.log("🔍 window.privyWallet.getEthereumProvider exists:", !!window.privyWallet?.getEthereumProvider);
                            console.log("🔍 window.privyWallet details:", window.privyWallet);
                            console.log("🔍 All window properties containing 'privy':", Object.keys(window).filter(key => key.toLowerCase().includes('privy')));
                            
                            if (window.privyWallet && !txHashFound) {
                                try {
                                    console.log("🔍 Using window.privyWallet for transaction (eth_sendTransaction)...");
                                    const embeddedProvider = await window.privyWallet.getEthereumProvider();
                                    const txMinimal = {
                                        from: _sWalletAddress,
                                        to: txParams.to,
                                        data: txParams.data,
                                        value: txParams.value,
                                        chainId: '0x279f'
                                    };
                                    console.log("🔍 Embedded provider minimal params:", txMinimal);
                                    txHash = await embeddedProvider.request({
                                        method: 'eth_sendTransaction',
                                        params: [txMinimal]
                                    });
                                    console.log("✅ Transaction sent via embedded provider eth_sendTransaction:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ window.privyWallet embedded provider path failed:", e.message);
                                    console.log("❌ error:", e);
                                }
                            } else {
                                console.log("❌ window.privyWallet not available");
                                // Direct VIEM fallback using realPrivyProvider (no React bridge)
                                try {
                                    if (window.viemCreateWalletClient && window.viemCustomTransport && window.realPrivyProvider) {
                                        console.log("🔍 Using direct VIEM fallback with realPrivyProvider...");
                                        const createWalletClient = window.viemCreateWalletClient;
                                        const custom = window.viemCustomTransport;
                                        const provider1193 = window.realPrivyProvider;

                                        // Minimal chain object for Monad testnet
                                        const monadChain = { id: 10143, name: 'monad-testnet' };

                                        const walletClient = createWalletClient({
                                            chain: monadChain,
                                            transport: custom(provider1193)
                                        });

                                        const privyAddress = window.localStorage.getItem('privyEmbeddedWalletAddress') || _sWalletAddress;
                                        
                                        const viemTxParams = {
                                            to: txParams.to,
                                            account: privyAddress,
                                            data: txParams.data,
                                            nonce: parseInt(txParams.nonce, 16),
                                            gas: BigInt(txParams.gas),
                                            maxFeePerGas: BigInt(txParams.maxFeePerGas),
                                            maxPriorityFeePerGas: BigInt(txParams.maxPriorityFeePerGas),
                                            value: BigInt(txParams.value)
                                        };

                                        console.log("🔍 Direct VIEM tx params:", viemTxParams);
                                        const signedTx = await walletClient.signTransaction(viemTxParams);
                                        console.log("✅ Direct VIEM signed tx:", signedTx);

                                        const rpcResponse = await fetch('https://testnet-rpc.monad.xyz', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                jsonrpc: '2.0',
                                                method: 'eth_sendRawTransaction',
                                                params: [signedTx],
                                                id: 1
                                            })
                                        });
                                        const rpcResult = await rpcResponse.json();
                                        console.log("🔍 Direct VIEM RPC response:", rpcResult);
                                        if (rpcResult.result) {
                                            txHash = rpcResult.result;
                                            console.log("✅ Transaction sent via direct VIEM fallback:", txHash);
                                            txHashFound = true;
                                        } else {
                                            throw new Error(rpcResult.error?.message || 'RPC sendRaw failed');
                                        }
                                    } else {
                                        console.log("❌ VIEM globals or realPrivyProvider missing for direct fallback");
                                    }
                                } catch (viemDirectErr) {
                                    console.log("❌ Direct VIEM fallback failed:", viemDirectErr.message);
                                }
                            }
                            
                            // Method 2.6.2: Try request (Privy's main method) with from parameter
                            if (provider.request && !txHashFound) {
                                try {
                                    console.log("🔍 Using provider.request method (Privy's main method)...");
                                    
                                    // Add from parameter to transaction
                                    const txParamsWithFrom = {
                                        ...txParams,
                                        from: _sWalletAddress
                                    };
                                    
                                    console.log("🔍 Request parameters:", {
                                        method: 'eth_sendTransaction',
                                        params: [txParamsWithFrom]
                                    });
                                    console.log("🔍 Transaction with from parameter:", txParamsWithFrom);
                                    
                                    txHash = await provider.request({
                                        method: 'eth_sendTransaction',
                                        params: [txParamsWithFrom]
                                    });
                                    console.log("✅ Transaction sent via request:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ request failed:", e.message);
                                    console.log("❌ request error details:", e);
                                    console.log("❌ request error code:", e.code);
                                    console.log("❌ request error data:", e.data);
                                }
                            }
                            
                            // Method 2.6.2: Try _request
                            if (provider._request && !txHashFound) {
                                try {
                                    console.log("🔍 Using provider._request method...");
                                    txHash = await provider._request({
                                        method: 'eth_sendTransaction',
                                        params: [txParams]
                                    });
                                    console.log("✅ Transaction sent via _request:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ _request failed:", e.message);
                                }
                            }
                            
                            // Method 2.6.2: Try requestInternalMethods
                            if (provider.requestInternalMethods && !txHashFound) {
                                try {
                                    console.log("🔍 Using provider.requestInternalMethods...");
                                    txHash = await provider.requestInternalMethods({
                                        method: 'eth_sendTransaction',
                                        params: [txParams]
                                    });
                                    console.log("✅ Transaction sent via requestInternalMethods:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ requestInternalMethods failed:", e.message);
                                }
                            }
                            
                            // Method 2.6.3: Try sendAsync
                            if (provider.sendAsync && !txHashFound) {
                                try {
                                    console.log("🔍 Using provider.sendAsync...");
                                    txHash = await new Promise((resolve, reject) => {
                                        provider.sendAsync({
                                            method: 'eth_sendTransaction',
                                            params: [txParams]
                                        }, (error, result) => {
                                            if (error) reject(error);
                                            else resolve(result.result);
                                        });
                                    });
                                    console.log("✅ Transaction sent via sendAsync:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ sendAsync failed:", e.message);
                                }
                            }
                            
                            // Method 2.6.4: Try send
                            if (provider.send && !txHashFound) {
                                try {
                                    console.log("🔍 Using provider.send...");
                                    txHash = await new Promise((resolve, reject) => {
                                        provider.send({
                                            method: 'eth_sendTransaction',
                                            params: [txParams]
                                        }, (error, result) => {
                                            if (error) reject(error);
                                            else resolve(result.result);
                                        });
                                    });
                                    console.log("✅ Transaction sent via send:", txHash);
                                    txHashFound = true;
                                } catch (e) {
                                    console.log("❌ send failed:", e.message);
                                }
                            }
                            
                            if (!txHashFound) {
                                throw new Error("No internal methods available");
                            }
                        } catch (error2_6) {
                            console.log("❌ Provider internal methods failed:", error2_6.message);
                            throw error2_6; // Re-throw to continue to Method 3
                        }
                    }
                    
                    // Method 3: Try eth_sendTransaction without from parameter (let Privy handle it)
                    try {
                        console.log("🔐 Trying eth_sendTransaction without from parameter...");
                        const txParamsWithoutFrom = {
                            to: txParams.to,
                            data: txParams.data,
                            value: txParams.value
                            // No gas/fees/nonce/from: let Privy fill entirely
                        };
                        txHash = await provider.request({
                            method: 'eth_sendTransaction',
                            params: [txParamsWithoutFrom]
                        });
                        console.log("✅ Transaction sent with eth_sendTransaction:", txHash);
                    } catch (error3) {
                        console.log("❌ eth_sendTransaction failed:", error3.message);
                        throw error3; // Re-throw the last error
                    }
                }
            }
            }
            
            console.log("📤 Transaction sent automatically:", txHash);
            
            // Return immediately for faster UX (don't wait for confirmation)
            _bGameActive = true;
            _sCurrentRoundId = txHash; // Use tx hash as round ID for now
            console.log("✅ Round started successfully:", txHash);
            
            return {
                success: true,
                txHash: txHash,
                roundId: txHash // Use tx hash as round ID for now
            };
            
        } catch (error) {
            console.error("❌ Start round failed:", error);
            if (window.Toast) { window.Toast.error('Start Failed', error.message || 'Transaction failed'); }
                console.error("❌ Error details:", {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                    data: error.data,
                    name: error.name,
                    cause: error.cause
                });
                console.error("❌ Full error object:", error);
                console.error("❌ Error type:", typeof error);
                console.error("❌ Error keys:", Object.keys(error));
                
                // Log data object details
                if (error.data) {
                    console.error("❌ Error data details:", error.data);
                    console.error("❌ Error data type:", typeof error.data);
                    console.error("❌ Error data keys:", Object.keys(error.data));
                    
                    // Log originalError details if it exists
                    if (error.data.originalError) {
                        console.error("❌ Original error details:", error.data.originalError);
                        console.error("❌ Original error type:", typeof error.data.originalError);
                        console.error("❌ Original error keys:", Object.keys(error.data.originalError));
                        console.error("❌ Original error message:", error.data.originalError.message);
                        console.error("❌ Original error stack:", error.data.originalError.stack);
                    }
                }
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    this.jumpToPlatform = async function() {
        try {
            if (!_bConnected) {
                throw new Error("Wallet not connected");
            }
            
            if (!_sWalletAddress) {
                throw new Error("Wallet address not available");
            }
            
            // CRITICAL: Get actual round ID from contract before jumping
            console.log("🔍 Getting actual round ID from contract before jump...");
            const actualRoundId = await this.fetchActualRoundId();
            
            if (!actualRoundId) {
                throw new Error("No active round found in contract");
            }
            
            console.log("🚀 Jumping to platform with AUTOMATIC transaction for round:", actualRoundId);
            
            // Get real Privy provider for automatic signing
            let provider = null;
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("✅ Using window.realPrivyProvider for automatic jump transaction");
            } else {
                console.error("❌ window.realPrivyProvider not available for automatic transaction");
                throw new Error("Privy provider not available");
            }
            
            // Local nonce path - no direct network nonce read
            
            // Encode function data for jumpToPlatform using actual round ID
            const functionData = ethers.utils.defaultAbiCoder.encode(
                ['bytes32'],
                [actualRoundId]
            );
            
            // Create transaction data - fix hexConcat issue
            const jumpFunction = window.CHOG_CROSS_CONTRACT.abi.find(f => f.name === 'jumpToPlatform');
            if (!jumpFunction) {
                throw new Error("jumpToPlatform function not found in contract ABI");
            }
            
            // Calculate function selector manually using ethers.js
            const jumpFunctionSignature = "jumpToPlatform(bytes32)";
            const jumpFunctionSelector = ethers.utils.id(jumpFunctionSignature).slice(0, 10);
            console.log("🔍 Jump function signature:", jumpFunctionSignature);
            console.log("🔍 Jump function selector:", jumpFunctionSelector);
            
            const transactionData = jumpFunctionSelector + functionData.slice(2);
            
            console.log("📦 Jump transaction data:", transactionData);
            
            // Use stored Privy address directly - don't rely on eth_accounts
            const privyAddress = _sWalletAddress;
            console.log("🔍 Stored Privy embedded wallet address for jump:", privyAddress);
            
            // Validate Privy address
            if (!privyAddress) {
                throw new Error("Privy embedded wallet address not available");
            }
            
            // Verify address format
            if (!privyAddress.startsWith('0x') || privyAddress.length !== 42) {
                throw new Error("Invalid Privy wallet address format");
            }
            
            console.log("✅ Using stored Privy embedded wallet address for cashout:", privyAddress);
            
            // Local nonce path via unified signer
            console.log("🚀 Sending jump via local-nonce sendSignedTx...");
            const gas = ethers.utils.hexlify(250000);
            const maxFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('54', 'gwei'));
            const maxPriorityFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('8', 'gwei'));
            const sendRes = await this.sendSignedTx({
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                gas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                value: '0x0'
            });
            if (!sendRes.success) throw new Error(sendRes.error || 'sendSignedTx failed');
            const txHash = sendRes.txHash;
            
            console.log("📤 Jump transaction sent automatically:", txHash);
            
            // Wait for confirmation and check if round ended (failed)
            if (window.TxProgress) { window.TxProgress.show(txHash, 'Jumping...', 'Waiting for confirmation on chain'); }
            const receipt = await this._waitForTransactionReceipt(txHash);
            if (window.TxProgress) { window.TxProgress.hide(); }
            console.log("✅ Jump transaction confirmed:", receipt.transactionHash);
            // Toast notification removed - only transaction progress shown
            
            // Check if RoundEnded event was emitted (indicates failure)
            let roundEnded = false;
            let jumpFailed = false;
            
            console.log("🔍 TRANSACTION RECEIPT DEBUG:");
            console.log("Receipt logs count:", receipt.logs ? receipt.logs.length : 0);
            
            if (receipt.logs && receipt.logs.length > 0) {
                console.log("📋 All event topics in this transaction:");
                receipt.logs.forEach((log, index) => {
                    console.log(`Log ${index}:`, log.topics ? log.topics[0] : "no topics");
                });
                
                // Parse logs for both PlatformJumped and RoundEnded events  
                const platformJumpedTopic = ethers.utils.id("PlatformJumped(bytes32,uint8,uint256,uint256)");
                const roundEndedTopic = ethers.utils.id("RoundEnded(bytes32,address,uint8,uint256,uint8,uint256,bool,string,uint256)");
                console.log("🔍 Looking for PlatformJumped topic:", platformJumpedTopic);
                console.log("🔍 Looking for RoundEnded topic:", roundEndedTopic);
                
                const platformJumpedLog = receipt.logs.find(log => 
                    log.topics && log.topics[0] === platformJumpedTopic
                );
                
                const roundEndedLog = receipt.logs.find(log => 
                    log.topics && log.topics[0] === roundEndedTopic
                );
                
                // Check for both success and failure scenarios
                if (roundEndedLog && platformJumpedLog) {
                    // IMPOSSIBLE: Both events in same transaction - this shouldn't happen
                    console.error("🚨 IMPOSSIBLE: Both PlatformJumped and RoundEnded in same transaction!");
                    console.log("PlatformJumped log:", platformJumpedLog);
                    console.log("RoundEnded log:", roundEndedLog);
                    
                    // Prioritize RoundEnded (game ended)
                    roundEnded = true;
                    jumpFailed = true;
                    _bContractFailed = true;
                    console.log("💀 CONTRACT FAILED - Prioritizing RoundEnded event");
                } else if (roundEndedLog) {
                    console.log("🏁 RoundEnded event detected in jump transaction");
                    console.log("💀 Jump failed - round was ended by contract");
                    console.log("💀 RoundEnded log data:", roundEndedLog);
                    
                    roundEnded = true;
                    jumpFailed = true;
                    
                    // Contract fail durumunu işaretle - karakter iniş yaptığında kontrol edilecek
                    _bContractFailed = true;
                    console.log("💀 CONTRACT FAILED - Marked for character landing check");
                    
                    // DON'T clear game state immediately - let UI/animations complete first
                    // Game will handle state clearing when gameOver() is called
                    console.log("🎮 Round ended by contract - UI will handle game state clearing");
                } else if (platformJumpedLog) {
                    console.log("✅ PlatformJumped event detected - jump successful");
                    console.log("✅ Platform jump data:", platformJumpedLog);
                } else {
                    console.log("❓ No PlatformJumped or RoundEnded events detected - checking transaction status");
                    
                    // EVENT PARSING BAŞARISIZ - Manuel kontrol yap
                    console.log("🔧 Event parsing failed - manually checking round status...");
                    
                    // Contract round durumunu kontrol et
                    try {
                        const currentRoundId = await _oContract.playerActiveRound(_sWalletAddress);
                        const zeroRoundId = '0x0000000000000000000000000000000000000000000000000000000000000000';
                        
                        if (!currentRoundId || currentRoundId === zeroRoundId) {
                            console.log("💀 ROUND ENDED - Contract shows no active round after transaction");
                            roundEnded = true;
                            jumpFailed = true;
                            _bContractFailed = true;
                            console.log("💀 CONTRACT FAILED - Round ended, marking for character landing check");
                        } else {
                            console.log("✅ JUMP SUCCESSFUL - Contract round still active");
                            jumpFailed = false;
                        }
                    } catch (error) {
                        console.error("❌ Failed to check contract round status:", error);
                        // Fallback: assume jump succeeded
                        jumpFailed = false;
                    }
                }
            }
            
            // Reset timeout checker on successful jump (if round continues)
            if (!roundEnded && !jumpFailed) {
                console.log("🔄 Resetting timeout checker after successful jump...");
                this._startTimeoutChecker();
            }
            
            return {
                success: true,
                txHash: receipt.transactionHash,
                roundEnded: roundEnded,
                jumpFailed: jumpFailed
            };
            
        } catch (error) {
            console.error("❌ Jump to platform failed:", error);
            if (window.Toast) { window.Toast.error('Jump Failed', error.message || 'Transaction failed'); }
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    this.cashOut = async function() {
        try {
            if (!_bConnected) {
                throw new Error("Wallet not connected");
            }
            
            if (!_sWalletAddress) {
                throw new Error("Wallet address not available");
            }
            
            // CRITICAL: Check if contract round has ended before cashout
            if (!_sCurrentRoundId || _sCurrentRoundId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                throw new Error("No active round - contract round has ended");
            }
            
            // CRITICAL: Get actual round ID from contract before cashout
            console.log("🔍 Getting actual round ID from contract before cashout...");
            console.log("🔍 Current stored round ID:", _sCurrentRoundId);
            console.log("🔍 Game active state:", _bGameActive);
            console.log("🔍 Wallet address:", _sWalletAddress);
            
            // Double-check if player has active round first
            console.log("🔄 Double-checking active round status...");
            const hasActiveRound = await _oContract.hasActiveRound(_sWalletAddress);
            console.log("🔍 Contract hasActiveRound result:", hasActiveRound);
            
            if (!hasActiveRound) {
                throw new Error("No active round found in contract - hasActiveRound returned false");
            }
            
            // ALWAYS fetch fresh round ID from contract to be sure
            console.log("🔄 Fetching fresh round ID from contract for safety...");
            const contractRoundId = await this.fetchActualRoundId();
            console.log("🔍 Contract round ID:", contractRoundId);
            
            // Use contract round ID if available, otherwise use stored
            if (contractRoundId) {
                console.log("✅ Using fresh contract round ID:", contractRoundId);
                _sCurrentRoundId = contractRoundId;
            } else if (_sCurrentRoundId) {
                console.log("⚠️ No contract round ID, using stored:", _sCurrentRoundId);
            } else {
                console.error("❌ No round ID available from contract or storage");
                
                // Try to check if player has active round
                try {
                    const hasActive = await _oContract.hasActiveRound(_sWalletAddress);
                    console.log("🔍 Contract hasActiveRound check:", hasActive);
                    
                    if (!hasActive) {
                        throw new Error("No active round found in contract - hasActiveRound returned false");
                    } else {
                        throw new Error("Contract says active round exists but cannot get round ID");
                    }
                } catch (activeCheckError) {
                    console.error("❌ Error checking hasActiveRound:", activeCheckError.message);
                    throw new Error("No active round found in contract for cashout - " + activeCheckError.message);
                }
            }
            
            console.log("💰 Cashing out with AUTOMATIC transaction for round:", _sCurrentRoundId);
            
            // Get real Privy provider for automatic signing
            let provider = null;
            if (window.realPrivyProvider) {
                provider = window.realPrivyProvider;
                console.log("✅ Using window.realPrivyProvider for automatic cashout transaction");
            } else {
                console.error("❌ window.realPrivyProvider not available for automatic transaction");
                throw new Error("Privy provider not available");
            }
            
            // Encode function data for cashOut using stored round ID
            const functionData = ethers.utils.defaultAbiCoder.encode(
                ['bytes32'],
                [_sCurrentRoundId]
            );
            
            // Create transaction data - fix hexConcat issue
            const cashOutFunction = window.CHOG_CROSS_CONTRACT.abi.find(f => f.name === 'cashOut');
            if (!cashOutFunction) {
                throw new Error("cashOut function not found in contract ABI");
            }
            
            // Calculate function selector manually using ethers.js
            const cashOutFunctionSignature = "cashOut(bytes32)";
            const cashOutFunctionSelector = ethers.utils.id(cashOutFunctionSignature).slice(0, 10);
            console.log("🔍 CashOut function signature:", cashOutFunctionSignature);
            console.log("🔍 CashOut function selector:", cashOutFunctionSelector);
            
            const transactionData = cashOutFunctionSelector + functionData.slice(2);
            
            console.log("📦 Cashout transaction data:", transactionData);
            
            // Get current wallet address from provider
            const currentAddresses = await provider.request({ method: 'eth_accounts' });
            if (!currentAddresses || currentAddresses.length === 0) {
                throw new Error("No wallet addresses found");
            }
            const currentAddress = currentAddresses[0];
            console.log("🔍 Current wallet address for cashout:", currentAddress);
            
            // Update stored address if different (with null check)
            if (!_sWalletAddress || currentAddress.toLowerCase() !== _sWalletAddress.toLowerCase()) {
                console.log("🔄 Updating wallet address from", _sWalletAddress || "undefined", "to", currentAddress);
                _sWalletAddress = currentAddress;
            }
            
            // Send via sign + raw transaction using local nonce
            const gas = ethers.utils.hexlify(250000);
            const maxFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('54', 'gwei'));
            const maxPriorityFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('8', 'gwei'));
            const sendRes = await this.sendSignedTx({
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                gas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                value: '0x0'
            });
            if (!sendRes.success) {
                throw new Error(sendRes.error || 'sendSignedTx failed');
            }
            const txHash = sendRes.txHash;
            console.log("📤 Cashout transaction sent:", txHash);
            
            // Wait for confirmation
            if (window.TxProgress) { window.TxProgress.show(txHash, 'Cashout in progress', 'Waiting for confirmation on chain'); }
            const receipt = await this._waitForTransactionReceipt(txHash);
            if (window.TxProgress) { window.TxProgress.hide(); }
            console.log("✅ Cash out successful:", receipt.transactionHash);
            // Toast notification removed - only transaction progress shown
            
            // Clear game state after successful cashout
            this.clearGameState();
            
            // Dispatch cashout completed event for UI reset
            window.dispatchEvent(new CustomEvent('cashoutCompleted', {
                detail: { txHash: receipt.transactionHash }
            }));
            
            return {
                success: true,
                txHash: receipt.transactionHash
            };
            
        } catch (error) {
            console.error("❌ Cash out failed:", error);
            if (window.Toast) { window.Toast.error('Cashout Failed', error.message || 'Transaction failed'); }
            
            // Retry once if RoundNotFound (common timing issue)
            if (error.message.includes("RoundNotFound") || error.message.includes("No active round")) {
                console.log("🔄 RoundNotFound detected, retrying once after delay...");
                
                try {
                    // Wait 2 seconds for contract state to sync
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Try fetching round ID again
                    const retryRoundId = await this.fetchActualRoundId();
                    
                    if (retryRoundId) {
                        console.log("🔄 RETRY: Found round ID after delay:", retryRoundId);
                        _sCurrentRoundId = retryRoundId;
                        
                        // Re-attempt cashout with fresh round ID
                        console.log("🔄 RETRY: Attempting cashout again...");
                        // For now, just inform user - full retry would be complex
                        return {
                            success: false,
                            error: "Temporary sync issue. Please try cashout again in a moment.",
                            shouldRetry: true
                        };
                    }
                } catch (retryError) {
                    console.error("❌ Retry also failed:", retryError.message);
                }
            }
            
            // Enhanced error handling for better bet recovery
            let enhancedError = error.message;
            let requiresRecovery = false;
            
            // Check if this is a round-related error that might need recovery
            if (error.message.includes('RoundNotFound') || 
                error.message.includes('RoundNotActive') ||
                error.message.includes('execution reverted')) {
                
                console.log("🔍 Checking if recovery is needed for error:", error.message);
                
                try {
                    // Final check if round exists in contract
                    const hasActiveCheck = await _oContract.hasActiveRound(_sWalletAddress);
                    const treasuryInfo = await _oContract.getTreasuryInfo();
                    
                    console.log("🔍 Final round check - hasActive:", hasActiveCheck);
                    console.log("🔍 Treasury status - balance:", ethers.utils.formatEther(treasuryInfo[0]), "exposure:", ethers.utils.formatEther(treasuryInfo[1]));
                    
                    if (!hasActiveCheck) {
                        enhancedError = "Round may have ended unexpectedly. Use recovery button to check for stuck funds.";
                        requiresRecovery = true;
                    } else {
                        enhancedError = "Temporary sync issue with round state. Try again or use recovery.";
                        requiresRecovery = true;
                    }
                } catch (checkError) {
                    console.log("⚠️ Error during final round check:", checkError.message);
                    enhancedError = "Network error during cashout. Use recovery to check your funds.";
                    requiresRecovery = true;
                }
            }
            
            return {
                success: false,
                error: enhancedError,
                requiresRecovery: requiresRecovery,
                originalError: error.message
            };
        }
    };
    
    // NEW: Emergency recovery for network issues (bypass 5-minute timeout)
    this.emergencyRecover = async function(roundId) {
        try {
            console.log("🚨 Emergency recovery for round:", roundId);
            
            if (!_bConnected || !_sWalletAddress) {
                throw new Error("Wallet not connected");
            }
            
            if (!roundId) {
                throw new Error("Round ID required for emergency recovery");
            }
            
            const provider = window.realPrivyProvider;
            if (!provider) {
                throw new Error("Privy provider not available");
            }
            
            // Encode emergencyRecover(bytes32 roundId) function call
            const functionSignature = "emergencyRecover(bytes32)";
            const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
            const encodedRoundId = ethers.utils.defaultAbiCoder.encode(['bytes32'], [roundId]);
            const transactionData = functionSelector + encodedRoundId.slice(2);
            
            console.log("🚨 Emergency recovery transaction data:", transactionData);
            
            // Use unified sign+raw (2048 approach) with local nonce; fallback to eth_sendTransaction
            const gas = '0x3D090';
            const maxFeePerGas = '0xC92A69C00';
            const maxPriorityFeePerGas = '0x1DCD65000';
            const sendRes = await this.sendSignedTx({
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                gas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                value: '0x0'
            });
            if (!sendRes.success) throw new Error(sendRes.error || 'sendSignedTx failed');
            const txHash = sendRes.txHash;
            console.log("✅ Emergency recovery transaction sent:", txHash);
            if (window.Toast) { window.Toast.info('Recovery Sent', 'Recovery transaction submitted'); }
            // optional: wait for receipt
            if (window.TxProgress) { window.TxProgress.show(txHash, 'Recovering...', 'Waiting for confirmation on chain'); }
            try { await this._waitForTransactionReceipt(txHash); } catch(_) {}
            if (window.TxProgress) { window.TxProgress.hide(); }
            this.clearGameState();
            return { success: true, txHash };
            
        } catch (error) {
            console.error("❌ Emergency recovery failed:", error);
            if (window.Toast) { window.Toast.error('Recovery Failed', error.message || 'Transaction failed'); }
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    this.getPlayerRoundInfo = async function() {
        try {
            if (!_bConnected || !_oContract) {
                throw new Error("Wallet not connected or contract not initialized");
            }
            
            const roundInfo = await _oContract.getPlayerRoundInfo(_sWalletAddress);
            
            return {
                roundId: roundInfo.roundId,
                hasRound: roundInfo.hasRound,
                level: roundInfo.level,
                betAmount: roundInfo.betAmount.toString(),
                currentPlatform: roundInfo.currentPlatform,
                vrfReady: roundInfo.vrfReady,
                currentMultiplier: roundInfo.currentMultiplier.toString(),
                currentWinAmount: roundInfo.currentWinAmount.toString(),
                timeRemaining: roundInfo.timeRemaining.toString()
            };
            
        } catch (error) {
            console.error("❌ Get player round info failed:", error);
            return null;
        }
    };
    
    this.getGameLevel = async function(level) {
        try {
            if (!_oContract) {
                throw new Error("Contract not initialized");
            }
            
            const gameLevel = await _oContract.getGameLevel(level);
            
            return {
                platforms: gameLevel.platforms,
                failProbability: gameLevel.failProbability,
                multipliers: gameLevel.multipliers.map(m => m.toString())
            };
            
        } catch (error) {
            console.error("❌ Get game level failed:", error);
            return null;
        }
    };
    
    this.isGameActive = function() {
        return _bGameActive;
    };
    
    this.getCurrentRoundId = function() {
        return _sCurrentRoundId;
    };
    
    this.setCurrentRoundId = function(roundId) {
        _sCurrentRoundId = roundId;
        console.log("📍 Round ID updated to:", roundId);
    };
    
    // Get actual round ID from contract
    this.fetchActualRoundId = async function() {
        try {
            if (!_bConnected || !_oContract) {
                console.warn("⚠️ Cannot fetch round ID - not connected");
                console.warn("🔍 Connected:", _bConnected, "Contract:", !!_oContract);
                return null;
            }
            
            console.log("🔍 Calling playerActiveRound for address:", _sWalletAddress);
            const actualRoundId = await _oContract.playerActiveRound(_sWalletAddress);
            console.log("📍 Raw contract response for playerActiveRound:", actualRoundId);
            console.log("📍 Round ID type:", typeof actualRoundId);
            console.log("📍 Round ID string:", actualRoundId?.toString());
            
            const zeroRoundId = '0x0000000000000000000000000000000000000000000000000000000000000000';
            
            if (actualRoundId && actualRoundId !== zeroRoundId && actualRoundId.toString() !== '0') {
                console.log("✅ Valid round ID found:", actualRoundId);
                return actualRoundId;
            } else {
                console.warn("⚠️ No active round found in contract (zero or null round ID)");
                
                // SADECE GERÇEKTEN ROUND BİTMİŞSE STATE'İ SIFIRLA
                // Eğer _sCurrentRoundId varsa ve contract'ta yoksa, round bitmiş demektir
                // Ama contract round başladıktan hemen sonra VRF hazır olmayabilir, bu yüzden dikkatli ol
                if (_sCurrentRoundId && _sCurrentRoundId !== zeroRoundId) {
                    console.log("🔄 Contract round ended - clearing round state");
                    _sCurrentRoundId = null;
                    _bGameActive = false;
                    
                    // Contract round bitme event'ini dispatch et
                    window.dispatchEvent(new CustomEvent("contractRoundEnded", {
                        detail: {
                            reason: "round_ended",
                            roundId: null
                        }
                    }));
                } else {
                    console.log("⚠️ Contract round ID not found, but no stored round ID to clear");
                }
                
                // Try alternative method: getPlayerRoundInfo
                try {
                    console.log("🔄 Trying getPlayerRoundInfo as fallback...");
                    const roundInfo = await _oContract.getPlayerRoundInfo(_sWalletAddress);
                    console.log("📍 Round info response:", roundInfo);
                    
                    if (roundInfo && roundInfo.hasRound && roundInfo.roundId && roundInfo.roundId !== zeroRoundId) {
                        console.log("✅ Found round ID via getPlayerRoundInfo:", roundInfo.roundId);
                        // Round ID bulundu, state'i güncelle
                        _sCurrentRoundId = roundInfo.roundId;
                        _bGameActive = true;
                        return roundInfo.roundId;
                    }
                } catch (infoError) {
                    console.warn("⚠️ getPlayerRoundInfo also failed:", infoError.message);
                }
                
                return null;
            }
        } catch (error) {
            console.error("❌ Failed to fetch actual round ID:", error.message);
            console.error("❌ Error details:", error);
            return null;
        }
    };
    
    this.getContract = function() {
        return _oContract;
    };
    
    // Contract round bitme kontrolü
    this.isContractRoundEnded = function() {
        // Eğer _sCurrentRoundId null veya sıfır ise round bitmiş
        var isEnded = !_sCurrentRoundId || _sCurrentRoundId === '0x0000000000000000000000000000000000000000000000000000000000000000';
        
        if (isEnded) {
            console.log("🔄 Contract round ended - Round ID:", _sCurrentRoundId);
        } else {
            console.log("✅ Contract round active - Round ID:", _sCurrentRoundId);
        }
        
        return isEnded;
    };

    // VRF hazır olup olmadığını kontrol et
    this.isVRFReady = function() {
        // Eğer _bVRFReady true ise VRF hazır
        return _bVRFReady;
    };

    // Contract fail durumunu kontrol et
    this.isContractFailed = function() {
        return _bContractFailed;
    };

    // Contract fail durumunu temizle
    this.clearContractFailed = function() {
        _bContractFailed = false;
    };
    
    // Recovery function for stuck rounds
    this.recoverStuckRound = async function() {
        try {
            if (!_bConnected || !_oContract) {
                throw new Error("Wallet not connected or contract not available");
            }
            
            console.log("🔧 Attempting to recover stuck round...");
            
            // Check if user has active round and get round info
            const hasActive = await _oContract.hasActiveRound(_sWalletAddress);
            console.log("🎮 Player has active round:", hasActive);
            
            if (!hasActive) {
                console.log("✅ No active round found. Player is ready for new game!");
                return {
                    success: true,
                    message: "No active round to recover"
                };
            }
            
            // Get player round info to find round ID and current platform
            let roundId = null;
            let currentPlatform = 0;
            let roundInfo = null;
            try {
                // Try to get round info if function exists
                roundInfo = await _oContract.getPlayerRoundInfo(_sWalletAddress);
                roundId = roundInfo.roundId;
                currentPlatform = roundInfo.currentPlatform || 0;
                console.log("📍 Found player round ID:", roundId);
                console.log("📍 Current platform:", currentPlatform);
            } catch (infoError) {
                console.log("⚠️ getPlayerRoundInfo not available, trying fallback...");
                // Fallback: use playerActiveRound mapping if available
                try {
                    roundId = await _oContract.playerActiveRound(_sWalletAddress);
                    console.log("📍 Found round ID from mapping:", roundId);
                    
                    // Try to get currentPlatform from rounds mapping directly
                    if (roundId && roundId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                        try {
                            const roundData = await _oContract.rounds(roundId);
                            currentPlatform = roundData.currentPlatform || 0;
                            console.log("📍 Current platform from rounds mapping:", currentPlatform);
                            
                            // Create a mock roundInfo object for timeout check
                            roundInfo = {
                                lastActivity: roundData.lastActivity || 0,
                                currentPlatform: currentPlatform
                            };
                        } catch (roundsError) {
                            console.log("⚠️ Cannot access rounds mapping, defaulting currentPlatform to 0");
                            currentPlatform = 0;
                            roundInfo = { lastActivity: 0, currentPlatform: 0 };
                        }
                    } else {
                        currentPlatform = 0;
                        roundInfo = { lastActivity: 0, currentPlatform: 0 };
                    }
                } catch (mappingError) {
                    console.log("❌ Cannot find round ID from any source");
                    roundId = null;
                    currentPlatform = 0;
                    roundInfo = { lastActivity: 0, currentPlatform: 0 };
                }
            }
            
            // ROUND ID KONTROLÜ - Round ID yoksa recovery yapamayız
            if (!roundId || roundId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                throw new Error("Cannot find valid round ID for recovery. The round may have already ended.");
            }
            
            console.log("⚠️ Found active round, attempting recovery...");
            
            // CURRENT PLATFORM KONTROLÜ - Hangi recovery fonksiyonunu kullanacağımızı belirle
            if (currentPlatform > 0) {
                console.log("✅ Player has reached platforms, using emergencyRecover...");
                // Player platformlara zıplamış, emergencyRecover kullan (round'u bitirir)
                try {
                    const emergencyTx = await this.emergencyRecover(roundId);
                    if (emergencyTx.success) {
                        console.log("✅ Emergency recovery successful - round ended with current platform payout!");
                        return {
                            success: true,
                            method: 'emergencyRecover',
                            txHash: emergencyTx.txHash,
                            message: "Emergency recovery completed - current platform payout received"
                        };
                    }
                } catch (emergencyError) {
                    console.log("⚠️ Emergency recovery failed:", emergencyError.message);
                    // EmergencyRecover başarısız olursa cashOut fallback'e düş
                    
                    // Session signer removed - using direct transaction mode
                    if (emergencyError.message.includes("privy_wallet_not_ready")) {
                        console.log("💡 Privy wallet not ready - falling back to provider cashOut");
                    }
                }
            }
            
            // FALLBACK: emergencyRecover başarısız VEYA platform 0
            // Timeout durumlarında cashOut çalışmaz, emergencyRecover veya endRoundOnFail kullanmalıyız
            const provider = window.realPrivyProvider;
            if (!provider) {
                throw new Error("Privy provider not available");
            }
            
            let functionSignature, functionSelector, transactionData;
            
        // Check if round is timed out using ON-CHAIN time (more reliable than local clock)
        // Get latest block timestamp
        let isTimedOut = false;
        try {
            const latestBlock = await provider.request({ method: 'eth_getBlockByNumber', params: ['latest', false] });
            const blockTs = latestBlock && latestBlock.timestamp ? parseInt(latestBlock.timestamp, 16) : 0;
            // Normalize lastActivity to number seconds
            let lastAct = 0;
            const la = roundInfo && roundInfo.lastActivity;
            if (typeof la === 'bigint') {
                lastAct = Number(la);
            } else if (typeof la === 'number') {
                lastAct = la;
            } else if (la && typeof la === 'object' && la._hex) {
                lastAct = parseInt(la._hex, 16);
            } else if (typeof la === 'string') {
                // Could be decimal string
                lastAct = /^0x/i.test(la) ? parseInt(la, 16) : parseInt(la, 10);
            }
            // If we couldn't read lastActivity, default to not timed out (safer than false positives)
            if (blockTs > 0 && lastAct > 0) {
                isTimedOut = (blockTs - lastAct) >= 300; // 5 minutes
            } else {
                isTimedOut = false;
            }
        } catch (tsErr) {
            console.log("⚠️ On-chain timestamp check failed, defaulting to not timed out:", tsErr && tsErr.message ? tsErr.message : tsErr);
            isTimedOut = false;
        }
            
            if (isTimedOut) {
                // Round is timed out - use endTimedOutRound
                console.log("⏰ Round is timed out - using endTimedOutRound");
                console.log("🔧 Attempting endTimedOutRound recovery...");
                
                functionSignature = "endTimedOutRound(bytes32)";
                functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
                const encodedRoundId = ethers.utils.defaultAbiCoder.encode(['bytes32'], [roundId]);
                transactionData = functionSelector + encodedRoundId.slice(2);
                console.log("🔍 Using endTimedOutRound(bytes32) with roundId:", roundId);
                console.log("💰 EndTimedOutRound will provide timeout-based payout");
            } else {
                // Round is not timed out
                if (currentPlatform === 0) {
                    // Contract requires endRoundOnFail when no platforms were reached
                    console.log("✅ Not timed out & no platforms reached - using endRoundOnFail");
                    functionSignature = "endRoundOnFail(bytes32)";
                    functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
                    const encodedRoundId = ethers.utils.defaultAbiCoder.encode(['bytes32'], [roundId]);
                    transactionData = functionSelector + encodedRoundId.slice(2);
                    console.log("🔍 Using endRoundOnFail(bytes32) with roundId:", roundId);
                } else {
                    // Platforms reached -> emergencyRecover
                    console.log("✅ Not timed out & platforms reached (", currentPlatform, ") - using emergencyRecover");
                    functionSignature = "emergencyRecover(bytes32)";
                    functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
                    const encodedRoundId = ethers.utils.defaultAbiCoder.encode(['bytes32'], [roundId]);
                    transactionData = functionSelector + encodedRoundId.slice(2);
                    console.log("🔍 Using emergencyRecover(bytes32) with roundId:", roundId);
                }
            }
            
            console.log("🔍 Recovery transaction data:", transactionData);
            
            // Use unified sign+raw path (viem/ethers) with local nonce; fallback to provider
            const gas = ethers.utils.hexlify(250000);
            const maxFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('54', 'gwei'));
            const maxPriorityFeePerGas = ethers.utils.hexlify(ethers.utils.parseUnits('8', 'gwei'));
            const sendRes = await this.sendSignedTx({
                to: window.CHOG_CROSS_CONTRACT.address,
                data: transactionData,
                gas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                value: '0x0'
            });
            if (!sendRes.success) throw new Error(sendRes.error || 'sendSignedTx failed');
            const txHash = sendRes.txHash;
            console.log("✅ Recovery transaction sent:", txHash);
            
            // Reset game state
            _bGameActive = false;
            _sCurrentRoundId = null;
            
            console.log("🎉 Recovery transaction completed:", txHash);
            
            return {
                success: true,
                txHash: txHash,
                method: isTimedOut ? 'endTimedOutRound' : (currentPlatform === 0 ? 'endRoundOnFail' : 'emergencyRecover'),
                message: isTimedOut ? 
                    "EndTimedOutRound recovery completed - timeout-based payout received" :
                    (currentPlatform === 0 ? "endRoundOnFail recovery completed - refund processed" : "EmergencyRecover recovery completed - platform payout processed")
            };
            
        } catch (error) {
            console.error("❌ Recovery failed:", error);
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // Helper function to wait for transaction receipt (WS first, HTTP fallback)
    this._waitForTransactionReceipt = async function(txHash) {
        const provider = window.realPrivyProvider;
        if (!provider) {
            throw new Error("Provider not available for transaction confirmation");
        }
        console.log("⏳ Waiting for transaction confirmation:", txHash);

        // Strategy A: viem WebSocket client
        try {
            const viem = window.viem;
            if (viem && viem.createPublicClient && viem.webSocket) {
                const monad = { id: 10143, name: 'monad-testnet' };
                const wsClient = viem.createPublicClient({ chain: monad, transport: viem.webSocket('wss://testnet-rpc.monad.xyz') });
                const receipt = await wsClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
                if (receipt) {
                    console.log("✅ WS receipt received:", receipt);
                    return receipt;
                }
            }
        } catch (wsErr) {
            console.log("ℹ️ WS waitForTransactionReceipt failed or unavailable:", wsErr && wsErr.message ? wsErr.message : wsErr);
        }

        // Strategy B: HTTP polling fallback (750ms)
        let attempts = 0;
        const POLL_MS = 750;
        const MAX_ATTEMPTS = Math.ceil(90_000 / POLL_MS); // ~90s
        while (attempts < MAX_ATTEMPTS) {
            try {
                const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [txHash] });
                if (receipt) {
                    console.log("✅ HTTP receipt received:", receipt);
                    return receipt;
                }
            } catch (error) {
                // ignore and continue
            }
            await new Promise(r => setTimeout(r, POLL_MS));
            attempts++;
        }
        throw new Error("Transaction confirmation timeout");
    };
    
    // Recovery specific cashOut with roundId parameter
    // cashOutWithRoundId removed - using emergencyRecover + endRoundOnFail for recovery

    // Initialize
    this._init();
}

// Global wallet manager instance
var walletManager = null;

// Initialize wallet manager when page loads
window.addEventListener('load', function() {
    try {
        walletManager = new WalletManager();
        window.walletManager = walletManager; // Global referansı ekle
        console.log("🌟 Wallet system ready!");
        console.log("🔗 window.walletManager set to:", window.walletManager);
    } catch (error) {
        console.error("❌ Wallet system initialization failed:", error);
    }
});

