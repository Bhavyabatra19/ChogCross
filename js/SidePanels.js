/**
 * Side Panels Manager
 * Manages left (multiplier table) and right (live stats) side panels
 */
class SidePanels {
    constructor() {
        this.leftPanel = null;
        this.rightPanel = null;
        this.multiplierTable = null;
        this.difficultyIndicator = null;
        this.liveMultiplier = null;
        this.livePlatforms = null;
        this.livePotential = null;
        this.currentDifficulty = 'easy';
        this.currentPlatform = 0;
        this.currentBetAmount = 1.0;
        
        this.init();
    }
    
    init() {
        console.log("🚀 SidePanels.init() called");
        
        // DOM'un hazır olmasını bekle
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializePanels();
            });
        } else {
            this.initializePanels();
        }
    }
    
    initializePanels() {
        console.log("🔍 Searching for panel elements...");
        
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        this.multiplierTable = document.getElementById('multiplier-table');
        this.difficultyIndicator = document.getElementById('multiplier-difficulty');
        this.liveMultiplier = document.getElementById('live-multiplier');
        this.livePlatforms = document.getElementById('live-platforms');
        this.livePotential = document.getElementById('live-potential');
        
        console.log("🔍 Element search results:");
        console.log("  - left-panel:", this.leftPanel ? "✓" : "✗");
        console.log("  - right-panel:", this.rightPanel ? "✓" : "✗");
        console.log("  - multiplier-table:", this.multiplierTable ? "✓" : "✗");
        console.log("  - multiplier-difficulty:", this.difficultyIndicator ? "✓" : "✗");
        
        // Initialize panels
        if (this.leftPanel) {
            console.log("📊 Initializing left panel...");
            this.initializeLeftPanel();
        } else {
            console.log("❌ Left panel not found!");
        }
        
        if (this.rightPanel) {
            console.log("📋 Initializing right panel...");
            this.initializeRightPanel();
        } else {
            console.log("❌ Right panel not found!");
        }
        
        console.log("🎯 SidePanels initialized with new frame structure");
        console.log("📊 Left panel:", this.leftPanel ? "✓" : "✗");
        console.log("📊 Right panel:", this.rightPanel ? "✓" : "✗");
    }
    
    /**
     * Initialize left panel content - Now contains wallet UI
     */
    initializeLeftPanel() {
        if (!this.leftPanel) {
            console.log("❌ Left panel not found!");
            return;
        }
        
        console.log("📊 Left panel found, wallet UI will be rendered here...");
        
        // Left panel now contains wallet UI, no need to initialize content here
        // The wallet will be moved here by GameFrameManager
        
        console.log("✅ Left panel ready for wallet UI");
    }
    

    /**
     * Initialize right panel content
     */
    initializeRightPanel() {
        if (!this.rightPanel) {
            console.log("❌ Right panel not found!");
            return;
        }
        
        console.log("📋 Right panel found, initializing SVG menu...");
        
        // Initialize SVG menu system for right panel
        this.initializeRightPanelMenu();
        
        console.log("📋 Right panel initialized with SVG menu");
    }
    
    /**
     * Initialize SVG menu system for right panel
     */
    initializeRightPanelMenu() {
        const menuContainer = this.rightPanel.querySelector('#svg-menu-container-right');
        const menuItems = this.rightPanel.querySelector('#menu-items-right');
        
        if (!menuContainer || !menuItems) {
            console.log("❌ Right panel menu elements not found!");
            return;
        }
        
        // Menu item click handlers
        const menuItemElements = menuItems.querySelectorAll('.menu-item');
        menuItemElements.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = item.id;
                console.log("🎮 Right panel menu item clicked:", itemId);
                
                switch(itemId) {
                    case 'menu-leaderboard-right':
                        this.openLeaderboard();
                        break;
                    case 'menu-options-right':
                        this.openOptions();
                        break;
                    case 'menu-sound-right':
                        this.toggleSound();
                        break;
                    case 'menu-fullscreen-right':
                        this.toggleFullscreen();
                        break;
                    case 'menu-credits-right':
                        this.openCredits();
                        break;
                }
            });
        });
    }
    
    /**
     * Open leaderboard
     */
    openLeaderboard() {
        console.log("🏆 Opening leaderboard...");
        if (window.CLeaderboardNew) {
            const leaderboard = new CLeaderboardNew();
            leaderboard.show();
        }
    }
    
    /**
     * Open options
     */
    openOptions() {
        console.log("⚙️ Opening options...");
        const optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.style.display = 'flex';
            this._initOptionsPanel();
        } else {
            console.error("❌ Options panel not found!");
        }
    }
    
    /**
     * Initialize options panel
     */
    _initOptionsPanel() {
        const self = this;
        
        // Get elements
        const closeBtn = document.getElementById('close-options');
        const applyBtn = document.getElementById('apply-options');
        const resetBtn = document.getElementById('reset-options');
        const musicVolumeSlider = document.getElementById('music-volume');
        const soundVolumeSlider = document.getElementById('sound-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const brightnessValue = document.getElementById('brightness-value');
        const contrastValue = document.getElementById('contrast-value');
        const saturationValue = document.getElementById('saturation-value');
        const fullscreenSelect = document.getElementById('fullscreen-mode');
        
        // Load saved settings
        this._loadOptionsSettings();
        
        // Close button
        if (closeBtn) {
            closeBtn.onclick = function() {
                self._hideOptionsPanel();
            };
        }
        
        // Apply button
        if (applyBtn) {
            applyBtn.onclick = function() {
                self._applyOptionsSettings();
            };
        }
        
        // Reset button
        if (resetBtn) {
            resetBtn.onclick = function() {
                self._resetOptionsSettings();
            };
        }
        
        // Volume sliders
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.oninput = function() {
                musicVolumeValue.textContent = this.value + '%';
            };
        }
        
        if (soundVolumeSlider && soundVolumeValue) {
            soundVolumeSlider.oninput = function() {
                soundVolumeValue.textContent = this.value + '%';
            };
        }
        
        // Display sliders
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.oninput = function() {
                brightnessValue.textContent = this.value + '%';
            };
        }
        
        if (contrastSlider && contrastValue) {
            contrastSlider.oninput = function() {
                contrastValue.textContent = this.value + '%';
            };
        }
        
        if (saturationSlider && saturationValue) {
            saturationSlider.oninput = function() {
                saturationValue.textContent = this.value + '%';
            };
        }
        
        // Click outside to close
        const optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.onclick = function(e) {
                if (e.target === optionsPanel) {
                    self._hideOptionsPanel();
                }
            };
        }
    }
    
    /**
     * Hide options panel
     */
    _hideOptionsPanel() {
        const optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.style.display = 'none';
        }
    }
    
    /**
     * Load options settings
     */
    _loadOptionsSettings() {
        // Load saved settings from localStorage
        const musicVolume = localStorage.getItem('musicVolume') || '20';
        const soundVolume = localStorage.getItem('soundVolume') || '100';
        const brightness = localStorage.getItem('brightness') || '100';
        const contrast = localStorage.getItem('contrast') || '100';
        const saturation = localStorage.getItem('saturation') || '100';
        const fullscreenMode = localStorage.getItem('fullscreenMode') || 'windowed';
        
        // Apply to UI
        const musicVolumeSlider = document.getElementById('music-volume');
        const soundVolumeSlider = document.getElementById('sound-volume');
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const fullscreenSelect = document.getElementById('fullscreen-mode');
        
        if (musicVolumeSlider) musicVolumeSlider.value = musicVolume;
        if (soundVolumeSlider) soundVolumeSlider.value = soundVolume;
        if (brightnessSlider) brightnessSlider.value = brightness;
        if (contrastSlider) contrastSlider.value = contrast;
        if (saturationSlider) saturationSlider.value = saturation;
        if (fullscreenSelect) fullscreenSelect.value = fullscreenMode;
        
        // Update display values
        const musicVolumeValue = document.getElementById('music-volume-value');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        const brightnessValue = document.getElementById('brightness-value');
        const contrastValue = document.getElementById('contrast-value');
        const saturationValue = document.getElementById('saturation-value');
        
        if (musicVolumeValue) musicVolumeValue.textContent = musicVolume + '%';
        if (soundVolumeValue) soundVolumeValue.textContent = soundVolume + '%';
        if (brightnessValue) brightnessValue.textContent = brightness + '%';
        if (contrastValue) contrastValue.textContent = contrast + '%';
        if (saturationValue) saturationValue.textContent = saturation + '%';
    }
    
    /**
     * Apply options settings
     */
    _applyOptionsSettings() {
        const musicVolumeSlider = document.getElementById('music-volume');
        const soundVolumeSlider = document.getElementById('sound-volume');
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const fullscreenSelect = document.getElementById('fullscreen-mode');
        
        // Save to localStorage
        if (musicVolumeSlider) localStorage.setItem('musicVolume', musicVolumeSlider.value);
        if (soundVolumeSlider) localStorage.setItem('soundVolume', soundVolumeSlider.value);
        if (brightnessSlider) localStorage.setItem('brightness', brightnessSlider.value);
        if (contrastSlider) localStorage.setItem('contrast', contrastSlider.value);
        if (saturationSlider) localStorage.setItem('saturation', saturationSlider.value);
        if (fullscreenSelect) localStorage.setItem('fullscreenMode', fullscreenSelect.value);
        
        // Apply to game
        if (musicVolumeSlider && window.s_oSoundTrack) {
            s_oSoundTrack.volume = musicVolumeSlider.value / 100 * 0.2;
        }
        
        console.log("✅ Options applied successfully!");
        this._hideOptionsPanel();
    }
    
    /**
     * Reset options settings
     */
    _resetOptionsSettings() {
        // Reset to defaults
        const musicVolumeSlider = document.getElementById('music-volume');
        const soundVolumeSlider = document.getElementById('sound-volume');
        const brightnessSlider = document.getElementById('brightness');
        const contrastSlider = document.getElementById('contrast');
        const saturationSlider = document.getElementById('saturation');
        const fullscreenSelect = document.getElementById('fullscreen-mode');
        
        if (musicVolumeSlider) musicVolumeSlider.value = '20';
        if (soundVolumeSlider) soundVolumeSlider.value = '100';
        if (brightnessSlider) brightnessSlider.value = '100';
        if (contrastSlider) contrastSlider.value = '100';
        if (saturationSlider) saturationSlider.value = '100';
        if (fullscreenSelect) fullscreenSelect.value = 'windowed';
        
        // Update display values
        const musicVolumeValue = document.getElementById('music-volume-value');
        const soundVolumeValue = document.getElementById('sound-volume-value');
        const brightnessValue = document.getElementById('brightness-value');
        const contrastValue = document.getElementById('contrast-value');
        const saturationValue = document.getElementById('saturation-value');
        
        if (musicVolumeValue) musicVolumeValue.textContent = '20%';
        if (soundVolumeValue) soundVolumeValue.textContent = '100%';
        if (brightnessValue) brightnessValue.textContent = '100%';
        if (contrastValue) contrastValue.textContent = '100%';
        if (saturationValue) saturationValue.textContent = '100%';
        
        console.log("🔄 Options reset to defaults!");
    }
    
    /**
     * Toggle sound
     */
    toggleSound() {
        console.log("🔊 Toggling sound...");
        
        // Toggle global sound state
        if (typeof s_bAudioActive !== 'undefined') {
            s_bAudioActive = !s_bAudioActive;
            if (typeof Howler !== 'undefined') {
                Howler.mute(!s_bAudioActive);
            }
        }
        
        // Toggle soundtrack
        if (window.s_oSoundTrack) {
            if (s_oSoundTrack.volume > 0) {
                s_oSoundTrack.volume = 0;
                console.log("🔇 Sound muted");
            } else {
                s_oSoundTrack.volume = 0.2;
                console.log("🔊 Sound unmuted");
            }
        }
        
        // Play click sound if enabled
        if (s_bAudioActive && typeof playSound === 'function') {
            playSound("click", 1, false);
        }
    }
    
    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        console.log("📺 Toggling fullscreen...");
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("Fullscreen failed:", err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.log("Exit fullscreen failed:", err);
            });
        }
    }
    
    /**
     * Open credits/how to
     */
    openCredits() {
        console.log("📖 Opening credits...");
        if (window.CHowToPanel) {
            new CHowToPanel();
        }
    }
    
    
    /**
     * Reset platform counter (called on cashout/fail)
     */
    resetPlatformCounter() {
        console.log("🔄 Resetting platform counter");
        this.currentPlatform = 0;
        // No need to update multiplier table anymore
    }
    
    /**
     * Update platform counter (called when jumping to next platform)
     */
    updatePlatformCounter(platformNumber) {
        console.log(`🔄 Updating platform counter to: ${platformNumber}`);
        this.currentPlatform = platformNumber;
        // No need to update multiplier table anymore
    }
    
    /**
     * Update live stats during gameplay - Now handled by wallet UI
     */
    updateLiveStats(multiplier, platforms, betAmount) {
        // Live stats are now handled by the wallet UI in the left panel
        console.log(`📊 Live stats updated: ${multiplier.toFixed(2)}x, ${platforms} platforms, ${betAmount} MON bet`);
    }
    
    /**
     * Update current platform highlight in multiplier table
     */
    updateCurrentPlatformHighlight() {
        if (!this.multiplierTable) return;
        
        const rows = this.multiplierTable.querySelectorAll('.multiplier-row');
        rows.forEach((row, index) => {
            if (index === this.currentPlatform) {
                row.classList.add('current');
            } else {
                row.classList.remove('current');
            }
        });
    }
    
    /**
     * Set difficulty and update UI
     */
    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        
        // Update difficulty indicator in header
        const difficultyIndicator = document.querySelector('.difficulty-indicator');
        if (difficultyIndicator) {
            difficultyIndicator.textContent = difficulty.toUpperCase();
            console.log(`🎯 Difficulty indicator updated to: ${difficulty.toUpperCase()}`);
        }
        
        // Update risk display in live stats
        if (this.liveRisk) {
            this.liveRisk.textContent = `${difficulty === 'hard' ? '40%' : '25%'} per platform`;
            console.log(`🎯 Live risk display updated to: ${difficulty === 'hard' ? '40%' : '25%'} per platform`);
        }
        
        console.log(`🎯 SidePanels difficulty set to: ${difficulty}`);
    }
    
    /**
     * Set bet amount for potential win calculations
     */
    setBetAmount(betAmount) {
        this.currentBetAmount = betAmount;
        console.log(`💰 SidePanels bet amount set to: ${betAmount}`);
        
        // Update live bet amount display
        if (this.liveBet) {
            this.liveBet.textContent = `${betAmount} MON`;
            console.log(`💰 Live bet amount updated to: ${betAmount} MON`);
        }
        
        // Update live risk display
        if (this.liveRisk) {
            this.liveRisk.textContent = `${this.currentDifficulty === 'hard' ? '40%' : '25%'} per platform`;
            console.log(`🎯 Live risk updated to: ${this.currentDifficulty === 'hard' ? '40%' : '25%'} per platform`);
        }
        
        // Update potential winnings if we have current multiplier
        if (this.liveMultiplier && this.livePlatforms) {
            const multiplier = parseFloat(this.liveMultiplier.textContent.replace('x', ''));
            const platforms = parseInt(this.livePlatforms.textContent);
            this.updateLiveStats(multiplier, platforms, betAmount);
        }
    }
    
    /**
     * Reset live stats - Now handled by wallet UI
     */
    resetLiveStats() {
        // Live stats are now handled by the wallet UI in the left panel
        this.currentPlatform = 0;
        console.log("🔄 SidePanels live stats reset - handled by wallet UI");
    }
    
    /**
     * Show/hide side panels
     */
    setVisible(visible) {
        if (this.leftPanel) {
            this.leftPanel.style.display = visible ? 'flex' : 'flex'; // Always visible
        }
        if (this.rightPanel) {
            this.rightPanel.style.display = visible ? 'flex' : 'flex'; // Always visible
        }
        
        console.log(`👁️ SidePanels always visible: ${visible}`);
    }
}

// Create global instance
// SidePanels'ı daha geç initialize et
setTimeout(() => {
    window.sidePanels = new SidePanels();
}, 1000);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidePanels;
}
