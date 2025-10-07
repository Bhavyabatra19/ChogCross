/**
 * Game Manager - Centralized game state management
 * Reduces global variable usage and provides better encapsulation
 */
class GameManager {
    constructor() {
        this.game = null;
        this.main = null;
        this.stage = null;
        this.spriteLibrary = null;
        this.soundTrack = null;
        this.canvas = null;
        this.interface = null;
        this.menu = null;
        
        // Game state
        this.gameState = {
            mobile: false,
            audioActive: true,
            fullscreen: false,
            storageAvailable: true,
            firstPlay: true,
            levelReached: 1,
            bestScore: 0
        };
        
        // Performance tracking
        this.performance = {
            cntTime: 0,
            timeElaps: 0,
            prevTime: 0,
            cntFps: 0,
            curFps: 0
        };
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize the game manager
     */
    init() {
        try {
            // Detect mobile
            this.gameState.mobile = jQuery.browser.mobile;
            
            // Check storage availability
            try {
                localStorage.setItem("test", "test");
                localStorage.removeItem("test");
                this.gameState.storageAvailable = true;
            } catch (e) {
                this.gameState.storageAvailable = false;
            }
            
            // Load best score
            if (this.gameState.storageAvailable) {
                const bestScore = localStorage.getItem("chog_cross_bestscore");
                if (bestScore) {
                    this.gameState.bestScore = parseInt(bestScore);
                }
            }
            
            if (window.errorLogger) {
                window.errorLogger.info('GameManager initialized', {
                    mobile: this.gameState.mobile,
                    storageAvailable: this.gameState.storageAvailable,
                    bestScore: this.gameState.bestScore
                });
            }
            
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('GameManager initialization failed', {
                    error: error.message,
                    stack: error.stack
                });
            }
            throw error;
        }
    }
    
    /**
     * Set game instance
     */
    setGame(gameInstance) {
        this.game = gameInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Game instance set', {
                gameStarted: gameInstance ? gameInstance.isGameStarted() : false
            });
        }
    }
    
    /**
     * Get game instance
     */
    getGame() {
        return this.game;
    }
    
    /**
     * Set main instance
     */
    setMain(mainInstance) {
        this.main = mainInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Main instance set');
        }
    }
    
    /**
     * Get main instance
     */
    getMain() {
        return this.main;
    }
    
    /**
     * Set stage instance
     */
    setStage(stageInstance) {
        this.stage = stageInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Stage instance set', {
                numChildren: stageInstance ? stageInstance.numChildren : 0
            });
        }
    }
    
    /**
     * Get stage instance
     */
    getStage() {
        return this.stage;
    }
    
    /**
     * Set sprite library instance
     */
    setSpriteLibrary(spriteLibraryInstance) {
        this.spriteLibrary = spriteLibraryInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Sprite library instance set', {
                numSprites: spriteLibraryInstance ? spriteLibraryInstance.getNumSprites() : 0
            });
        }
    }
    
    /**
     * Get sprite library instance
     */
    getSpriteLibrary() {
        return this.spriteLibrary;
    }
    
    /**
     * Set canvas instance
     */
    setCanvas(canvasInstance) {
        this.canvas = canvasInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Canvas instance set', {
                width: canvasInstance ? canvasInstance.width : 0,
                height: canvasInstance ? canvasInstance.height : 0
            });
        }
    }
    
    /**
     * Get canvas instance
     */
    getCanvas() {
        return this.canvas;
    }
    
    /**
     * Set interface instance
     */
    setInterface(interfaceInstance) {
        this.interface = interfaceInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Interface instance set');
        }
    }
    
    /**
     * Get interface instance
     */
    getInterface() {
        return this.interface;
    }
    
    /**
     * Set menu instance
     */
    setMenu(menuInstance) {
        this.menu = menuInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Menu instance set');
        }
    }
    
    /**
     * Get menu instance
     */
    getMenu() {
        return this.menu;
    }
    
    /**
     * Set sound track
     */
    setSoundTrack(soundTrackInstance) {
        this.soundTrack = soundTrackInstance;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Sound track set');
        }
    }
    
    /**
     * Get sound track
     */
    getSoundTrack() {
        return this.soundTrack;
    }
    
    /**
     * Get game state
     */
    getGameState() {
        return { ...this.gameState };
    }
    
    /**
     * Update game state
     */
    updateGameState(updates) {
        this.gameState = { ...this.gameState, ...updates };
        
        if (window.errorLogger) {
            window.errorLogger.debug('Game state updated', updates);
        }
    }
    
    /**
     * Get performance data
     */
    getPerformance() {
        return { ...this.performance };
    }
    
    /**
     * Update performance data
     */
    updatePerformance(updates) {
        this.performance = { ...this.performance, ...updates };
    }
    
    /**
     * Save best score
     */
    saveBestScore(score) {
        if (score > this.gameState.bestScore) {
            this.gameState.bestScore = score;
            
            if (this.gameState.storageAvailable) {
                try {
                    localStorage.setItem("chog_cross_bestscore", score.toString());
                    
                    if (window.errorLogger) {
                        window.errorLogger.info('Best score saved', {
                            score: score,
                            previousBest: this.gameState.bestScore
                        });
                    }
                } catch (error) {
                    if (window.errorLogger) {
                        window.errorLogger.error('Failed to save best score', {
                            error: error.message,
                            score: score
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Get best score
     */
    getBestScore() {
        return this.gameState.bestScore;
    }
    
    /**
     * Set audio active state
     */
    setAudioActive(active) {
        this.gameState.audioActive = active;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Audio state changed', {
                active: active
            });
        }
    }
    
    /**
     * Get audio active state
     */
    isAudioActive() {
        return this.gameState.audioActive;
    }
    
    /**
     * Set fullscreen state
     */
    setFullscreen(fullscreen) {
        this.gameState.fullscreen = fullscreen;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Fullscreen state changed', {
                fullscreen: fullscreen
            });
        }
    }
    
    /**
     * Get fullscreen state
     */
    isFullscreen() {
        return this.gameState.fullscreen;
    }
    
    /**
     * Set mobile state
     */
    setMobile(mobile) {
        this.gameState.mobile = mobile;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Mobile state changed', {
                mobile: mobile
            });
        }
    }
    
    /**
     * Get mobile state
     */
    isMobile() {
        return this.gameState.mobile;
    }
    
    /**
     * Set first play state
     */
    setFirstPlay(firstPlay) {
        this.gameState.firstPlay = firstPlay;
        
        if (window.errorLogger) {
            window.errorLogger.debug('First play state changed', {
                firstPlay: firstPlay
            });
        }
    }
    
    /**
     * Get first play state
     */
    isFirstPlay() {
        return this.gameState.firstPlay;
    }
    
    /**
     * Set level reached
     */
    setLevelReached(level) {
        this.gameState.levelReached = level;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Level reached updated', {
                level: level
            });
        }
    }
    
    /**
     * Get level reached
     */
    getLevelReached() {
        return this.gameState.levelReached;
    }
    
    /**
     * Reset all instances
     */
    reset() {
        this.game = null;
        this.main = null;
        this.stage = null;
        this.spriteLibrary = null;
        this.soundTrack = null;
        this.canvas = null;
        this.interface = null;
        this.menu = null;
        
        if (window.errorLogger) {
            window.errorLogger.info('GameManager reset - all instances cleared');
        }
    }
    
    /**
     * Get all instances (for debugging)
     */
    getAllInstances() {
        return {
            game: this.game,
            main: this.main,
            stage: this.stage,
            spriteLibrary: this.spriteLibrary,
            soundTrack: this.soundTrack,
            canvas: this.canvas,
            interface: this.interface,
            menu: this.menu
        };
    }
    
    /**
     * Validate all instances
     */
    validateInstances() {
        const issues = [];
        
        if (!this.stage) {
            issues.push('Stage not initialized');
        }
        
        if (!this.spriteLibrary) {
            issues.push('Sprite library not initialized');
        }
        
        if (!this.canvas) {
            issues.push('Canvas not initialized');
        }
        
        if (issues.length > 0) {
            if (window.errorLogger) {
                window.errorLogger.warn('Instance validation failed', {
                    issues: issues
                });
            }
            return false;
        }
        
        return true;
    }
}

// Create global instance
window.gameManager = new GameManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManager;
}
