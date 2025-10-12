/**
 * GhostGraph API Service
 * Handles all communication with GhostGraph indexer using GraphQL
 */
function GhostGraphService() {
    var _sApiKey = 'wd6wlzmb24hcvyb758qfsk'; // Query key - sadece bu yeterli
    var _sBaseUrl = 'https://api.ghostlogs.xyz/gg/pub/f17f1343-8a33-4bd2-82de-da8f887842c6/ghostgraph';
    var _sGraphId = 'f17f1343-8a33-4bd2-82de-da8f887842c6';
    
    // Cache for performance
    var _oCache = {
        players: {},
        leaderboards: {},
        lastUpdate: 0,
        cacheTimeout: 120000 // 2 minutes - increased to reduce API calls
    };

    this._init = function() {
        console.log('🔮 GhostGraph Service initialized');
        console.log('📊 Graph ID:', _sGraphId);
        console.log('🌐 Base URL:', _sBaseUrl);
    };

    /**
     * Convert BigInt string to readable number
     */
    this._formatBigInt = function(bigIntString, decimals = 18) {
        if (!bigIntString || bigIntString === '0') return '0';
        
        // Convert BigInt string to number
        var num = parseFloat(bigIntString);
        
        // Convert from wei to readable format
        var formatted = num / Math.pow(10, decimals);
        
        // Round to 4 decimal places
        return Math.round(formatted * 10000) / 10000;
    };

    /**
     * Make GraphQL request to GhostGraph API
     */
    this._makeGraphQLRequest = function(query, variables = {}) {
        var requestBody = {
            query: query,
            variables: variables
        };
        
        console.log('🌐 GhostGraph GraphQL Request:', query.substring(0, 100) + '...');
        
        return fetch(_sBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + _sApiKey
            },
            body: JSON.stringify(requestBody)
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('GhostGraph API Error: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(function(data) {
            if (data.errors) {
                console.error('❌ GraphQL Errors:', data.errors);
                throw new Error('GraphQL Error: ' + data.errors[0].message);
            }
            return data.data;
        })
        .catch(function(error) {
            console.error('❌ GhostGraph API Error:', error);
            throw error;
        });
    };

    /**
     * Get all players from GhostGraph
     */
    this.getPlayers = function() {
        var query = `
            query GetAllPlayers {
                players(
                    orderBy: "totalWinnings",
                    orderDirection: "desc",
                    limit: 100
                ) {
                    items {
                        id
                        totalWins
                        totalLosses
                        totalWinnings
                        bestStreak
                        currentStreak
                        highestMultiplier
                        fastestTime
                        biggestBet
                    }
                }
            }
        `;
        
        return this._makeGraphQLRequest(query)
            .then(function(data) {
                console.log('👥 Players loaded from GhostGraph:', data);
                return data;
            });
    };

    /**
     * Get player by address
     */
    this.getPlayer = function(address) {
        var query = `
            query GetPlayer($playerId: String!) {
                player(id: $playerId) {
                    id
                    totalWins
                    totalLosses
                    totalWinnings
                    bestStreak
                    currentStreak
                    highestMultiplier
                    fastestTime
                    biggestBet
                }
            }
        `;
        
        return this._makeGraphQLRequest(query, { playerId: address })
            .then(function(data) {
                console.log('👤 Player loaded from GhostGraph:', address, data);
                return data;
            });
    };

    /**
     * Get game results for a player
     */
    this.getPlayerGames = function(address) {
        var query = `
            query GetPlayerGames($playerId: String!) {
                gameResults(
                    where: { player: $playerId },
                    orderBy: "timestamp",
                    orderDirection: "desc",
                    limit: 50
                ) {
                    items {
                        id
                        player
                        level
                        betAmount
                        finalPlatform
                        winAmount
                        failed
                        endReason
                        timestamp
                        duration
                    }
                }
            }
        `;
        
        return this._makeGraphQLRequest(query, { playerId: address })
            .then(function(data) {
                console.log('🎮 Player games loaded from GhostGraph:', address, data);
                return data;
            });
    };

    /**
     * Get all game results
     */
    this.getGameResults = function() {
        var query = `
            query GetAllGameResults {
                gameResults(
                    orderBy: "timestamp",
                    orderDirection: "desc",
                    limit: 1000
                ) {
                    items {
                        id
                        player
                        level
                        betAmount
                        finalPlatform
                        winAmount
                        failed
                        endReason
                        timestamp
                        duration
                    }
                }
            }
        `;
        
        return this._makeGraphQLRequest(query)
            .then(function(data) {
                console.log('🎯 Game results loaded from GhostGraph:', data);
                return data;
            });
    };

    /**
     * Get leaderboards with caching
     */
    this.getLeaderboards = function() {
        var now = Date.now();
        var self = this; // Capture this context at the beginning
        
        // Check cache
        if (_oCache.leaderboards && (now - _oCache.lastUpdate) < _oCache.cacheTimeout) {
            console.log('📊 Using cached leaderboards');
            return Promise.resolve(_oCache.leaderboards);
        }

        console.log('🔄 Fetching fresh leaderboards from GhostGraph');
        
        return this.getPlayers()
            .then(function(playersData) {
                var players = playersData.players?.items || [];
                
                // Transform GhostGraph data to our leaderboard format
                var leaderboards = {
                    topEarners: []
                };

                // Process each player
                players.forEach(function(player) {
                    var playerData = {
                        address: player.id,
                        totalWinnings: self._formatBigInt(player.totalWinnings || '0'),
                        totalWins: parseInt(player.totalWins || 0),
                        totalLosses: parseInt(player.totalLosses || 0),
                        bestStreak: parseInt(player.bestStreak || 0),
                        highestMultiplier: self._formatBigInt(player.highestMultiplier || '0', 4), // 4 decimals for multiplier
                        totalGames: parseInt(player.totalWins || 0) + parseInt(player.totalLosses || 0),
                        lastPlayed: new Date().toISOString() // GhostGraph doesn't have this field
                    };
                    
                    // Add to Top Earners if they have any winnings
                    if (playerData.totalWinnings > 0) {
                        leaderboards.topEarners.push(playerData);
                    }
                });

                // Sort leaderboards
                leaderboards.topEarners.sort((a, b) => b.totalWinnings - a.totalWinnings);

                // Limit to top 100
                Object.keys(leaderboards).forEach(function(key) {
                    leaderboards[key] = leaderboards[key].slice(0, 100);
                });
                
                console.log('📊 Final leaderboards (Top 100):', {
                    topEarners: leaderboards.topEarners.length,
                    topEarnersData: leaderboards.topEarners.slice(0, 5)
                });

                // Calculate statistics
                var statistics = {
                    totalGames: players.reduce(function(sum, p) { 
                        return sum + parseInt(p.totalWins || 0) + parseInt(p.totalLosses || 0); 
                    }, 0),
                    totalPlayers: players.length,
                    totalWinnings: players.reduce(function(sum, p) { 
                        return sum + self._formatBigInt(p.totalWinnings || '0'); 
                    }, 0),
                    averageMultiplier: 0, // Will be calculated from game results
                    lastUpdated: new Date().toISOString()
                };

                // Update cache
                _oCache.leaderboards = {
                    leaderboards: leaderboards,
                    statistics: statistics
                };
                _oCache.lastUpdate = now;

                console.log('📊 Leaderboards processed:', leaderboards);
                console.log('📈 Statistics:', statistics);

                return _oCache.leaderboards;
            });
    };

    /**
     * Get player stats with games
     */
    this.getPlayerStats = function(address) {
        var self = this; // Capture this context before Promise.all
        return Promise.all([
            this.getPlayer(address),
            this.getPlayerGames(address)
        ]).then(function(results) {
            var playerData = results[0];
            var gamesData = results[1];
            
            if (!playerData || !playerData.player) {
                return null;
            }

            var player = playerData.player;
            var games = gamesData.gameResults?.items || [];

            // Calculate total losses amount correctly
            // Method 1: Total bets - Total winnings
            var totalBets = games.reduce(function(sum, g) { 
                return sum + self._formatBigInt(g.betAmount || '0'); 
            }, 0);
            var totalWinnings = self._formatBigInt(player.totalWinnings || '0');
            var totalLossesAmount = totalBets - totalWinnings;
            
            // Method 2: Only failed games (fallback)
            var failedGamesLosses = games.filter(function(g) { 
                return parseFloat(g.winAmount || '0') === 0; 
            }).reduce(function(sum, g) { 
                return sum + self._formatBigInt(g.betAmount || '0'); 
            }, 0);
            
            // Use the higher value (more accurate)
            totalLossesAmount = Math.max(totalLossesAmount, failedGamesLosses);
            
            console.log('💰 Loss calculation for', address, ':', {
                totalBets: totalBets,
                totalWinnings: totalWinnings,
                method1_losses: totalBets - totalWinnings,
                method2_losses: failedGamesLosses,
                final_losses: totalLossesAmount
            });

            // Transform GhostGraph data to our format
            var transformedPlayer = {
                address: player.id,
                totalGames: parseInt(player.totalWins || 0) + parseInt(player.totalLosses || 0),
                totalWins: parseInt(player.totalWins || 0),
                totalLosses: parseInt(player.totalLosses || 0),
                totalWinnings: self._formatBigInt(player.totalWinnings || '0'),
                totalLossesAmount: totalLossesAmount,
                bestStreak: parseInt(player.bestStreak || 0),
                highestMultiplier: self._formatBigInt(player.highestMultiplier || '0', 4),
                currentStreak: parseInt(player.currentStreak || 0)
            };

            var transformedGames = games.map(function(game) {
                return {
                    id: game.id,
                    playerAddress: game.player,
                    betAmount: self._formatBigInt(game.betAmount || '0'),
                    difficulty: game.level === 0 ? 'easy' : 'hard',
                    platforms: parseInt(game.finalPlatform || 0),
                    multiplier: parseFloat(game.finalPlatform || 0) > 0 ? 
                        (game.level === 0 ? 
                            [12800, 17100, 22800, 30400, 40500, 53900, 71900, 71900][game.finalPlatform - 1] / 10000 :
                            [16000, 26700, 44400, 74100, 123500, 205800, 343000, 343000][game.finalPlatform - 1] / 10000
                        ) : 0,
                    winnings: self._formatBigInt(game.winAmount || '0'),
                    gameTime: parseInt(game.duration || 0),
                    txHash: null, // GhostGraph doesn't store tx hash
                    timestamp: new Date(parseInt(game.timestamp || 0) * 1000).toISOString()
                };
            });

            console.log('👤 Player stats loaded:', address, transformedPlayer);
            console.log('🎮 Player games loaded:', address, transformedGames);

            return {
                player: transformedPlayer,
                games: transformedGames
            };
        });
    };

    /**
     * Clear cache
     */
    this.clearCache = function() {
        _oCache = {
            players: {},
            leaderboards: {},
            lastUpdate: 0,
            cacheTimeout: 30000
        };
        console.log('🗑️ GhostGraph cache cleared');
    };

    /**
     * Test connection to GhostGraph
     */
    this.testConnection = function() {
        var query = `
            query TestConnection {
                players(limit: 1) {
                    items {
                        id
                    }
                }
            }
        `;
        
        return this._makeGraphQLRequest(query)
            .then(function(data) {
                console.log('✅ GhostGraph connection test successful:', data);
                return true;
            })
            .catch(function(error) {
                console.error('❌ GhostGraph connection test failed:', error);
                console.log('⚠️ GhostGraph endpoint may be incorrect or Graph ID may be wrong');
                console.log('🔧 Please check GhostGraph platform for correct Query URL');
                return false;
            });
    };

    this._init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GhostGraphService;
}

// Global assignment for browser usage
if (typeof window !== 'undefined') {
    window.GhostGraphService = GhostGraphService;
}
