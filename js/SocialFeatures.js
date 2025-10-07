/**
 * Social Features Manager
 * Handles achievements, social sharing, weekly challenges, and online player count
 */
function SocialFeatures() {
    var _oData = null;
    var _bInitialized = false;
    var _iOnlinePlayers = 0;
    // Achievement array removed
    var _aWeeklyChallenges = [];
    var _oPlayerStats = {};
    
    // Achievement definitions removed
    
    // Weekly challenge definitions
    var _aWeeklyChallengeDefinitions = [
        {
            id: "weekly_streak",
            title: "🏃‍♂️ Weekly Streak Challenge",
            description: "Achieve the longest streak this week",
            icon: "🏃‍♂️",
            type: "streak",
            reward: "200 MON",
            startDate: null,
            endDate: null,
            participants: [],
            leader: null
        },
        {
            id: "weekly_winnings",
            title: "💰 Weekly Winnings Challenge",
            description: "Earn the most MON this week",
            icon: "💰",
            type: "winnings",
            reward: "300 MON",
            startDate: null,
            endDate: null,
            participants: [],
            leader: null
        },
        {
            id: "weekly_games",
            title: "🎮 Weekly Games Challenge",
            description: "Play the most games this week",
            icon: "🎮",
            type: "games",
            reward: "150 MON",
            startDate: null,
            endDate: null,
            participants: [],
            leader: null
        }
    ];
    
    /**
     * Initialize the social features system
     */
    this.init = function() {
        console.log("🌟 Initializing Social Features System...");
        this._loadData();
        this._initWeeklyChallenges();
        this._updateOnlinePlayerCount();
        _bInitialized = true;
        console.log("✅ Social Features initialized successfully!");
    };
    
    /**
     * Load data from localStorage or create default
     */
    this._loadData = function() {
        try {
            var savedData = localStorage.getItem('chogCrossSocialFeatures');
            if (savedData) {
                _oData = JSON.parse(savedData);
                // Achievement data removed
                _oPlayerStats = _oData.playerStats || {};
            } else {
                _oData = {
                    playerStats: {},
                    weeklyChallenges: [],
                    socialShares: 0,
                    lastOnlineUpdate: Date.now()
                };
                _oPlayerStats = {};
            }
        } catch (error) {
            console.error("❌ Error loading social features data:", error);
            _oData = {
                playerStats: {},
                weeklyChallenges: [],
                socialShares: 0,
                lastOnlineUpdate: Date.now()
            };
            _oPlayerStats = {};
        }
    };
    
    /**
     * Initialize weekly challenges
     */
    this._initWeeklyChallenges = function() {
        var now = new Date();
        var startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        var endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        _aWeeklyChallenges = _aWeeklyChallengeDefinitions.map(function(challenge) {
            return {
                ...challenge,
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
                participants: [],
                leader: null
            };
        });
    };
    
    /**
     * Update online player count (simulated)
     */
    this._updateOnlinePlayerCount = function() {
        // Simulate realistic online player count
        var baseCount = 150;
        var variation = Math.floor(Math.random() * 50) - 25; // ±25 variation
        var timeOfDay = new Date().getHours();
        
        // More players during peak hours (12-18)
        if (timeOfDay >= 12 && timeOfDay <= 18) {
            variation += 30;
        }
        
        _iOnlinePlayers = Math.max(50, baseCount + variation);
        
        // Update every 30 seconds
        setTimeout(this._updateOnlinePlayerCount.bind(this), 30000);
    };
    
    /**
     * Get online player count
     */
    this.getOnlinePlayerCount = function() {
        return _iOnlinePlayers;
    };
    
    /**
     * Update player statistics
     */
    this.updatePlayerStats = function(gameData) {
        var playerId = gameData.playerName || "Anonymous";
        
        if (!_oPlayerStats[playerId]) {
            _oPlayerStats[playerId] = {
                wins: 0,
                totalGames: 0,
                totalWinnings: 0,
                maxBet: 0,
                maxStreak: 0,
                hardGames: 0,
                maxMultiplier: 0,
                consecutiveDays: 0,
                lastPlayDate: null,
                shares: 0
            };
        }
        
        var stats = _oPlayerStats[playerId];
        
        // Update basic stats
        stats.totalGames++;
        stats.totalWinnings += gameData.winnings || 0;
        stats.maxBet = Math.max(stats.maxBet, gameData.betAmount || 0);
        stats.maxStreak = Math.max(stats.maxStreak, gameData.successfulJumps || 0);
        stats.maxMultiplier = Math.max(stats.maxMultiplier, gameData.multiplier || 0);
        
        if (gameData.difficulty === "hard") {
            stats.hardGames++;
        }
        
        
        if (gameData.isWin) {
            stats.wins++;
        }
        
        // Update consecutive days
        var today = new Date().toDateString();
        if (stats.lastPlayDate !== today) {
            if (stats.lastPlayDate) {
                var lastDate = new Date(stats.lastPlayDate);
                var todayDate = new Date(today);
                var diffTime = Math.abs(todayDate - lastDate);
                var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    stats.consecutiveDays++;
                } else {
                    stats.consecutiveDays = 1;
                }
            } else {
                stats.consecutiveDays = 1;
            }
            stats.lastPlayDate = today;
        }
        
        // Achievement checking removed
        
        // Update weekly challenges
        this._updateWeeklyChallenges(playerId, gameData);
        
        // Save data
        this._saveData();
    };
    
    // Achievement methods removed
    
    /**
     * Update weekly challenges
     */
    this._updateWeeklyChallenges = function(playerId, gameData) {
        _aWeeklyChallenges.forEach(function(challenge) {
            var participant = challenge.participants.find(function(p) {
                return p.playerId === playerId;
            });
            
            if (!participant) {
                participant = {
                    playerId: playerId,
                    value: 0,
                    games: 0
                };
                challenge.participants.push(participant);
            }
            
            participant.games++;
            
            switch(challenge.type) {
                case "streak":
                    participant.value = Math.max(participant.value, gameData.successfulJumps || 0);
                    break;
                case "winnings":
                    participant.value += gameData.winnings || 0;
                    break;
                case "games":
                    participant.value = participant.games;
                    break;
            }
            
            // Update leader
            challenge.participants.sort(function(a, b) {
                return b.value - a.value;
            });
            
            if (challenge.participants.length > 0) {
                challenge.leader = challenge.participants[0];
            }
        });
    };
    
    // Achievement sharing methods removed
    
    /**
     * Get weekly challenges
     */
    this.getWeeklyChallenges = function() {
        return _aWeeklyChallenges;
    };
    
    /**
     * Get player stats
     */
    this.getPlayerStats = function(playerId) {
        return _oPlayerStats[playerId] || null;
    };
    
    /**
     * Save data to localStorage
     */
    this._saveData = function() {
        try {
            // Achievement data removed
            _oData.playerStats = _oPlayerStats;
            _oData.weeklyChallenges = _aWeeklyChallenges;
            _oData.lastOnlineUpdate = Date.now();
            
            localStorage.setItem('chogCrossSocialFeatures', JSON.stringify(_oData));
        } catch (error) {
            console.error("❌ Error saving social features data:", error);
        }
    };
    
    /**
     * Check if initialized
     */
    this.isInitialized = function() {
        return _bInitialized;
    };
}

// Make it globally available
window.socialFeatures = new SocialFeatures();
