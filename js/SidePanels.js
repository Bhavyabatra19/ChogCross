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
     * Initialize left panel content
     */
    initializeLeftPanel() {
        if (!this.leftPanel) {
            console.log("❌ Left panel not found!");
            return;
        }
        
        console.log("📊 Left panel found, initializing content...");
        
        // Clear existing content
        this.leftPanel.innerHTML = '';
        
        // Create panel header
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `
            <h3>LIVE STATS</h3>
            <div class="difficulty-indicator">${this.currentDifficulty.toUpperCase()}</div>
        `;
        this.leftPanel.appendChild(header);
        
        // Create panel content
        const content = document.createElement('div');
        content.className = 'panel-content';
        
        // Create live stats section
        const liveStatsSection = document.createElement('div');
        liveStatsSection.className = 'panel-section';
        liveStatsSection.innerHTML = `
            <div class="live-stats">
                <div class="stat-item">
                    <span class="stat-label">Current Multiplier</span>
                    <span class="stat-value" id="live-multiplier">1.00x</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Platforms</span>
                    <span class="stat-value" id="live-platforms">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Potential Winnings</span>
                    <span class="stat-value" id="live-potential">0 MON</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Bet Amount</span>
                    <span class="stat-value" id="live-bet">0 MON</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Risk</span>
                    <span class="stat-value" id="live-risk">25% per platform</span>
                </div>
            </div>
        `;
        
        content.appendChild(liveStatsSection);
        
        // Risk info moved to live stats section
        
        this.leftPanel.appendChild(content);
        
        // Store references to live stats elements
        this.liveMultiplier = document.getElementById('live-multiplier');
        this.livePlatforms = document.getElementById('live-platforms');
        this.livePotential = document.getElementById('live-potential');
        this.liveBet = document.getElementById('live-bet');
        this.liveRisk = document.getElementById('live-risk');
        
        console.log("✅ Left panel initialized with live stats only");
    }
    

    /**
     * Initialize right panel content
     */
    initializeRightPanel() {
        if (!this.rightPanel) {
            console.log("❌ Right panel not found!");
            return;
        }
        
        console.log("📋 Right panel found, initializing content...");
        
        // Check if content exists
        const strategyContent = this.rightPanel.querySelector('.strategy-content');
        const tipsContent = this.rightPanel.querySelector('.tips-content');
        
        console.log("📋 Strategy content:", strategyContent ? "✓" : "✗");
        console.log("📋 Tips content:", tipsContent ? "✓" : "✗");
        
        // Update strategy content with dynamic values
        const strategyItems = this.rightPanel.querySelectorAll('.strategy-item');
        console.log("📋 Strategy items found:", strategyItems.length);
        
        strategyItems.forEach((item, index) => {
            const label = item.querySelector('.strategy-label');
            const text = item.querySelector('.strategy-text');
            
            console.log(`📋 Strategy item ${index}:`, label ? label.textContent : "No label", text ? text.textContent : "No text");
            
            if (label && text) {
                if (label.textContent.includes('Easy Mode')) {
                    text.textContent = '25% risk per platform';
                } else if (label.textContent.includes('Hard Mode')) {
                    text.textContent = '40% risk per platform';
                }
            }
        });
        
        console.log("📋 Right panel initialized with strategy and tips");
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
     * Update live stats during gameplay
     */
    updateLiveStats(multiplier, platforms, betAmount) {
        if (!this.liveMultiplier || !this.livePlatforms || !this.livePotential) return;
        
        this.liveMultiplier.textContent = `${multiplier.toFixed(2)}x`;
        this.livePlatforms.textContent = platforms.toString();
        
        const potentialWin = Math.min(betAmount * multiplier, 100); // Max 100 MON
        this.livePotential.textContent = `${potentialWin.toFixed(2)} MON`;
        
        // Update current platform in multiplier table
        this.currentPlatform = platforms;
        this.updateCurrentPlatformHighlight();
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
     * Reset live stats
     */
    resetLiveStats() {
        if (this.liveMultiplier) this.liveMultiplier.textContent = '1.0x';
        if (this.livePlatforms) this.livePlatforms.textContent = '0';
        if (this.livePotential) this.livePotential.textContent = '0.0 MON';
        
        // Keep bet amount as is - don't reset it
        if (this.liveBet && this.currentBetAmount) {
            this.liveBet.textContent = `${this.currentBetAmount} MON`;
        }
        
        // Keep risk display as is - don't reset it
        if (this.liveRisk) {
            this.liveRisk.textContent = `${this.currentDifficulty === 'hard' ? '40%' : '25%'} per platform`;
        }
        
        this.currentPlatform = 0;
        this.updateCurrentPlatformHighlight();
        
        console.log("🔄 SidePanels live stats reset");
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
