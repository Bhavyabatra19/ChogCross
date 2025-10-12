/**
 * LeaderboardManager - Manages communication with GhostGraph indexer
 * Now uses GhostGraph instead of local JSON server
 */
function LeaderboardManager() {
    var _sServerUrl = 'http://localhost:3001'; // Fallback for local server
    var _bInitialized = false;
    var _oLeaderboardData = null;
    var _sPlayerAddress = null;
    var _oGhostGraphService = null;
    var _bUseGhostGraph = true; // Flag to switch between GhostGraph and local server
    var _oCache = {
        leaderboards: null,
        playerStats: {},
        lastUpdate: 0,
        cacheTimeout: 60000 // 1 minute cache
    };
    var _bGameActive = false; // Track if game is active

    /**
     * Initialize the LeaderboardManager
     */
    this.init = function() {
        console.log("📊 Initializing LeaderboardManager with GhostGraph...");
        
        // Initialize GhostGraph service
        if (window.GhostGraphService) {
            _oGhostGraphService = new GhostGraphService();
            console.log("🔮 GhostGraph service initialized");
            
            // Immediately set to use GhostGraph
            _bUseGhostGraph = true;
            console.log("✅ GhostGraph enabled - will test connection on first use");
        } else {
            console.log("⚠️ GhostGraphService not available, using local server");
            _bUseGhostGraph = false;
        }
        
        _bInitialized = true;
        
        // Get player address from wallet
        if (window.walletManager && window.walletManager.getWalletAddress) {
            _sPlayerAddress = window.walletManager.getWalletAddress();
        }
        
        // Load initial leaderboard data
        this.loadLeaderboards();
        
        console.log("✅ LeaderboardManager initialized successfully!");
    };

    /**
     * Set game active state to avoid GhostGraph calls during gameplay
     */
    this.setGameActive = function(active) {
        _bGameActive = active;
        console.log("🎮 Game active state set to:", active);
    };

    /**
     * Get current game active state
     */
    this.isGameActive = function() {
        return _bGameActive;
    };

    /**
     * Get current player address
     */
    this.getPlayerAddress = function() {
        console.log("👤 Getting player address from LeaderboardManager:", _sPlayerAddress);
        return _sPlayerAddress;
    };

    /**
     * Check if manager is initialized
     */
    this.isInitialized = function() {
        return _bInitialized;
    };

    /**
     * Load leaderboards from GhostGraph or local server
     */
    this.loadLeaderboards = function() {
        var now = Date.now();
        
        // Check cache first
        if (_oCache.leaderboards && (now - _oCache.lastUpdate) < _oCache.cacheTimeout) {
            console.log("📊 Using cached leaderboards");
            return Promise.resolve(_oCache.leaderboards);
        }
        
        // If game is active, don't make GhostGraph calls to avoid interference
        if (_bGameActive) {
            console.log("🎮 Game is active - using cached leaderboards to avoid interference");
            if (_oCache.leaderboards) {
                return Promise.resolve(_oCache.leaderboards);
            } else {
                // Return empty data if no cache
                var emptyData = {
                    leaderboards: {
                        totalWinnings: [],
                        bestStreak: [],
                        highestMultiplier: [],
                        fastestTime: [],
                        mostRisky: []
                    },
                    statistics: {
                        totalGames: 0,
                        totalPlayers: 0,
                        totalWinnings: 0,
                        averageMultiplier: 0,
                        lastUpdated: new Date().toISOString()
                    }
                };
                return Promise.resolve(emptyData);
            }
        }
        
        if (_bUseGhostGraph && _oGhostGraphService) {
            console.log("🔮 Loading leaderboards from GhostGraph...");
            return _oGhostGraphService.getLeaderboards()
                .then(data => {
                    _oLeaderboardData = data;
                    _oCache.leaderboards = data;
                    _oCache.lastUpdate = now;
                    console.log("📊 Leaderboards loaded from GhostGraph successfully");
                    return data;
                })
                .catch(error => {
                    console.error("❌ Failed to load leaderboards from GhostGraph:", error);
                    console.log("🔄 GhostGraph failed, but no local server available");
                    console.log("📊 Returning empty leaderboard data");
                    
                    // Return empty data instead of trying local server
                    var emptyData = {
                        leaderboards: {
                            topEarners: []
                        },
                        statistics: {
                            totalGames: 0,
                            totalPlayers: 0,
                            totalWinnings: 0,
                            averageMultiplier: 0,
                            lastUpdated: new Date().toISOString()
                        }
                    };
                    
                    _oLeaderboardData = emptyData;
                    return emptyData;
                });
        } else {
            console.log("📊 GhostGraph not available, returning empty data");
            var emptyData = {
                leaderboards: {
                    totalWinnings: [],
                    bestStreak: [],
                    highestMultiplier: [],
                    fastestTime: [],
                    mostRisky: []
                },
                statistics: {
                    totalGames: 0,
                    totalPlayers: 0,
                    totalWinnings: 0,
                    averageMultiplier: 0,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            _oLeaderboardData = emptyData;
            return Promise.resolve(emptyData);
        }
    };

    /**
     * Submit a game result - GhostGraph automatically indexes from blockchain events
     * This method is kept for compatibility but doesn't need to do anything
     * as GhostGraph will automatically detect RoundEnded events
     */
    this.submitGameResult = function(gameData) {
        console.log("🎯 submitGameResult called with:", gameData);
        console.log("🔮 Using GhostGraph - game results are automatically indexed from blockchain events");
        
        if (!_sPlayerAddress) {
            console.error("❌ Cannot submit game: No player address set");
            return Promise.reject(new Error("No player address"));
        }

        // GhostGraph automatically indexes RoundEnded events from the blockchain
        // No need to manually submit data
        console.log("✅ Game result will be automatically indexed by GhostGraph from RoundEnded event");
        
        // Clear GhostGraph cache to force refresh
        if (_oGhostGraphService) {
            _oGhostGraphService.clearCache();
        }
        
        // Reload leaderboards after a short delay to allow GhostGraph to process
        setTimeout(() => {
            this.loadLeaderboards();
        }, 2000);
        
        // Dispatch event to notify wallet to update profit
        const leaderboardUpdatedEvent = new CustomEvent('leaderboardUpdated', {
            detail: { 
                gameId: 'ghostgraph_' + Date.now(),
                playerAddress: _sPlayerAddress,
                winnings: gameData.winnings || 0
            }
        });
        window.dispatchEvent(leaderboardUpdatedEvent);
        console.log("📢 leaderboardUpdated event dispatched");
        
        return Promise.resolve({
            success: true,
            message: 'Game result will be automatically indexed by GhostGraph',
            data: {
                gameId: 'ghostgraph_' + Date.now(),
                playerAddress: _sPlayerAddress,
                winnings: gameData.winnings || 0
            }
        });
    };

    /**
     * Get player statistics from GhostGraph or local server
     */
    this.getPlayerStats = function(address) {
        const playerAddress = address || _sPlayerAddress;
        var now = Date.now();
        
        if (!playerAddress) {
            console.error("❌ Cannot get player stats: No address provided");
            return Promise.reject(new Error("No player address"));
        }

        // Check cache first
        if (_oCache.playerStats[playerAddress] && 
            (now - _oCache.playerStats[playerAddress].lastUpdate) < _oCache.cacheTimeout) {
            console.log("📊 Using cached player stats for:", playerAddress);
            return Promise.resolve(_oCache.playerStats[playerAddress].data);
        }

        if (_bUseGhostGraph && _oGhostGraphService) {
            console.log("🔮 Getting player stats from GhostGraph:", playerAddress);
            return _oGhostGraphService.getPlayerStats(playerAddress)
                .then(data => {
                    console.log("👤 Player stats loaded from GhostGraph:", data);
                    // Cache the data
                    _oCache.playerStats[playerAddress] = {
                        data: data,
                        lastUpdate: now
                    };
                    return data;
                })
                .catch(error => {
                    console.error("❌ Failed to load player stats from GhostGraph:", error);
                    console.log("📊 Returning null - player not found or no games played");
                    return null;
                });
        } else {
            console.log("📊 GhostGraph not available, returning null");
            return Promise.resolve(null);
        }
    };

    /**
     * Update player display name
     */
    this.updateDisplayName = function(displayName) {
        if (!_sPlayerAddress) {
            console.error("❌ Cannot update display name: No player address set");
            return Promise.reject(new Error("No player address"));
        }

        return fetch(_sServerUrl + '/api/player/displayName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerAddress: _sPlayerAddress,
                displayName: displayName
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log("✅ Display name updated successfully");
                return data;
            } else {
                console.error("❌ Failed to update display name:", data.error);
                throw new Error(data.error);
            }
        })
        .catch(error => {
            console.error("❌ Error updating display name:", error);
            throw error;
        });
    };

    /**
     * Get cached leaderboard data
     */
    this.getLeaderboards = function() {
        return _oLeaderboardData;
    };

    /**
     * Get specific leaderboard
     */
    this.getLeaderboard = function(type) {
        if (!_oLeaderboardData || !_oLeaderboardData.leaderboards) {
            return [];
        }
        return _oLeaderboardData.leaderboards[type] || [];
    };

    /**
     * Get statistics
     */
    this.getStatistics = function() {
        if (!_oLeaderboardData) {
            return null;
        }
        return _oLeaderboardData.statistics;
    };

    /**
     * Check if initialized
     */
    this.isInitialized = function() {
        return _bInitialized;
    };

    /**
     * Get server status
     */
    this.getServerStatus = function() {
        return fetch(_sServerUrl + '/health')
            .then(response => response.json())
            .then(data => {
                console.log("🟢 Leaderboard server is online");
                return data;
            })
            .catch(error => {
                console.error("🔴 Leaderboard server is offline:", error);
                throw error;
            });
    };

    // Initialize when wallet address becomes available
    if (window.walletManager) {
        // Get current wallet address if already connected
        if (window.walletManager.getWalletAddress) {
            var currentAddress = window.walletManager.getWalletAddress();
            if (currentAddress) {
                _sPlayerAddress = currentAddress;
                console.log("👤 Wallet already connected, player address set:", _sPlayerAddress);
            }
        }
        
        // Listen for wallet connection events
        window.addEventListener('walletConnected', function(event) {
            console.log("🔔 walletConnected event received in LeaderboardManager:", event);
            if (event.detail && event.detail.address) {
                _sPlayerAddress = event.detail.address;
                console.log("👤 Wallet connected, player address set in LeaderboardManager:", _sPlayerAddress);
            }
        });
    }
    
    // Also try to get wallet address periodically if not found yet
    var checkWalletInterval = setInterval(function() {
        if (!_sPlayerAddress && window.walletManager && window.walletManager.getWalletAddress) {
            var address = window.walletManager.getWalletAddress();
            if (address) {
                _sPlayerAddress = address;
                console.log("👤 Wallet address detected via polling:", _sPlayerAddress);
                clearInterval(checkWalletInterval);
            }
        }
    }, 2000);
}

// Create global instance
var s_oLeaderboardManager = new LeaderboardManager();
// Also make it available globally on window
window.s_oLeaderboardManager = s_oLeaderboardManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (s_oLeaderboardManager && !s_oLeaderboardManager.isInitialized()) {
        s_oLeaderboardManager.init();
    }
});

// Auto-initialize after a short delay for dynamic loading
setTimeout(function() {
    if (s_oLeaderboardManager && !s_oLeaderboardManager.isInitialized()) {
        s_oLeaderboardManager.init();
    }
}, 1000);
