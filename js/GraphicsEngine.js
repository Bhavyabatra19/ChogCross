/**
 * Advanced Graphics Engine
 * Modern web technologies for superior visual quality
 */
class GraphicsEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gl = null;
        this.program = null;
        this.isWebGLSupported = false;
        this.isWebGL2Supported = false;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.renderQuality = 'high';
        this.config = null;
        this.preserveDimensions = true; // Flag to prevent dimension changes
        
        this.init();
    }
    
    /**
     * Initialize the graphics engine
     */
    init() {
        console.log('🚀 GraphicsEngine: Initializing advanced rendering...');
        
        // Load configuration
        this.loadConfiguration();
        
        this.detectCapabilities();
        this.setupCanvas();
        this.setupRendering();
        this.optimizePerformance();
        
        console.log('✅ GraphicsEngine: Advanced rendering initialized');
    }
    
    /**
     * Load configuration from GameConfig
     */
    loadConfiguration() {
        if (window.gameConfig) {
            this.config = window.gameConfig.getGraphics();
            console.log('📋 GraphicsEngine: Configuration loaded', this.config);
        } else {
            console.warn('⚠️ GraphicsEngine: GameConfig not available, using defaults');
            this.config = this.getDefaultConfig();
        }
    }
    
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            engine: 'GraphicsEngine',
            quality: 'auto',
            enableWebGL: true,
            enableHardwareAcceleration: true,
            enablePostProcessing: true,
            enableAntialiasing: true,
            enableBloom: true,
            enableToneMapping: true,
            maxFrameRate: 60,
            enableVSync: true,
            devicePixelRatio: this.devicePixelRatio,
            enableMemoryOptimization: true,
            enableFrameRateOptimization: true
        };
    }
    
    /**
     * Detect device capabilities
     */
    detectCapabilities() {
        // WebGL Support Detection
        this.isWebGLSupported = this.checkWebGLSupport();
        this.isWebGL2Supported = this.checkWebGL2Support();
        
        // Device capabilities
        const capabilities = {
            webgl: this.isWebGLSupported,
            webgl2: this.isWebGL2Supported,
            pixelRatio: this.devicePixelRatio,
            memory: this.getMemoryInfo(),
            cores: navigator.hardwareConcurrency || 4,
            connection: this.getConnectionInfo()
        };
        
        // Determine optimal quality settings
        if (this.config && this.config.quality !== 'auto') {
            this.renderQuality = this.config.quality;
        } else {
            this.renderQuality = this.determineOptimalQuality(capabilities);
        }
        
        console.log('🔍 Device Capabilities:', capabilities);
        console.log('🎯 Optimal Quality:', this.renderQuality);
    }
    
    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check WebGL2 support
     */
    checkWebGL2Support() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get memory information
     */
    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    /**
     * Get connection information
     */
    getConnectionInfo() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }
    
    /**
     * Determine optimal quality based on capabilities
     */
    determineOptimalQuality(capabilities) {
        let quality = 'medium';
        
        // High-end device detection
        if (capabilities.webgl2 && 
            capabilities.pixelRatio >= 2 && 
            capabilities.cores >= 8 &&
            capabilities.memory && 
            capabilities.memory.limit >= 2048) {
            quality = 'ultra';
        } else if (capabilities.webgl && 
                   capabilities.pixelRatio >= 1.5 && 
                   capabilities.cores >= 4) {
            quality = 'high';
        } else if (capabilities.pixelRatio >= 1) {
            quality = 'medium';
        } else {
            quality = 'low';
        }
        
        return quality;
    }
    
    /**
     * Setup canvas with advanced optimizations - WITHOUT changing dimensions
     */
    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) return;
        
        // Store original dimensions to prevent changes
        const originalWidth = this.canvas.width;
        const originalHeight = this.canvas.height;
        
        console.log('📏 Original canvas dimensions:', originalWidth, 'x', originalHeight);
        console.log('🔒 Preserve dimensions flag:', this.preserveDimensions);
        
        // DO NOT change canvas dimensions - let the game handle sizing
        // Only apply quality optimizations to the existing canvas
        
        // Get 2D context with optimizations
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true, // Better performance
            willReadFrequently: false // Optimize for drawing
        });
        
        if (this.ctx) {
            // Apply quality settings without scaling
            this.setup2DContext();
        }
        
        // Try WebGL if supported and enabled in config
        if (this.isWebGLSupported && this.config && this.config.enableWebGL) {
            this.setupWebGL();
        }
        
        // Verify dimensions are preserved
        if (this.preserveDimensions && (this.canvas.width !== originalWidth || this.canvas.height !== originalHeight)) {
            console.warn('⚠️ Canvas dimensions changed! Restoring...');
            this.canvas.width = originalWidth;
            this.canvas.height = originalHeight;
        }
        
        console.log('🎨 Canvas setup completed - dimensions preserved:', this.canvas.width, 'x', this.canvas.height);
    }
    
    /**
     * Setup 2D context with advanced settings
     */
    setup2DContext() {
        // Advanced rendering settings
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Advanced text rendering optimizations
        if (this.ctx.textRenderingOptimization) {
            this.ctx.textRenderingOptimization = 'optimizeQuality';
        }
        if (this.ctx.fontKerning) {
            this.ctx.fontKerning = 'normal';
        }
        
        // Enable subpixel text rendering
        if (this.ctx.textBaseline) {
            this.ctx.textBaseline = 'alphabetic';
        }
        if (this.ctx.textAlign) {
            this.ctx.textAlign = 'start';
        }
        
        // Color space optimization
        if (this.ctx.colorSpace) {
            this.ctx.colorSpace = 'srgb';
        }
        
        // Enable font smoothing
        if (this.ctx.fontSmoothing) {
            this.ctx.fontSmoothing = 'subpixel-antialiased';
        }
        
        console.log('🎨 2D Context optimized for high-quality text rendering');
    }
    
    /**
     * Setup WebGL for advanced rendering - WITHOUT changing canvas dimensions
     */
    setupWebGL() {
        try {
            // Store dimensions before WebGL setup
            const originalWidth = this.canvas.width;
            const originalHeight = this.canvas.height;
            
            this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
            if (!this.gl) return;
            
            // WebGL optimizations
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            
            // Enable extensions for better quality
            const extensions = [
                'EXT_texture_filter_anisotropic',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_etc1',
                'WEBGL_compressed_texture_astc'
            ];
            
            extensions.forEach(ext => {
                if (this.gl.getExtension(ext)) {
                    console.log(`✅ WebGL Extension enabled: ${ext}`);
                }
            });
            
            // Restore dimensions if changed
            if (this.preserveDimensions && (this.canvas.width !== originalWidth || this.canvas.height !== originalHeight)) {
                console.warn('⚠️ WebGL changed canvas dimensions! Restoring...');
                this.canvas.width = originalWidth;
                this.canvas.height = originalHeight;
            }
            
            console.log('🚀 WebGL initialized for advanced rendering - dimensions preserved');
        } catch (e) {
            console.warn('⚠️ WebGL initialization failed:', e);
        }
    }
    
    /**
     * Setup advanced rendering techniques
     */
    setupRendering() {
        // CSS optimizations
        this.canvas.style.imageRendering = 'auto';
        this.canvas.style.imageRendering = 'smooth';
        this.canvas.style.transform = 'translateZ(0)';
        this.canvas.style.backfaceVisibility = 'hidden';
        
        // Hardware acceleration
        this.canvas.style.willChange = 'transform';
        
        // Apply quality-based settings
        this.applyQualitySettings();
    }
    
    /**
     * Apply quality settings based on device capabilities
     */
    applyQualitySettings() {
        const settings = this.getQualitySettings();
        
        // Canvas settings
        if (this.ctx) {
            this.ctx.imageSmoothingEnabled = settings.imageSmoothing;
            this.ctx.imageSmoothingQuality = settings.smoothingQuality;
        }
        
        // CSS filters for post-processing
        if (settings.enablePostProcessing && this.config && this.config.enablePostProcessing) {
            this.enablePostProcessing(settings);
        }
        
        // WebGL settings
        if (this.gl && settings.webgl) {
            this.setupWebGLSettings(settings);
        }
        
        console.log('🎯 Quality settings applied:', settings);
    }
    
    /**
     * Get quality settings based on render quality
     */
    getQualitySettings() {
        const settings = {
            imageSmoothing: true,
            smoothingQuality: 'medium',
            enablePostProcessing: false,
            webgl: false,
            antialiasing: false,
            shadows: false,
            particles: 5,
            bloom: false,
            toneMapping: false
        };
        
        switch (this.renderQuality) {
            case 'ultra':
                settings.smoothingQuality = 'high';
                settings.enablePostProcessing = true;
                settings.webgl = this.isWebGLSupported;
                settings.antialiasing = true;
                settings.shadows = true;
                settings.particles = 20;
                settings.bloom = true;
                settings.toneMapping = true;
                break;
                
            case 'high':
                settings.smoothingQuality = 'high';
                settings.enablePostProcessing = true;
                settings.webgl = this.isWebGLSupported;
                settings.antialiasing = true;
                settings.particles = 15;
                settings.bloom = true;
                break;
                
            case 'medium':
                settings.smoothingQuality = 'medium';
                settings.enablePostProcessing = true;
                settings.particles = 10;
                break;
                
            case 'low':
                settings.smoothingQuality = 'low';
                settings.particles = 5;
                break;
        }
        
        return settings;
    }
    
    /**
     * Enable post-processing effects
     */
    enablePostProcessing(settings) {
        const filters = [];
        
        if (settings.bloom) {
            filters.push('brightness(1.02)');
        }
        
        if (settings.toneMapping) {
            filters.push('contrast(1.05)');
        }
        
        if (settings.antialiasing) {
            filters.push('saturate(1.05)');
        }
        
        if (filters.length > 0) {
            this.canvas.style.filter = filters.join(' ');
        }
    }
    
    /**
     * Setup WebGL-specific settings
     */
    setupWebGLSettings(settings) {
        if (!this.gl) return;
        
        // Enable antialiasing
        if (settings.antialiasing) {
            this.gl.enable(this.gl.MULTISAMPLE);
        }
        
        // Set clear color
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        
        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
    }
    
    /**
     * Optimize performance
     */
    optimizePerformance() {
        // GPU acceleration hints
        this.canvas.style.transform = 'translate3d(0, 0, 0)';
        this.canvas.style.backfaceVisibility = 'hidden';
        this.canvas.style.perspective = '1000px';
        
        // Memory optimization
        if (this.ctx) {
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        // Frame rate optimization
        this.setupFrameRateOptimization();
    }
    
    /**
     * Setup frame rate optimization
     */
    setupFrameRateOptimization() {
        // Use requestAnimationFrame for smooth rendering
        let lastTime = 0;
        const targetFPS = this.getTargetFPS();
        const frameInterval = 1000 / targetFPS;
        
        const renderLoop = (currentTime) => {
            if (currentTime - lastTime >= frameInterval) {
                this.render();
                lastTime = currentTime;
            }
            requestAnimationFrame(renderLoop);
        };
        
        requestAnimationFrame(renderLoop);
    }
    
    /**
     * Get target FPS based on quality and config
     */
    getTargetFPS() {
        if (this.config && this.config.maxFrameRate) {
            return this.config.maxFrameRate;
        }
        
        switch (this.renderQuality) {
            case 'ultra': return 60;
            case 'high': return 60;
            case 'medium': return 45;
            case 'low': return 30;
            default: return 30;
        }
    }
    
    /**
     * Main render function
     */
    render() {
        // This will be called by the game's render loop
        // We can add advanced rendering techniques here
    }
    
    /**
     * Create high-quality image from canvas
     */
    createHighQualityImage() {
        if (!this.canvas) return null;
        
        // Create a high-resolution version
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width * 2;
        tempCanvas.height = this.canvas.height * 2;
        
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        return tempCanvas.toDataURL('image/png', 1.0);
    }
    
    /**
     * Apply advanced filters
     */
    applyAdvancedFilters() {
        if (!this.ctx) return;
        
        // Apply subtle enhancements
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Subtle contrast and brightness adjustment
        for (let i = 0; i < data.length; i += 4) {
            // RGB channels
            data[i] = Math.min(255, data[i] * 1.02);     // Red
            data[i + 1] = Math.min(255, data[i + 1] * 1.02); // Green
            data[i + 2] = Math.min(255, data[i + 2] * 1.02); // Blue
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            quality: this.renderQuality,
            webgl: this.isWebGLSupported,
            webgl2: this.isWebGL2Supported,
            pixelRatio: this.devicePixelRatio,
            memory: this.getMemoryInfo(),
            fps: this.getCurrentFPS()
        };
    }
    
    /**
     * Get current FPS (simplified)
     */
    getCurrentFPS() {
        // This would need actual FPS tracking implementation
        return this.getTargetFPS();
    }
    
    /**
     * Update quality settings dynamically
     */
    updateQuality(newQuality) {
        this.renderQuality = newQuality;
        this.applyQualitySettings();
        console.log('🔄 Quality updated to:', newQuality);
    }
    
    /**
     * Update configuration dynamically
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.applyQualitySettings();
        console.log('🔄 GraphicsEngine config updated:', this.config);
    }
    
    /**
     * Reload configuration from GameConfig
     */
    reloadConfig() {
        this.loadConfiguration();
        this.applyQualitySettings();
        console.log('🔄 GraphicsEngine config reloaded');
    }
    
    /**
     * Enable/disable dimension preservation
     */
    setPreserveDimensions(preserve) {
        this.preserveDimensions = preserve;
        console.log('🔒 Dimension preservation:', preserve ? 'Enabled' : 'Disabled');
    }
    
    /**
     * Force restore canvas dimensions
     */
    restoreCanvasDimensions() {
        if (this.canvas) {
            // Get original dimensions from HTML
            const originalWidth = parseInt(this.canvas.getAttribute('width')) || 1200;
            const originalHeight = parseInt(this.canvas.getAttribute('height')) || 600;
            
            this.canvas.width = originalWidth;
            this.canvas.height = originalHeight;
            
            console.log('🔄 Canvas dimensions restored to:', originalWidth, 'x', originalHeight);
        }
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.gl) {
            this.gl = null;
        }
        if (this.ctx) {
            this.ctx = null;
        }
        console.log('🧹 GraphicsEngine: Resources cleaned up');
    }
}

// Initialize graphics engine when DOM is ready and after game initialization
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the game to initialize its canvas first
    setTimeout(function() {
        window.graphicsEngine = new GraphicsEngine();
        
        // Expose to global scope for debugging and control
        window.getGraphicsMetrics = () => window.graphicsEngine.getPerformanceMetrics();
        window.updateGraphicsQuality = (quality) => window.graphicsEngine.updateQuality(quality);
        window.updateGraphicsConfig = (config) => window.graphicsEngine.updateConfig(config);
        window.reloadGraphicsConfig = () => window.graphicsEngine.reloadConfig();
        window.setPreserveDimensions = (preserve) => window.graphicsEngine.setPreserveDimensions(preserve);
        window.restoreCanvasDimensions = () => window.graphicsEngine.restoreCanvasDimensions();
        
        console.log('🎮 GraphicsEngine initialized after game setup');
    }, 100);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsEngine;
}
