/**
 * AutoModeManager.js - Auto Mode Management System
 * Handles automatic gameplay, platform targeting, and auto cashout/fail
 */

function AutoModeManager() {
    var _bAutoMode = false;
    var _iTargetPlatform = 1;
    var _iCurrentPlatform = 0;
    var _bAutoJumping = false;
    var _oAutoTimer = null;
    var _bVRFReady = false;
    var _bGameStarted = false;
    var _iJumpInterval = 5000; // 5 seconds
    var _bAutoCashoutEnabled = true;
    var _bAutoFailEnabled = true;
    
    // Auto settings from localStorage
    var _oAutoSettings = {
        targetPlatform: 1,
        jumpInterval: 5000,
        autoCashout: true,
        autoFail: true
    };
    
    // Initialize auto mode manager
    this.init = function() {
        console.log("🤖 AutoModeManager initialized");
        this.loadAutoSettings();
        this.setupEventListeners();
    };
    
    // Load auto settings from localStorage
    this.loadAutoSettings = function() {
        try {
            var savedSettings = localStorage.getItem('chogCrossAutoSettings');
            if (savedSettings) {
                _oAutoSettings = JSON.parse(savedSettings);
                _iTargetPlatform = _oAutoSettings.targetPlatform;
                _iJumpInterval = _oAutoSettings.jumpInterval;
                _bAutoCashoutEnabled = _oAutoSettings.autoCashout;
                _bAutoFailEnabled = _oAutoSettings.autoFail;
                console.log("📱 Auto settings loaded:", _oAutoSettings);
            }
        } catch (e) {
            console.warn("⚠️ Failed to load auto settings:", e);
        }
    };
    
    // Save auto settings to localStorage
    this.saveAutoSettings = function() {
        try {
            _oAutoSettings.targetPlatform = _iTargetPlatform;
            _oAutoSettings.jumpInterval = _iJumpInterval;
            _oAutoSettings.autoCashout = _bAutoCashoutEnabled;
            _oAutoSettings.autoFail = _bAutoFailEnabled;
            localStorage.setItem('chogCrossAutoSettings', JSON.stringify(_oAutoSettings));
            console.log("💾 Auto settings saved:", _oAutoSettings);
        } catch (e) {
            console.warn("⚠️ Failed to save auto settings:", e);
        }
    };
    
    // Setup event listeners
    this.setupEventListeners = function() {
        // VRF ready event
        window.addEventListener('vrfReady', function(event) {
            _bVRFReady = true;
            console.log("🎲 VRF ready for auto mode");
            if (_bAutoMode && _bGameStarted) {
                this.startAutoJumping();
            }
        }.bind(this));
        
        // Game start event
        window.addEventListener('gameStarted', function(event) {
            _bGameStarted = true;
            _iCurrentPlatform = 0;
            console.log("🎮 Game started for auto mode");
            // VRF ready event will trigger auto jumping
        }.bind(this));
        
        // Game over event
        window.addEventListener('gameOver', function(event) {
            this.stopAutoJumping();
            _bGameStarted = false;
            console.log("💀 Game over for auto mode");
        }.bind(this));
        
        // Platform landing event
        window.addEventListener('platformLanded', function(event) {
            if (_bAutoMode) {
                _iCurrentPlatform = event.detail.platformNumber;
                console.log("🏁 Landed on platform:", _iCurrentPlatform);
                this.checkAutoActions();
            }
        }.bind(this));
        
        // Difficulty change event (custom event)
        window.addEventListener('difficultyChanged', function(event) {
            console.log("🎯 Difficulty changed to:", event.detail.difficulty);
            this.updateAutoSettingsDisplay();
        }.bind(this));
    };
    
    // Set auto mode
    this.setAutoMode = function(bEnabled) {
        _bAutoMode = bEnabled;
        console.log("🤖 Auto mode:", _bAutoMode ? "ENABLED" : "DISABLED");
        
        if (_bAutoMode) {
            this.showAutoSettingsPanel();
        } else {
            this.stopAutoJumping();
        }
    };
    
    // Show auto settings panel
    this.showAutoSettingsPanel = function() {
        var panel = document.getElementById('auto-settings-panel');
        if (panel) {
            panel.style.display = 'flex';
            // Update display with current difficulty and platform
            console.log("🎯 Auto settings panel opened - Current difficulty:", this.getCurrentDifficulty());
            this.updateAutoSettingsDisplay();
        }
    };
    
    // Hide auto settings panel
    this.hideAutoSettingsPanel = function() {
        var panel = document.getElementById('auto-settings-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    };
    
    // Update auto settings display
    this.updateAutoSettingsDisplay = function() {
        var platformDisplay = document.getElementById('platform-display');
        var platformMultiplier = document.getElementById('platform-multiplier');
        var platformWinnings = document.getElementById('platform-winnings');
        
        if (platformDisplay) {
            platformDisplay.textContent = _iTargetPlatform;
        }
        
        if (platformMultiplier && platformWinnings) {
            // Calculate multiplier and winnings based on target platform
            var multiplier = this.calculatePlatformMultiplier(_iTargetPlatform);
            var winnings = this.calculatePlatformWinnings(_iTargetPlatform);
            
            platformMultiplier.textContent = multiplier.toFixed(2) + "x";
            platformWinnings.textContent = winnings.toFixed(2) + " MON";
        }
    };
    
    // Calculate platform multiplier using real game multipliers
    this.calculatePlatformMultiplier = function(platformNumber) {
        // Get current difficulty
        var difficulty = this.getCurrentDifficulty();
        
        // Real game multipliers
        var multipliers = {
            easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19, 7.19], // Added 8th platform (celebration)
            hard: [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30, 34.30] // Added 8th platform (celebration)
        };
        
        var platformIndex = Math.max(0, Math.min(platformNumber - 1, multipliers[difficulty].length - 1));
        return multipliers[difficulty][platformIndex];
    };
    
    // Get current difficulty
    this.getCurrentDifficulty = function() {
        try {
            // Check if game is active and has difficulty
            if (window.s_oGame && window.s_oGame.getDifficulty) {
                return window.s_oGame.getDifficulty();
            }
            
            // Check difficulty buttons
            var easyBtn = document.getElementById('easy-mode');
            var hardBtn = document.getElementById('hard-mode');
            
            if (easyBtn && easyBtn.classList.contains('active')) {
                return 'easy';
            } else if (hardBtn && hardBtn.classList.contains('active')) {
                return 'hard';
            }
            
            // Check CreateJS difficulty buttons
            if (window.s_oGame && window.s_oGame._sCurrentDifficulty) {
                return window.s_oGame._sCurrentDifficulty;
            }
            
        } catch (e) {
            console.warn("⚠️ Failed to get difficulty:", e);
        }
        
        return 'easy'; // Default to easy
    };
    
    // Calculate platform winnings
    this.calculatePlatformWinnings = function(platformNumber) {
        var multiplier = this.calculatePlatformMultiplier(platformNumber);
        var betAmount = this.getCurrentBetAmount();
        return betAmount * multiplier;
    };
    
    // Get current bet amount
    this.getCurrentBetAmount = function() {
        try {
            // Try to get bet from game object first
            if (window.s_oGame && window.s_oGame.getBetAmount) {
                return window.s_oGame.getBetAmount();
            }
            
            // Try HTML bet display
            var betDisplay = document.getElementById('bet-display');
            if (betDisplay) {
                var betText = betDisplay.textContent;
                var betValue = parseFloat(betText.replace(' MON', ''));
                return betValue || 1.0;
            }
            
            // Try CreateJS bet text
            if (window.s_oGame && window.s_oGame._betValueText) {
                var betText = window.s_oGame._betValueText.text;
                var betValue = parseFloat(betText.replace(' MON', ''));
                return betValue || 1.0;
            }
            
        } catch (e) {
            console.warn("⚠️ Failed to get bet amount:", e);
        }
        return 1.0; // Default fallback
    };
    
    // Set target platform
    this.setTargetPlatform = function(platformNumber) {
        if (platformNumber >= 1 && platformNumber <= 7) {
            _iTargetPlatform = platformNumber;
            this.updateAutoSettingsDisplay();
            console.log("🎯 Target platform set to:", _iTargetPlatform);
        }
    };
    
    // Increase target platform
    this.increaseTargetPlatform = function() {
        if (_iTargetPlatform < 7) {
            this.setTargetPlatform(_iTargetPlatform + 1);
        }
    };
    
    // Decrease target platform
    this.decreaseTargetPlatform = function() {
        if (_iTargetPlatform > 1) {
            this.setTargetPlatform(_iTargetPlatform - 1);
        }
    };
    
    // Start auto jumping
    this.startAutoJumping = function() {
        if (!_bAutoMode || _bAutoJumping || !_bVRFReady) {
            console.log("🚫 Auto jumping blocked - AutoMode:", _bAutoMode, "Jumping:", _bAutoJumping, "VRF:", _bVRFReady);
            return;
        }
        
        console.log("🚀 Starting auto jumping to platform:", _iTargetPlatform);
        _bAutoJumping = true;
        
        // Start the auto jump timer
        _oAutoTimer = setInterval(function() {
            this.performAutoJump();
        }.bind(this), _iJumpInterval);
    };
    
    // Stop auto jumping
    this.stopAutoJumping = function() {
        if (_oAutoTimer) {
            clearInterval(_oAutoTimer);
            _oAutoTimer = null;
        }
        _bAutoJumping = false;
        console.log("⏹️ Auto jumping stopped");
    };
    
    // Perform auto jump
    this.performAutoJump = async function() {
        if (!_bAutoMode || !_bGameStarted || !_bVRFReady) {
            console.log("🚫 Auto jump blocked - AutoMode:", _bAutoMode, "GameStarted:", _bGameStarted, "VRF:", _bVRFReady);
            return;
        }
        
        console.log("🤖 Performing auto jump...");
        
        // Trigger jump via game interface
        if (window.s_oGame && typeof window.s_oGame.tapScreen === 'function') {
            try {
                await window.s_oGame.tapScreen();
                console.log("✅ Auto jump completed");
            } catch (error) {
                console.error("❌ Auto jump failed:", error);
            }
        } else if (window.s_oGame && typeof window.s_oGame.jump === 'function') {
            try {
                await window.s_oGame.jump();
                console.log("✅ Auto jump completed");
            } catch (error) {
                console.error("❌ Auto jump failed:", error);
            }
        } else {
            console.warn("⚠️ Game jump function not available");
            console.log("🔍 Available game methods:", Object.getOwnPropertyNames(window.s_oGame || {}));
        }
    };
    
    // Check auto actions (cashout/fail)
    this.checkAutoActions = function() {
        if (!_bAutoMode || !_bVRFReady) {
            console.log("🚫 Auto actions blocked - AutoMode:", _bAutoMode, "VRF:", _bVRFReady);
            return;
        }
        
        console.log("🔍 Checking auto actions - Current:", _iCurrentPlatform, "Target:", _iTargetPlatform);
        
        // Check if reached target platform
        if (_iCurrentPlatform === _iTargetPlatform) {
            if (_bAutoCashoutEnabled) {
                console.log("💰 Auto cashout triggered!");
                this.performAutoCashout();
            }
        }
        // Check if missed target platform (fell into water)
        else if (_iCurrentPlatform === 0) {
            if (_bAutoFailEnabled) {
                console.log("💀 Auto fail triggered!");
                this.performAutoFail();
            }
        }
    };
    
    // Perform auto cashout
    this.performAutoCashout = function() {
        if (!_bVRFReady) {
            console.log("🚫 Auto cashout blocked - VRF not ready");
            return;
        }
        
        if (window.s_oGame && window.s_oGame.cashout) {
            console.log("💰 Performing auto cashout...");
            window.s_oGame.cashout();
        } else {
            console.warn("⚠️ Game cashout function not available");
        }
    };
    
    // Perform auto fail
    this.performAutoFail = function() {
        if (!_bVRFReady) {
            console.log("🚫 Auto fail blocked - VRF not ready");
            return;
        }
        
        if (window.s_oGame && window.s_oGame.gameOver) {
            console.log("💀 Performing auto fail...");
            window.s_oGame.gameOver();
        } else {
            console.warn("⚠️ Game gameOver function not available");
        }
    };
    
    // Confirm auto settings
    this.confirmAutoSettings = function() {
        this.saveAutoSettings();
        this.hideAutoSettingsPanel();
        console.log("✅ Auto settings confirmed");
    };
    
    // Cancel auto settings
    this.cancelAutoSettings = function() {
        this.loadAutoSettings(); // Reload saved settings
        this.hideAutoSettingsPanel();
        console.log("❌ Auto settings cancelled");
    };
    
    // Get auto mode status
    this.isAutoMode = function() {
        return _bAutoMode;
    };
    
    // Get target platform
    this.getTargetPlatform = function() {
        return _iTargetPlatform;
    };
    
    // Get current platform
    this.getCurrentPlatform = function() {
        return _iCurrentPlatform;
    };
    
    // Get auto jumping status
    this.isAutoJumping = function() {
        return _bAutoJumping;
    };
    
    // Get VRF ready status
    this.isVRFReady = function() {
        return _bVRFReady;
    };
    
    // Get game started status
    this.isGameStarted = function() {
        return _bGameStarted;
    };
    
    // Cleanup
    this.cleanup = function() {
        this.stopAutoJumping();
        console.log("🧹 AutoModeManager cleaned up");
    };
    
    
    // Initialize on creation
    this.init();
}

// Global instance
window.autoModeManager = new AutoModeManager();
