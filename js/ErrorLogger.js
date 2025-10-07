/**
 * Comprehensive Error Logging System
 * Handles all error logging, reporting, and debugging
 */
class ErrorLogger {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 50;
        this.isInitialized = false;
        this.environment = this.detectEnvironment();
        this.sessionId = this.generateSessionId();
        
        this.init();
    }
    
    /**
     * Initialize the error logging system
     */
    init() {
        try {
            // Set up global error handlers
            this.setupGlobalErrorHandlers();
            
            // Set up unhandled promise rejection handler
            this.setupPromiseRejectionHandler();
            
            // Initialize error reporting
            this.initErrorReporting();
            
            this.isInitialized = true;
            this.log('info', 'ErrorLogger initialized successfully', {
                environment: this.environment,
                sessionId: this.sessionId
            });
            
        } catch (error) {
            console.error('Failed to initialize ErrorLogger:', error);
        }
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
     * Check if server is available
     */
    isServerAvailable() {
        // Check if we're running from file:// protocol
        return window.location.protocol !== 'file:';
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.log('error', 'Global error caught', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                type: 'global_error'
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.log('error', 'Unhandled promise rejection', {
                reason: event.reason,
                type: 'unhandled_rejection'
            });
        });
    }
    
    /**
     * Set up promise rejection handler
     */
    setupPromiseRejectionHandler() {
        if (window.addEventListener) {
            window.addEventListener('unhandledrejection', (event) => {
                this.log('error', 'Promise rejection', {
                    reason: event.reason,
                    type: 'promise_rejection'
                });
            });
        }
    }
    
    /**
     * Initialize error reporting
     */
    initErrorReporting() {
        // Send queued errors on page unload
        window.addEventListener('beforeunload', () => {
            this.flushErrorQueue();
        });
        
        // Send errors periodically
        setInterval(() => {
            this.flushErrorQueue();
        }, 30000); // Every 30 seconds
    }
    
    /**
     * Main logging function
     */
    log(level, message, context = {}) {
        const logEntry = {
            level: level,
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            gameState: this.getGameState(),
            performance: this.getPerformanceData()
        };
        
        // Add to queue
        this.addToQueue(logEntry);
        
        // Console logging based on level
        this.consoleLog(logEntry);
        
        // Send critical errors immediately
        if (level === 'error' || level === 'critical') {
            this.sendToServer(logEntry);
        }
    }
    
    /**
     * Add log entry to queue
     */
    addToQueue(logEntry) {
        this.errorQueue.push(logEntry);
        
        // Limit queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest entry
        }
    }
    
    /**
     * Console logging with appropriate level
     */
    consoleLog(logEntry) {
        const prefix = `[${logEntry.level.toUpperCase()}] ${logEntry.timestamp}`;
        
        switch (logEntry.level) {
            case 'error':
            case 'critical':
                console.error(prefix, logEntry.message, logEntry.context);
                break;
            case 'warn':
                console.warn(prefix, logEntry.message, logEntry.context);
                break;
            case 'info':
                console.info(prefix, logEntry.message, logEntry.context);
                break;
            case 'debug':
                if (this.environment === 'development') {
                    console.log(prefix, logEntry.message, logEntry.context);
                }
                break;
            default:
                console.log(prefix, logEntry.message, logEntry.context);
        }
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        try {
            return {
                gameStarted: window.s_oGame ? window.s_oGame.isGameStarted() : false,
                currentLevel: window.s_oGame ? window.s_oGame.getCurrentLevel() : 0,
                betAmount: window.s_oGame ? window.s_oGame.getBetAmount() : 0,
                difficulty: window.s_oGame ? window.s_oGame.getDifficulty() : 'unknown',
                jumpsLeft: window.s_oGame ? window.s_oGame.getJumpsLeft() : 0,
                successfulJumps: window.s_oGame ? window.s_oGame.getSuccessfulJumps() : 0
            };
        } catch (error) {
            return { error: 'Failed to get game state' };
        }
    }
    
    /**
     * Get performance data
     */
    getPerformanceData() {
        try {
            const memory = performance.memory;
            return {
                memoryUsed: memory ? memory.usedJSHeapSize : 'N/A',
                memoryTotal: memory ? memory.totalJSHeapSize : 'N/A',
                fps: window.s_iCurFps || 'N/A',
                loadTime: performance.timing ? 
                    performance.timing.loadEventEnd - performance.timing.navigationStart : 'N/A'
            };
        } catch (error) {
            return { error: 'Failed to get performance data' };
        }
    }
    
    /**
     * Send error to server
     */
    async sendToServer(logEntry) {
        // Skip server sending in development or if no server available
        if (this.environment === 'development' || !this.isServerAvailable()) {
            return; // Don't send in development
        }
        
        try {
            const response = await fetch('./api/errors.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry)
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
        } catch (error) {
            // Fallback to localStorage if server fails
            this.saveToLocalStorage(logEntry);
            console.error('Failed to send error to server:', error);
        }
    }
    
    /**
     * Save error to localStorage as backup
     */
    saveToLocalStorage(logEntry) {
        try {
            const key = 'chogCross_errors_' + Date.now();
            localStorage.setItem(key, JSON.stringify(logEntry));
            
            // Clean old errors (keep only last 10)
            this.cleanOldErrors();
            
        } catch (error) {
            console.error('Failed to save error to localStorage:', error);
        }
    }
    
    /**
     * Clean old errors from localStorage
     */
    cleanOldErrors() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith('chogCross_errors_')
            );
            
            if (keys.length > 10) {
                // Sort by timestamp and remove oldest
                keys.sort().slice(0, keys.length - 10).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
        } catch (error) {
            console.error('Failed to clean old errors:', error);
        }
    }
    
    /**
     * Flush error queue to server
     */
    async flushErrorQueue() {
        if (this.errorQueue.length === 0) return;
        
        // Skip server sending in development or if no server available
        if (this.environment === 'development' || !this.isServerAvailable()) {
            this.errorQueue = []; // Clear queue in development
            return;
        }
        
        let errorsToSend = [];
        
        try {
            errorsToSend = [...this.errorQueue];
            this.errorQueue = []; // Clear queue
            
            const response = await fetch('./api/errors/batch.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    errors: errorsToSend
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
        } catch (error) {
            // Re-add errors to queue if sending failed
            this.errorQueue.unshift(...errorsToSend);
            console.error('Failed to flush error queue:', error);
        }
    }
    
    /**
     * Log error with context
     */
    error(message, context = {}) {
        this.log('error', message, context);
    }
    
    /**
     * Log warning with context
     */
    warn(message, context = {}) {
        this.log('warn', message, context);
    }
    
    /**
     * Log info with context
     */
    info(message, context = {}) {
        this.log('info', message, context);
    }
    
    /**
     * Log debug with context
     */
    debug(message, context = {}) {
        this.log('debug', message, context);
    }
    
    /**
     * Log critical error with context
     */
    critical(message, context = {}) {
        this.log('critical', message, context);
    }
    
    /**
     * Show user-friendly error message
     */
    showErrorToUser(message, type = 'error') {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = `error-notification ${type}`;
        notification.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : '#ffaa00'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            font-family: 'Orbitron', monospace;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .error-notification .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .error-notification .error-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
        
        // Close button handler
        notification.querySelector('.error-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    /**
     * Get error statistics
     */
    getErrorStats() {
        const errors = this.errorQueue;
        const stats = {
            total: errors.length,
            byLevel: {},
            byType: {},
            recent: errors.slice(-10)
        };
        
        errors.forEach(error => {
            // Count by level
            stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
            
            // Count by type
            const type = error.context.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
        
        return stats;
    }
}

// Create global instance
window.errorLogger = new ErrorLogger();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorLogger;
}
