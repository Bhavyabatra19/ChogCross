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
        this.bottomPanel = null;
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        this.centerPanel = document.getElementById('center-panel');
        
        this.walletContainerFrame = document.getElementById('wallet-container-frame');
        this.bettingUIFrame = null;
        
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
        // Move wallet to left panel
        this.moveWalletToLeftPanel();
        
        // Move betting UI to bottom panel
        this.moveBettingUIToBottomPanel();
        
        console.log("🔄 UI elements moved to new frame structure");
    }
    
    /**
     * Move wallet to left panel
     */
    moveWalletToLeftPanel() {
        const walletContainerLeft = document.getElementById('wallet-container-left');
        
        if (walletContainerLeft) {
            console.log("🔍 Wallet container left found, setting up wallet rendering...");
            
            // Create a div for React to mount the wallet component
            const walletDiv = document.createElement('div');
            walletDiv.id = 'privy-wallet-root-left';
            walletDiv.style.width = '100%';
            walletDiv.style.height = '100%';
            walletContainerLeft.appendChild(walletDiv);
            
            // Try to render wallet in left panel
            this.renderWalletInLeftPanel();
            
            console.log("💰 Wallet container prepared in left panel");
        } else {
            console.log("❌ Wallet container left not found");
        }
    }
    
    /**
     * Render wallet in left panel
     */
    renderWalletInLeftPanel() {
        console.log("🎯 Attempting to render wallet in left panel...");
        
        const leftPanelRoot = document.getElementById('privy-wallet-root-left');
        if (leftPanelRoot) {
            // Try to render wallet using the exported function
            if (window.renderWalletInLeftPanel) {
                window.renderWalletInLeftPanel();
            } else {
                // Fallback: try to move existing wallet
                this.moveExistingWalletToLeft();
            }
        } else {
            console.log("⏳ Left panel root not ready, will retry...");
            setTimeout(() => {
                this.renderWalletInLeftPanel();
            }, 1000);
        }
    }
    
    /**
     * Move existing wallet to left panel
     */
    moveExistingWalletToLeft() {
        const originalWalletRoot = document.getElementById('privy-wallet-root');
        const leftWalletRoot = document.getElementById('privy-wallet-root-left');
        
        if (originalWalletRoot && leftWalletRoot) {
            console.log("🔄 Moving existing wallet to left panel...");
            
            // Move the wallet content to left panel
            while (originalWalletRoot.firstChild) {
                leftWalletRoot.appendChild(originalWalletRoot.firstChild);
            }
            
            // Hide the original wallet root
            originalWalletRoot.style.display = 'none';
            
            console.log("✅ Wallet moved to left panel successfully");
        } else {
            console.log("⏳ Wallet not ready yet, will retry...");
            // Retry after a short delay
            setTimeout(() => {
                this.moveExistingWalletToLeft();
            }, 1000);
        }
    }
    
    /**
     * Move betting UI to bottom panel
     */
    moveBettingUIToBottomPanel() {
        const bettingUI = document.getElementById('betting-ui');
        const gameUI = document.getElementById('game-ui');
        
        if (bettingUI && this.bettingUIFrame) {
            // Bottom panel removed; no cloning needed
            
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
        const bettingFrame = null;
        const gameFrame = null;
        
        this.setPanelVisibility(bettingFrame, true);
        this.setPanelVisibility(gameFrame, false);
        
        console.log("🎯 Betting UI shown in bottom panel");
    }
    
    /**
     * Show game UI in bottom panel
     */
    showGameUI() {
        const bettingFrame = null;
        const gameFrame = null;
        
        this.setPanelVisibility(bettingFrame, false);
        this.setPanelVisibility(gameFrame, true);
        
        console.log("🎮 Game UI shown in bottom panel");
    }
    
    /**
     * Hide all UI panels
     */
    hideAllUIs() {
        const bettingFrame = null;
        const gameFrame = null;
        
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
