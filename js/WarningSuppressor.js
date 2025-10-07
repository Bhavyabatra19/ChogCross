/**
 * Warning Suppressor - Suppress known warnings and improve console output
 */
class WarningSuppressor {
    constructor() {
        this.suppressedWarnings = new Set();
        this.originalConsoleWarn = console.warn;
        this.originalConsoleError = console.error;
        this.init();
    }
    
    init() {
        // Suppress known CreateJS warnings
        this.suppressKnownWarnings();
        
        // Override console methods
        this.overrideConsoleMethods();
        
        if (window.errorLogger) {
            window.errorLogger.debug('Warning suppressor initialized');
        }
    }
    
    /**
     * Suppress known warnings
     */
    suppressKnownWarnings() {
        // CreateJS Canvas2D warning
        this.suppressedWarnings.add('Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true');
        
        // Add more known warnings as needed
        this.suppressedWarnings.add('Canvas2D: Multiple readback operations');
        this.suppressedWarnings.add('willReadFrequently attribute');
    }
    
    /**
     * Override console methods
     */
    overrideConsoleMethods() {
        const self = this;
        
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // Check if this warning should be suppressed
            if (self.shouldSuppressWarning(message)) {
                return; // Suppress the warning
            }
            
            // Call original warn method
            self.originalConsoleWarn.apply(console, args);
        };
        
        console.error = function(...args) {
            const message = args.join(' ');
            
            // Check if this error should be suppressed
            if (self.shouldSuppressError(message)) {
                return; // Suppress the error
            }
            
            // Call original error method
            self.originalConsoleError.apply(console, args);
        };
    }
    
    /**
     * Check if warning should be suppressed
     */
    shouldSuppressWarning(message) {
        for (const suppressedWarning of this.suppressedWarnings) {
            if (message.includes(suppressedWarning)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if error should be suppressed
     */
    shouldSuppressError(message) {
        // Add specific error patterns to suppress
        const suppressedErrors = [
            'Cashout blocked - game not active',
            'Game not started yet'
        ];
        
        for (const suppressedError of suppressedErrors) {
            if (message.includes(suppressedError)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Add warning to suppression list
     */
    suppressWarning(warningPattern) {
        this.suppressedWarnings.add(warningPattern);
        
        if (window.errorLogger) {
            window.errorLogger.debug('Warning suppressed', { pattern: warningPattern });
        }
    }
    
    /**
     * Remove warning from suppression list
     */
    unsuppressWarning(warningPattern) {
        this.suppressedWarnings.delete(warningPattern);
        
        if (window.errorLogger) {
            window.errorLogger.debug('Warning suppression removed', { pattern: warningPattern });
        }
    }
    
    /**
     * Get list of suppressed warnings
     */
    getSuppressedWarnings() {
        return Array.from(this.suppressedWarnings);
    }
    
    /**
     * Clear all suppressed warnings
     */
    clearSuppressedWarnings() {
        this.suppressedWarnings.clear();
        
        if (window.errorLogger) {
            window.errorLogger.debug('All warning suppressions cleared');
        }
    }
    
    /**
     * Restore original console methods
     */
    restoreConsole() {
        console.warn = this.originalConsoleWarn;
        console.error = this.originalConsoleError;
        
        if (window.errorLogger) {
            window.errorLogger.debug('Console methods restored');
        }
    }
    
    /**
     * Enable debug mode (show all warnings)
     */
    enableDebugMode() {
        this.restoreConsole();
        
        if (window.errorLogger) {
            window.errorLogger.debug('Debug mode enabled - all warnings will be shown');
        }
    }
    
    /**
     * Disable debug mode (suppress warnings)
     */
    disableDebugMode() {
        this.overrideConsoleMethods();
        
        if (window.errorLogger) {
            window.errorLogger.debug('Debug mode disabled - warnings suppressed');
        }
    }
}

// Create global instance
window.warningSuppressor = new WarningSuppressor();

// Suppress known warnings (Canvas2D, etc.)
console.log("🔇 Warning suppressor active - Known warnings suppressed");

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarningSuppressor;
}
