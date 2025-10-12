/**
 * Game Configuration System
 * Centralized configuration management for all game settings
 */
class GameConfig {
    constructor() {
        this.config = this.getDefaultConfig();
        this.environment = this.detectEnvironment();
        this.loadEnvironmentConfig();
    }
    
    /**
     * Detect current environment
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }
    
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            // Canvas settings
            canvas: {
                width: 1200,
                height: 800,
                uiHeight: 80
            },
            
            // Game physics
            physics: {
                jumpPower: 15,
                maxJumps: 8,
                gravity: 0.98,
                safeLandingMargin: 50
            },
            
            // Character settings
            character: {
                startX: 130,
                startY: 216,
                scale: 0.7,
                jumpCooldownFrames: 15
            },
            
            // Platform settings
            platform: {
                count: 7,
                spacing: 250,
                startX: 400,
                y: 620, // Fix platform Y to previous visual position so sea stays where it was
                scale: 1.2,
                celebrationPlatform: {
                    offsetY: 210,
                    scale: 1.0
                }
            },
            
            // Multiplier settings
            multipliers: {
                easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19],
                hard: [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30],
                maxWinnings: 100
            },
            
            // Risk settings
            risk: {
                easy: 0.25, // 25% risk
                hard: 0.40   // 40% risk
            },
            
            // Betting settings
            betting: {
                minBet: 1.0,
                maxBet: 5.0,
                betStep: 0.1,
                defaultBet: 1.0,
                defaultDifficulty: 'easy'
            },
            
            // Animation settings
            animation: {
                fps: 20,
                fpsTime: 50, // 1000 / fps
                jumpDuration: 400, // milliseconds
                platformAnimationDuration: 1000,
                dustEffectCount: 5,
                dustEffectDuration: 400,
                sharkAttack: {
                    baseScale: 1.25,
                    finalScale: 1.25,
                    frameDuration: 3,
                    totalFrames: 8
                }
            },
            
            // Camera settings
            camera: {
                shiftTriggerJump: 4,
                shiftDistance: -1000,
                shiftDuration: 1000
            },
            
            // UI settings
            ui: {
                primaryColor: '#FFD700',
                secondaryColor: '#00FF00',
                dangerColor: '#FF0000',
                backgroundColor: 'rgba(0,0,0,0.9)',
                fontFamily: 'Orbitron',
                fontSize: {
                    small: 14,
                    medium: 16,
                    large: 18,
                    xlarge: 20,
                    xxlarge: 24,
                    xxxlarge: 32
                }
            },
            
            // Text rendering settings
            textRendering: {
                enableHighQuality: true,
                enableSubpixelRendering: true,
                enableFontSmoothing: true,
                enableKerning: true,
                enableLigatures: true,
                shadowEnabled: true,
                shadowColor: '#000000',
                shadowOffsetX: 1,
                shadowOffsetY: 1,
                shadowBlur: 2,
                optimizeForHighDPI: true,
                fontFallbacks: ['Orbitron', 'Arial', 'Helvetica', 'sans-serif']
            },
            
            // Sound settings
            sound: {
                enabled: true,
                volume: {
                    soundtrack: 0.4,
                    effects: 1.0
                },
                files: {
                    click: './sounds/click',
                    footstep: './sounds/footstep',
                    jump: './sounds/jump',
                    splash: './sounds/splash',
                    soundtrack: './sounds/soundtrack'
                }
            },
            
            // Performance settings
            performance: {
                maxDustEffects: 15,
                dustCleanupInterval: 60, // frames
                emergencyCleanupThreshold: 30,
                maxAge: 2000, // milliseconds
                // Enhanced performance settings
                enableGPUAcceleration: true,
                enableHardwareAcceleration: true,
                optimizeRendering: true,
                maxFrameRate: 60,
                enableVSync: true,
                textureCompression: true,
                enableMipmaps: true
            },
            
            // Advanced Graphics Engine Configuration
            graphics: {
                engine: 'GraphicsEngine', // Use the new advanced graphics engine
                quality: 'auto', // auto, low, medium, high, ultra
                enableWebGL: true,
                enableHardwareAcceleration: true,
                enablePostProcessing: true,
                enableAntialiasing: true,
                enableBloom: true,
                enableToneMapping: true,
                maxFrameRate: 60,
                enableVSync: true,
                devicePixelRatio: window.devicePixelRatio || 1,
                enableMemoryOptimization: true,
                enableFrameRateOptimization: true
            },
            
            // Debug settings
            debug: {
                enabled: false,
                showFPS: false,
                showCollisionBoxes: false,
                logLevel: 'info' // debug, info, warn, error
            }
        };
    }
    
    /**
     * Load environment-specific configuration
     */
    loadEnvironmentConfig() {
        switch (this.environment) {
            case 'development':
                this.config.debug.enabled = true;
                this.config.debug.showFPS = true;
                this.config.debug.logLevel = 'debug';
                this.config.performance.maxDustEffects = 5; // Lower for dev
                break;
                
            case 'staging':
                this.config.debug.enabled = true;
                this.config.debug.logLevel = 'info';
                break;
                
            case 'production':
                this.config.debug.enabled = false;
                this.config.debug.logLevel = 'error';
                this.config.performance.maxDustEffects = 20; // Higher for prod
                break;
        }
        
        // Log configuration load
        if (window.errorLogger) {
            window.errorLogger.info('Configuration loaded', {
                environment: this.environment,
                debugEnabled: this.config.debug.enabled,
                logLevel: this.config.debug.logLevel
            });
        }
    }
    
    /**
     * Get configuration value by path
     * @param {string} path - Dot notation path (e.g., 'canvas.width')
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
    
    /**
     * Set configuration value by path
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.config;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        
        // Log configuration change
        if (window.errorLogger) {
            window.errorLogger.info('Configuration changed', {
                path: path,
                value: value,
                environment: this.environment
            });
        }
    }
    
    /**
     * Get canvas configuration
     */
    getCanvas() {
        return this.get('canvas');
    }
    
    /**
     * Get physics configuration
     */
    getPhysics() {
        return this.get('physics');
    }
    
    /**
     * Get character configuration
     */
    getCharacter() {
        return this.get('character');
    }
    
    /**
     * Get platform configuration
     */
    getPlatform() {
        return this.get('platform');
    }
    
    /**
     * Get multiplier configuration
     */
    getMultipliers() {
        return this.get('multipliers');
    }
    
    /**
     * Get risk configuration
     */
    getRisk() {
        return this.get('risk');
    }
    
    /**
     * Get betting configuration
     */
    getBetting() {
        return this.get('betting');
    }
    
    /**
     * Get animation configuration
     */
    getAnimation() {
        return this.get('animation');
    }
    
    /**
     * Get camera configuration
     */
    getCamera() {
        return this.get('camera');
    }
    
    /**
     * Get UI configuration
     */
    getUI() {
        return this.get('ui');
    }
    
    /**
     * Get text rendering configuration
     */
    getTextRendering() {
        return this.get('textRendering');
    }
    
    /**
     * Get sound configuration
     */
    getSound() {
        return this.get('sound');
    }
    
    /**
     * Get performance configuration
     */
    getPerformance() {
        return this.get('performance');
    }
    
    /**
     * Get graphics configuration
     */
    getGraphics() {
        return this.get('graphics');
    }
    
    /**
     * Get debug configuration
     */
    getDebug() {
        return this.get('debug');
    }
    
    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        
        // Validate canvas
        const canvas = this.getCanvas();
        if (!canvas.width || canvas.width <= 0) {
            errors.push('Canvas width must be positive');
        }
        if (!canvas.height || canvas.height <= 0) {
            errors.push('Canvas height must be positive');
        }
        
        // Validate physics
        const physics = this.getPhysics();
        if (!physics.jumpPower || physics.jumpPower <= 0) {
            errors.push('Jump power must be positive');
        }
        if (!physics.maxJumps || physics.maxJumps <= 0) {
            errors.push('Max jumps must be positive');
        }
        
        // Validate betting
        const betting = this.getBetting();
        if (betting.minBet >= betting.maxBet) {
            errors.push('Min bet must be less than max bet');
        }
        
        // Validate multipliers
        const multipliers = this.getMultipliers();
        if (multipliers.easy.length !== multipliers.hard.length) {
            errors.push('Easy and hard multipliers must have same length');
        }
        
        if (errors.length > 0) {
            if (window.errorLogger) {
                window.errorLogger.error('Configuration validation failed', {
                    errors: errors,
                    environment: this.environment
                });
            }
            throw new Error('Configuration validation failed: ' + errors.join(', '));
        }
        
        return true;
    }
    
    /**
     * Export configuration
     */
    export() {
        return JSON.stringify(this.config, null, 2);
    }
    
    /**
     * Import configuration
     */
    import(configJson) {
        try {
            const importedConfig = JSON.parse(configJson);
            this.config = { ...this.getDefaultConfig(), ...importedConfig };
            this.validate();
            
            if (window.errorLogger) {
                window.errorLogger.info('Configuration imported successfully', {
                    environment: this.environment
                });
            }
            
            return true;
        } catch (error) {
            if (window.errorLogger) {
                window.errorLogger.error('Configuration import failed', {
                    error: error.message,
                    environment: this.environment
                });
            }
            return false;
        }
    }
    
    /**
     * Reset to default configuration
     */
    reset() {
        this.config = this.getDefaultConfig();
        this.loadEnvironmentConfig();
        
        if (window.errorLogger) {
            window.errorLogger.info('Configuration reset to defaults', {
                environment: this.environment
            });
        }
    }
    
    /**
     * Get environment-specific overrides
     */
    getEnvironmentOverrides() {
        const overrides = {
            development: {
                debug: { enabled: true, showFPS: true },
                performance: { maxDustEffects: 5 }
            },
            staging: {
                debug: { enabled: true },
                performance: { maxDustEffects: 10 }
            },
            production: {
                debug: { enabled: false },
                performance: { maxDustEffects: 20 }
            }
        };
        
        return overrides[this.environment] || {};
    }
    
    /**
     * Apply environment overrides
     */
    applyEnvironmentOverrides() {
        const overrides = this.getEnvironmentOverrides();
        
        for (const [key, value] of Object.entries(overrides)) {
            this.set(key, { ...this.get(key), ...value });
        }
    }
}

// Create global instance
window.gameConfig = new GameConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
