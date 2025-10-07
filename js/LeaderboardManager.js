/**
 * LeaderboardManager - Manages communication with the leaderboard server
 */
function LeaderboardManager() {
    var _sServerUrl = 'http://localhost:3001';
    var _bInitialized = false;
    var _oLeaderboardData = null;
    var _sPlayerAddress = null;

    /**
     * Initialize the LeaderboardManager
     */
    this.init = function() {
        console.log("📊 Initializing LeaderboardManager...");
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
     * Set player address
     */
    this.setPlayerAddress = function(address) {
        _sPlayerAddress = address;
        console.log("👤 Player address set in LeaderboardManager:", address);
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
     * Load leaderboards from server
     */
    this.loadLeaderboards = function() {
        return fetch(_sServerUrl + '/api/leaderboards')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    _oLeaderboardData = data.data;
                    console.log("📊 Leaderboards loaded successfully");
                    return data.data;
                } else {
                    console.error("❌ Failed to load leaderboards:", data.error);
                    return null;
                }
            })
            .catch(error => {
                console.error("❌ Error loading leaderboards:", error);
                return null;
            });
    };

    /**
     * Submit a game result to the server
     */
    this.submitGameResult = function(gameData) {
        console.log("🎯 submitGameResult called with:", gameData);
        console.log("🎯 Player address for submission:", _sPlayerAddress);
        
        if (!_sPlayerAddress) {
            console.error("❌ Cannot submit game: No player address set");
            return Promise.reject(new Error("No player address"));
        }

        const payload = {
            playerAddress: _sPlayerAddress,
            betAmount: gameData.betAmount || 1.0,
            difficulty: gameData.difficulty || 'easy',
            platforms: gameData.platforms || 0,
            multiplier: gameData.multiplier || 1.0,
            winnings: gameData.winnings || 0,
            gameTime: gameData.gameTime || 0,
            txHash: gameData.txHash || null,
            displayName: gameData.displayName || null
        };

        console.log("🎮 Submitting game result:", payload);
        console.log("🌐 Server URL:", _sServerUrl + '/api/game');
        console.log("💰 WINNINGS VALUE BEING SENT:", payload.winnings);
        console.log("🎯 PLAYER ADDRESS:", payload.playerAddress);

        return fetch(_sServerUrl + '/api/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log("🌐 Server response status:", response.status);
            console.log("🌐 Server response ok:", response.ok);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("📡 Full server response:", data);
            if (data.success) {
                console.log("✅ Game result submitted successfully:", data.data.gameId);
                console.log("💰 SERVER CONFIRMED WINNINGS:", data.data?.winnings);
                console.log("🎯 SERVER CONFIRMED PLAYER:", data.data?.playerAddress);
                
                // Reload leaderboards after submitting
                this.loadLeaderboards();
                
                // Dispatch event to notify wallet to update profit
                const leaderboardUpdatedEvent = new CustomEvent('leaderboardUpdated', {
                    detail: { gameId: data.data.gameId }
                });
                window.dispatchEvent(leaderboardUpdatedEvent);
                console.log("📢 leaderboardUpdated event dispatched");
                
                return data;
            } else {
                console.error("❌ Failed to submit game result:", data.error);
                throw new Error(data.error);
            }
        })
        .catch(error => {
            console.error("❌ Error submitting game result:", error);
            throw error;
        });
    };

    /**
     * Get player statistics
     */
    this.getPlayerStats = function(address) {
        const playerAddress = address || _sPlayerAddress;
        
        if (!playerAddress) {
            console.error("❌ Cannot get player stats: No address provided");
            return Promise.reject(new Error("No player address"));
        }

        return fetch(_sServerUrl + '/api/player/' + playerAddress)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("👤 Player stats loaded:", data.data.player);
                    return data.data;
                } else if (response.status === 404) {
                    console.log("👤 Player not found - first time player");
                    return null;
                } else {
                    console.error("❌ Failed to load player stats:", data.error);
                    throw new Error(data.error);
                }
            })
            .catch(error => {
                console.error("❌ Error loading player stats:", error);
                throw error;
            });
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
