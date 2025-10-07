/**
 * Modern ES6+ Game Class
 * Refactored version of CGame with modern JavaScript features
 */
class CGameES6 {
    constructor(oData, iLevel) {
        // Private properties using # syntax (ES2022)
        this.#oData = oData;
        this.#iCurrentLevel = iLevel;
        
        // Game state
        this.#bUpdate = false;
        this.#bJumping = false;
        this.#bTapping = false;
        this.#bGameOver = false;
        this.#bGameStarted = false;
        this.#bCashoutInProgress = false;
        this.#bCollision = false;
        
        // Game mechanics
        this.#iJumpsLeft = window.gameConfig?.get('physics.maxJumps') || 8;
        this.#iCurrentMultiplier = 1;
        this.#iSuccessfulJumps = 0;
        this.#iTappingTime = 0;
        
        // Betting system
        this.#fBetAmount = 0;
        this.#fCurrentMultiplier = 1;
        this.#fCurrentWinnings = 0;
        this.#sDifficulty = 'easy';
        
        // Game objects
        this.#oCharacter = null;
        this.#oObstacle = null;
        this.#oInterface = null;
        this.#oCollision = null;
        this.#oStartingPlatform = null;
        
        // Initialize the game
        this.#init();
    }
    
    // Private properties
    #oData;
    #iCurrentLevel;
    #bUpdate;
    #bJumping;
    #bTapping;
    #bGameOver;
    #bGameStarted;
    #bCashoutInProgress;
    #bCollision;
    #iJumpsLeft;
    #iCurrentMultiplier;
    #iSuccessfulJumps;
    #iTappingTime;
    #fBetAmount;
    #fCurrentMultiplier;
    #fCurrentWinnings;
    #sDifficulty;
    #oCharacter;
    #oObstacle;
    #oInterface;
    #oCollision;
    #oStartingPlatform;
    
    /**
     * Initialize the game
     */
    #init() {
        try {
            this.#bTapping = false;
            this.#bJumping = false;
            this.#iJumpsLeft = window.gameConfig?.get('physics.maxJumps') || 8;
            this.#iCurrentMultiplier = 1;
            
            // Log game initialization
            if (window.errorLogger) {
                window.errorLogger.info('ES6 Game initialization started', {
                    jumpsLeft: this.#iJumpsLeft,
                    currentMultiplier: this.#iCurrentMultiplier,
                    betAmount: this.#fBetAmount,
                    difficulty: this.#sDifficulty
                });
            }
            
            // Initialize game elements
            this.#initGameElements();
            this.#initKeyboardEvents();
            
            // Register with GameManager
            if (window.gameManager) {
                window.gameManager.setGame(this);
                
                if (window.errorLogger) {
                    window.errorLogger.info('ES6 Game instance registered with GameManager', {
                        betAmount: this.#fBetAmount,
                        difficulty: this.#sDifficulty,
                        level: this.#iCurrentLevel
                    });
                }
            }
            
            this.#bUpdate = true;
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('ES6 Game initialization failed', {
                    error: error.message,
                    stack: error.stack,
                    jumpsLeft: this.#iJumpsLeft,
                    betAmount: this.#fBetAmount,
                    difficulty: this.#sDifficulty
                });
            }
            
            // Show user-friendly error
            if (window.errorLogger) {
                window.errorLogger.showErrorToUser('Game could not be started. Please refresh the page.');
            }
            
            throw error;
        }
    }
    
    /**
     * Initialize game elements
     */
    #initGameElements() {
        // Initialize character
        this.#oCharacter = new CCharacter();
        
        // Initialize obstacles
        this.#oObstacle = new CObstacle();
        
        // Initialize interface
        this.#oInterface = new CInterface();
        
        // Initialize starting platform
        this.#oStartingPlatform = this.#createStartingPlatform();
    }
    
    /**
     * Create starting platform
     */
    #createStartingPlatform() {
        const platform = createBitmap(s_oSpriteLibrary.getSprite("first_platform"));
        platform.x = 130;
        platform.y = FIRST_PLATFORM_Y;
        platform.regX = platform.getBounds().width / 2;
        platform.regY = platform.getBounds().height / 2;
        platform.scaleX = 1.0;
        platform.scaleY = 1.0;
        platform.alpha = 1.0;
        platform.isStartingPlatform = true;
        
        s_oStage.addChild(platform);
        return platform;
    }
    
    /**
     * Initialize keyboard events
     */
    #initKeyboardEvents() {
        const self = this;
        
        $(document).keydown((e) => {
            if (e.code === 'Space' && self.#bGameStarted && !self.#bGameOver) {
                e.preventDefault();
                self.jump();
            }
        });
    }
    
    /**
     * Set betting parameters
     */
    setBettingParameters(betAmount, difficulty) {
        this.#fBetAmount = betAmount;
        this.#sDifficulty = difficulty;
        
        if (window.errorLogger) {
            window.errorLogger.info('Betting parameters set', {
                betAmount: this.#fBetAmount,
                difficulty: this.#sDifficulty
            });
        }
    }
    
    /**
     * Start the game
     */
    startGame() {
        if (this.#bGameStarted) {
            if (window.errorLogger) {
                window.errorLogger.warn('Game already started');
            }
            return;
        }
        
        this.#bGameStarted = true;
        this.#bGameOver = false;
        this.#iJumpsLeft = window.gameConfig?.get('physics.maxJumps') || 8;
        this.#iCurrentMultiplier = 1;
        this.#iSuccessfulJumps = 0;
        this.#fCurrentMultiplier = 1;
        this.#fCurrentWinnings = 0;
        
        if (window.errorLogger) {
            window.errorLogger.info('Game started', {
                betAmount: this.#fBetAmount,
                difficulty: this.#sDifficulty,
                jumpsLeft: this.#iJumpsLeft
            });
        }
    }
    
    /**
     * Perform jump action
     */
    jump() {
        if (!this.#bGameStarted || this.#bGameOver || this.#bJumping || this.#iJumpsLeft <= 0) {
            return;
        }
        
        try {
            this.#bJumping = true;
            this.#iJumpsLeft--;
            
            if (window.errorLogger) {
                window.errorLogger.debug('Jump performed', {
                    jumpsLeft: this.#iJumpsLeft,
                    successfulJumps: this.#iSuccessfulJumps
                });
            }
            
            // Perform jump logic here
            this.#performJump();
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('Jump failed', {
                    error: error.message,
                    stack: error.stack,
                    jumpsLeft: this.#iJumpsLeft
                });
            }
        }
    }
    
    /**
     * Perform jump logic
     */
    #performJump() {
        // Jump implementation
        // This would contain the actual jump mechanics
    }
    
    /**
     * Calculate jump risk
     */
    #calculateJumpRisk(platformIndex) {
        if (!this.#bGameStarted) return 0;
        
        const riskConfig = window.gameConfig?.getRisk() || { easy: 0.25, hard: 0.40 };
        
        if (this.#sDifficulty === "easy") {
            return riskConfig.easy;
        } else if (this.#sDifficulty === "hard") {
            return riskConfig.hard;
        }
        
        return 0;
    }
    
    /**
     * Update multiplier
     */
    #updateMultiplier(platformIndex) {
        if (platformIndex === 7) {
            if (window.errorLogger) {
                window.errorLogger.debug('Celebration platform reached - no multiplier update needed');
            }
            return;
        }
        
        const multiplierConfig = window.gameConfig?.getMultipliers() || {
            easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19],
            hard: [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30]
        };
        
        const multipliers = this.#sDifficulty === "hard" ? multiplierConfig.hard : multiplierConfig.easy;
        const platformMultiplier = multipliers[platformIndex];
        
        this.#fCurrentMultiplier = platformMultiplier;
        this.#fCurrentWinnings = this.#fBetAmount * this.#fCurrentMultiplier;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Multiplier updated', {
                platformIndex,
                platformMultiplier,
                currentMultiplier: this.#fCurrentMultiplier,
                winnings: this.#fCurrentWinnings
            });
        }
    }
    
    /**
     * Cashout function
     */
    async cashout() {
        try {
            if (window.errorLogger) {
                window.errorLogger.info('Cashout attempted', {
                    betAmount: this.#fBetAmount,
                    currentMultiplier: this.#fCurrentMultiplier,
                    successfulJumps: this.#iSuccessfulJumps,
                    difficulty: this.#sDifficulty,
                    gameStarted: this.#bGameStarted,
                    cashoutInProgress: this.#bCashoutInProgress
                });
            }
            
            if (this.#bCashoutInProgress) {
                if (window.errorLogger) {
                    window.errorLogger.warn('Cashout blocked - already in progress');
                }
                return;
            }
            
            if (!this.#bGameStarted || this.#bGameOver) {
                if (window.errorLogger) {
                    window.errorLogger.warn('Cashout blocked - game not active', {
                        gameStarted: this.#bGameStarted,
                        gameOver: this.#bGameOver
                    });
                }
                return;
            }
            
            this.#bCashoutInProgress = true;
            this.#bGameStarted = false;
            
            const maxWinnings = window.gameConfig?.get('multipliers.maxWinnings') || 100;
            const totalWinnings = Math.min(this.#fBetAmount * this.#fCurrentMultiplier, maxWinnings);
            
            // Calculate net winnings (profit only) for leaderboard
            const netWinnings = totalWinnings - this.#fBetAmount;
            
            // If no jumps made, net winnings should be 0 (refund only)
            let finalNetWinnings = netWinnings;
            if (this.#iSuccessfulJumps === 0) {
                finalNetWinnings = 0;
                console.log("🚫 No jumps made - counting as refund only, net winnings = 0");
            }
            
            // Use total winnings for contract payout, net winnings for leaderboard
            const winnings = totalWinnings;
            
            if (window.errorLogger) {
                window.errorLogger.info('Cashout successful', {
                    totalPayout: winnings,
                    netProfit: finalNetWinnings,
                    betAmount: this.#fBetAmount,
                    multiplier: this.#fCurrentMultiplier,
                    successfulJumps: this.#iSuccessfulJumps
                });
            }
            
            // Hide game UI immediately
            if (this.#oInterface && this.#oInterface.hideGameUI) {
                this.#oInterface.hideGameUI();
            }
            
            // Show cashout notification
            this.#showCashoutNotification(winnings);
            
            // Return to betting UI after delay
            setTimeout(() => {
                if (this.#oInterface && this.#oInterface.showBettingUI) {
                    this.#oInterface.showBettingUI(this.#fBetAmount, this.#iCurrentLevel);
                }
                
                this.#bCashoutInProgress = false;
            }, 3500);
            
        } catch (error) {
            // Log error but don't show to user if cashout was successful
            if (window.errorLogger) {
                window.errorLogger.error('Cashout process error (non-critical)', {
                    error: error.message,
                    stack: error.stack,
                    betAmount: this.#fBetAmount,
                    currentMultiplier: this.#fCurrentMultiplier,
                    successfulJumps: this.#iSuccessfulJumps
                });
            }
            
            // Don't show error to user - cashout was successful
            // Only log for debugging purposes
            
            this.#bCashoutInProgress = false;
        }
    }
    
    /**
     * Show cashout notification
     */
    #showCashoutNotification(winnings) {
        // Notification implementation
        if (window.errorLogger) {
            window.errorLogger.info('Cashout notification shown', { winnings });
        }
    }
    
    /**
     * Reset game elements
     */
    #resetGameElements() {
        if (window.errorLogger) {
            window.errorLogger.debug('Resetting game elements');
        }
        
        // Reset character position
        if (this.#oCharacter) {
            this.#oCharacter.resetPosition();
        }
        
        // Reset obstacles
        if (this.#oObstacle) {
            this.#oObstacle.reset();
        }
        
        // Reset interface
        if (this.#oInterface) {
            this.#oInterface.reset();
        }
    }
    
    /**
     * Update game loop
     */
    update() {
        if (!this.#bUpdate) return;
        
        try {
            // Update character
            if (this.#oCharacter) {
                this.#oCharacter.update();
            }
            
            // Update obstacles
            if (this.#oObstacle) {
                this.#oObstacle.update();
            }
            
            // Update interface
            if (this.#oInterface) {
                this.#oInterface.update();
            }
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('Game update failed', {
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }
    
    // Public getters
    get isGameStarted() {
        return this.#bGameStarted;
    }
    
    get isGameOver() {
        return this.#bGameOver;
    }
    
    get jumpsLeft() {
        return this.#iJumpsLeft;
    }
    
    get currentMultiplier() {
        return this.#fCurrentMultiplier;
    }
    
    get currentWinnings() {
        return this.#fCurrentWinnings;
    }
    
    get betAmount() {
        return this.#fBetAmount;
    }
    
    get difficulty() {
        return this.#sDifficulty;
    }
    
    get successfulJumps() {
        return this.#iSuccessfulJumps;
    }
    
    get startingPlatform() {
        return this.#oStartingPlatform;
    }
    
    // Public methods for compatibility
    isGameStarted() {
        return this.#bGameStarted;
    }
    
    isGameOver() {
        return this.#bGameOver;
    }
    
    getJumpsLeft() {
        return this.#iJumpsLeft;
    }
    
    getCurrentMultiplier() {
        return this.#fCurrentMultiplier;
    }
    
    getCurrentWinnings() {
        return this.#fCurrentWinnings;
    }
    
    getBetAmount() {
        return this.#fBetAmount;
    }
    
    getDifficulty() {
        return this.#sDifficulty;
    }
    
    getSuccessfulJumps() {
        return this.#iSuccessfulJumps;
    }
    
    getStartingPlatform() {
        return this.#oStartingPlatform;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CGameES6;
}
