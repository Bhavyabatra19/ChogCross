/**
 * Advanced Text Rendering System
 * Optimizes CreateJS text rendering for crisp, clear text
 */
class TextRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.isHighDPI = this.devicePixelRatio > 1;
        this.config = null;
        
        this.init();
    }
    
    /**
     * Initialize text renderer
     */
    init() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) return;
        
        // Load configuration
        this.loadConfiguration();
        
        this.setupTextRendering();
        this.patchCreateJSText();
        
        console.log('📝 TextRenderer: Advanced text rendering initialized');
    }
    
    /**
     * Load configuration from GameConfig
     */
    loadConfiguration() {
        if (window.gameConfig) {
            this.config = window.gameConfig.getTextRendering();
            console.log('📋 TextRenderer: Configuration loaded', this.config);
        } else {
            console.warn('⚠️ TextRenderer: GameConfig not available, using defaults');
            this.config = this.getDefaultConfig();
        }
    }
    
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
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
        };
    }
    
    /**
     * Setup advanced text rendering
     */
    setupTextRendering() {
        // Enable high-quality text rendering based on config
        if (this.config.enableHighQuality) {
            this.ctx.textRenderingOptimization = 'optimizeQuality';
        }
        
        if (this.config.enableKerning) {
            this.ctx.fontKerning = 'normal';
        }
        
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.textAlign = 'start';
        
        // Enable subpixel rendering
        if (this.config.enableSubpixelRendering) {
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
        }
        
        // Set optimal composite operation
        this.ctx.globalCompositeOperation = 'source-over';
        
        console.log('🎨 Text rendering context optimized with config');
    }
    
    /**
     * Patch CreateJS Text class for better rendering
     */
    patchCreateJSText() {
        if (typeof createjs === 'undefined' || !createjs.Text) {
            console.warn('⚠️ CreateJS not available for text patching');
            return;
        }
        
        // Store original draw method
        const originalDraw = createjs.Text.prototype.draw;
        
        // Override draw method with enhanced rendering
        createjs.Text.prototype.draw = function(ctx, ignoreCache) {
            // Apply text rendering optimizations
            this.applyTextOptimizations(ctx);
            
            // Call original draw method
            return originalDraw.call(this, ctx, ignoreCache);
        };
        
        // Add text optimization method to CreateJS Text
        createjs.Text.prototype.applyTextOptimizations = function(ctx) {
            const config = window.textRenderer ? window.textRenderer.config : null;
            
            // Enable high-quality text rendering based on config
            if (!config || config.enableHighQuality) {
                ctx.textRenderingOptimization = 'optimizeQuality';
            }
            
            if (!config || config.enableKerning) {
                ctx.fontKerning = 'normal';
            }
            
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'start';
            
            // Enable subpixel rendering
            if (!config || config.enableSubpixelRendering) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
            
            // Apply font smoothing
            if (ctx.fontSmoothing && (!config || config.enableFontSmoothing)) {
                ctx.fontSmoothing = 'subpixel-antialiased';
            }
            
            // Optimize for high DPI displays
            if (window.devicePixelRatio > 1 && (!config || config.optimizeForHighDPI)) {
                ctx.scale(1, 1); // Prevent scaling issues
            }
        };
        
        console.log('🔧 CreateJS Text class patched for enhanced rendering');
    }
    
    /**
     * Create high-quality text with optimal settings
     */
    createOptimizedText(text, font, color) {
        const textObj = new createjs.Text(text, font, color);
        
        // Apply additional optimizations
        textObj.textAlign = 'center';
        textObj.textBaseline = 'middle';
        
        // Enable shadow for better readability based on config
        if (this.config.shadowEnabled && !textObj.shadow) {
            textObj.shadow = new createjs.Shadow(
                this.config.shadowColor,
                this.config.shadowOffsetX,
                this.config.shadowOffsetY,
                this.config.shadowBlur
            );
        }
        
        return textObj;
    }
    
    /**
     * Optimize existing text objects
     */
    optimizeTextObject(textObj) {
        if (!textObj) return;
        
        // Enhance shadow for better readability based on config
        if (this.config && this.config.shadowEnabled) {
            textObj.shadow = new createjs.Shadow(
                this.config.shadowColor,
                this.config.shadowOffsetX,
                this.config.shadowOffsetY,
                this.config.shadowBlur
            );
        }
        
        // Ensure proper alignment
        textObj.textAlign = textObj.textAlign || 'center';
        textObj.textBaseline = textObj.textBaseline || 'middle';
    }
    
    /**
     * Optimize text specifically for leaderboard
     */
    optimizeLeaderboardText(textObj) {
        if (!textObj) return;
        
        // Use Orbitron font for better readability
        if (textObj.font && textObj.font.includes('Arial')) {
            textObj.font = textObj.font.replace('Arial', 'Orbitron, Arial, sans-serif');
        }
        
        // Apply enhanced shadow for better readability
        if (this.config.shadowEnabled) {
            textObj.shadow = new createjs.Shadow(
                this.config.shadowColor,
                this.config.shadowOffsetX + 1, // Slightly stronger shadow
                this.config.shadowOffsetY + 1,
                this.config.shadowBlur + 1
            );
        }
        
        // Ensure proper alignment
        textObj.textAlign = textObj.textAlign || 'center';
        textObj.textBaseline = textObj.textBaseline || 'middle';
        
        console.log('📊 Leaderboard text optimized');
    }
    
    /**
     * Get optimal font size for current display
     */
    getOptimalFontSize(baseSize) {
        if (this.config.optimizeForHighDPI && this.isHighDPI) {
            return Math.round(baseSize * 1.1); // Slightly larger for high DPI
        }
        return baseSize;
    }
    
    /**
     * Get optimal font family for crisp rendering
     */
    getOptimalFontFamily(baseFont) {
        // Use configured fallbacks
        const fallbacks = this.config.fontFallbacks || ['Orbitron', 'Arial', 'Helvetica', 'sans-serif'];
        
        if (baseFont && !baseFont.includes(',')) {
            return `${baseFont}, ${fallbacks.join(', ')}`;
        }
        
        return baseFont || fallbacks.join(', ');
    }
    
    /**
     * Apply text rendering optimizations to canvas context
     */
    optimizeContext(ctx) {
        if (!ctx) return;
        
        // Enable high-quality rendering based on config
        if (this.config.enableHighQuality) {
            ctx.textRenderingOptimization = 'optimizeQuality';
        }
        
        if (this.config.enableKerning) {
            ctx.fontKerning = 'normal';
        }
        
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'start';
        
        // Enable subpixel rendering
        if (this.config.enableSubpixelRendering) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        
        // Apply font smoothing
        if (ctx.fontSmoothing && this.config.enableFontSmoothing) {
            ctx.fontSmoothing = 'subpixel-antialiased';
        }
    }
    
    /**
     * Test text rendering quality
     */
    testTextRendering() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Test different font sizes
        const testTexts = [
            { text: 'Test Text 12px', size: 12 },
            { text: 'Test Text 16px', size: 16 },
            { text: 'Test Text 20px', size: 20 },
            { text: 'Test Text 24px', size: 24 },
            { text: 'Test Text 32px', size: 32 }
        ];
        
        testTexts.forEach((test, index) => {
            this.ctx.font = `${test.size}px Orbitron, Arial, sans-serif`;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(test.text, 50, 50 + (index * 40));
        });
        
        console.log('📝 Text rendering test completed');
    }
    
    /**
     * Get rendering quality metrics
     */
    getQualityMetrics() {
        return {
            devicePixelRatio: this.devicePixelRatio,
            isHighDPI: this.isHighDPI,
            canvasWidth: this.canvas ? this.canvas.width : 0,
            canvasHeight: this.canvas ? this.canvas.height : 0,
            contextOptimized: this.ctx ? true : false,
            createJSPatched: typeof createjs !== 'undefined' && createjs.Text ? true : false,
            config: this.config
        };
    }
    
    /**
     * Update configuration dynamically
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.setupTextRendering();
        console.log('🔄 TextRenderer config updated:', this.config);
    }
    
    /**
     * Reload configuration from GameConfig
     */
    reloadConfig() {
        this.loadConfiguration();
        this.setupTextRendering();
        console.log('🔄 TextRenderer config reloaded');
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        this.canvas = null;
        this.ctx = null;
        console.log('🧹 TextRenderer: Resources cleaned up');
    }
}

// Initialize text renderer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for CreateJS to be available
    setTimeout(function() {
        window.textRenderer = new TextRenderer();
        
        // Expose to global scope
        window.testTextRendering = () => window.textRenderer.testTextRendering();
        window.getTextQualityMetrics = () => window.textRenderer.getQualityMetrics();
        window.optimizeTextObject = (textObj) => window.textRenderer.optimizeTextObject(textObj);
        window.optimizeLeaderboardText = (textObj) => window.textRenderer.optimizeLeaderboardText(textObj);
        window.updateTextConfig = (config) => window.textRenderer.updateConfig(config);
        window.reloadTextConfig = () => window.textRenderer.reloadConfig();
        
        console.log('📝 TextRenderer initialized');
    }, 200);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextRenderer;
}
