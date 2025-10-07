/**
 * Game Frame Manager
 * Manages the new frame-based UI system
 */
class GameFrameManager {
    constructor() {
        this.gameFrame = null;
        this.topPanel = null;
        this.bottomPanel = null;
        this.leftPanel = null;
        this.rightPanel = null;
        this.centerPanel = null;
        
        this.walletContainerFrame = null;
        this.bettingUIFrame = null;
        
        this.init();
    }
    
    init() {
        this.gameFrame = document.getElementById('game-frame-container');
        this.topPanel = document.getElementById('top-panel');
        this.bottomPanel = document.getElementById('bottom-panel');
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        this.centerPanel = document.getElementById('center-panel');
        
        this.walletContainerFrame = document.getElementById('wallet-container-frame');
        this.bettingUIFrame = document.getElementById('betting-ui-frame');
        
        if (this.gameFrame) {
            console.log("🎮 GameFrameManager initialized");
            this.moveExistingUIs();
        } else {
            console.log("⚠️ Game frame container not found - using fallback mode");
        }
    }
    
    /**
     * Move existing UI elements to new frame structure
     */
    moveExistingUIs() {
        // Move wallet to top panel
        this.moveWalletToTopPanel();
        
        // Move betting UI to bottom panel
        this.moveBettingUIToBottomPanel();
        
        console.log("🔄 UI elements moved to new frame structure");
    }
    
    /**
     * Move wallet to top panel
     */
    moveWalletToTopPanel() {
        const walletRoot = document.getElementById('privy-wallet-root');
        if (walletRoot && this.walletContainerFrame) {
            // Clone wallet content to top panel
            const walletClone = walletRoot.cloneNode(true);
            walletClone.id = 'privy-wallet-root-frame';
            this.walletContainerFrame.appendChild(walletClone);
            
            console.log("💰 Wallet moved to top panel");
        }
    }
    
    /**
     * Move betting UI to bottom panel
     */
    moveBettingUIToBottomPanel() {
        const bettingUI = document.getElementById('betting-ui');
        const gameUI = document.getElementById('game-ui');
        
        if (bettingUI && this.bettingUIFrame) {
            // Clone betting UI to bottom panel
            const bettingClone = bettingUI.cloneNode(true);
            bettingClone.id = 'betting-ui-frame-content';
            bettingClone.style.display = 'flex';
            this.bettingUIFrame.appendChild(bettingClone);
            
            console.log("🎯 Betting UI moved to bottom panel");
        }
        
        if (gameUI && this.bettingUIFrame) {
            // Clone game UI to bottom panel
            const gameClone = gameUI.cloneNode(true);
            gameClone.id = 'game-ui-frame-content';
            gameClone.style.display = 'none';
            this.bettingUIFrame.appendChild(gameClone);
            
            console.log("🎮 Game UI moved to bottom panel");
        }
    }
    
    /**
     * Show/hide panels
     */
    setPanelVisibility(panel, visible) {
        if (panel) {
            panel.style.display = visible ? 'flex' : 'none';
        }
    }
    
    /**
     * Show betting UI in bottom panel
     */
    showBettingUI() {
        const bettingFrame = document.getElementById('betting-ui-frame-content');
        const gameFrame = document.getElementById('game-ui-frame-content');
        
        this.setPanelVisibility(bettingFrame, true);
        this.setPanelVisibility(gameFrame, false);
        
        console.log("🎯 Betting UI shown in bottom panel");
    }
    
    /**
     * Show game UI in bottom panel
     */
    showGameUI() {
        const bettingFrame = document.getElementById('betting-ui-frame-content');
        const gameFrame = document.getElementById('game-ui-frame-content');
        
        this.setPanelVisibility(bettingFrame, false);
        this.setPanelVisibility(gameFrame, true);
        
        console.log("🎮 Game UI shown in bottom panel");
    }
    
    /**
     * Hide all UI panels
     */
    hideAllUIs() {
        const bettingFrame = document.getElementById('betting-ui-frame-content');
        const gameFrame = document.getElementById('game-ui-frame-content');
        
        this.setPanelVisibility(bettingFrame, false);
        this.setPanelVisibility(gameFrame, false);
        
        console.log("🚫 All UIs hidden in bottom panel");
    }
    
    /**
     * Update frame visibility
     */
    setFrameVisible(visible) {
        if (this.gameFrame) {
            this.gameFrame.style.display = visible ? 'flex' : 'none';
        }
    }
}

// Create global instance
window.gameFrameManager = new GameFrameManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameFrameManager;
}
