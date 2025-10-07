/**
 * Modern JavaScript Utilities
 * ES6+ features and modern JavaScript patterns
 */
class ModernUtils {
    /**
     * Debounce function - ES6 implementation
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    /**
     * Throttle function - ES6 implementation
     */
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Deep clone object - ES6 implementation
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }
    
    /**
     * Audio Context Manager - handles audio initialization
     */
    static audioContextManager = {
        context: null,
        initialized: false,
        
        init() {
            if (this.initialized) return this.context;
            
            try {
                // Create audio context
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.context = new AudioContext();
                
                // Resume context if suspended
                if (this.context.state === 'suspended') {
                    this.context.resume();
                }
                
                this.initialized = true;
                console.log('🎵 Audio context initialized:', this.context.state);
                return this.context;
            } catch (error) {
                console.error('❌ Audio context initialization failed:', error);
                return null;
            }
        },
        
        resume() {
            if (this.context && this.context.state === 'suspended') {
                return this.context.resume();
            }
            return Promise.resolve();
        }
    };
    
    /**
     * Merge objects - ES6 implementation
     */
    static merge(...objects) {
        return Object.assign({}, ...objects);
    }
    
    /**
     * Generate random number between min and max
     */
    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Generate random float between min and max
     */
    static randomFloatBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Format number with commas
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * Format currency
     */
    static formatCurrency(amount, currency = 'MON') {
        return `${this.formatNumber(amount.toFixed(2))} ${currency}`;
    }
    
    /**
     * Sleep function - ES6 async/await
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await this.sleep(delay);
                return this.retry(fn, retries - 1, delay * 2);
            }
            throw error;
        }
    }
    
    /**
     * Create a promise that resolves after a condition is met
     */
    static waitFor(condition, timeout = 5000, interval = 100) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(check, interval);
                }
            };
            
            check();
        });
    }
    
    /**
     * Batch process items with concurrency limit
     */
    static async batchProcess(items, processor, concurrency = 3) {
        const results = [];
        
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
            );
            results.push(...batchResults);
        }
        
        return results;
    }
    
    /**
     * Create a memoized function
     */
    static memoize(fn) {
        const cache = new Map();
        return function memoizedFunction(...args) {
            const key = JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }
    
    /**
     * Create a cached function with TTL
     */
    static cached(fn, ttl = 60000) {
        const cache = new Map();
        return function cachedFunction(...args) {
            const key = JSON.stringify(args);
            const now = Date.now();
            
            if (cache.has(key)) {
                const { value, timestamp } = cache.get(key);
                if (now - timestamp < ttl) {
                    return value;
                }
            }
            
            const result = fn.apply(this, args);
            cache.set(key, { value: result, timestamp: now });
            return result;
        };
    }
    
    /**
     * Create a function that can only be called once
     */
    static once(fn) {
        let called = false;
        let result;
        return function onceFunction(...args) {
            if (!called) {
                called = true;
                result = fn.apply(this, args);
            }
            return result;
        };
    }
    
    /**
     * Create a function that can only be called n times
     */
    static limit(fn, n) {
        let count = 0;
        return function limitedFunction(...args) {
            if (count < n) {
                count++;
                return fn.apply(this, args);
            }
            throw new Error(`Function can only be called ${n} times`);
        };
    }
    
    /**
     * Create a function that delays execution
     */
    static delay(fn, ms) {
        return function delayedFunction(...args) {
            return new Promise(resolve => {
                setTimeout(() => {
                    const result = fn.apply(this, args);
                    resolve(result);
                }, ms);
            });
        };
    }
    
    /**
     * Create a function that times out after specified duration
     */
    static timeout(fn, ms) {
        return function timeoutFunction(...args) {
            return Promise.race([
                fn.apply(this, args),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Function timed out')), ms);
                })
            ]);
        };
    }
    
    /**
     * Create a function that retries on failure
     */
    static retryable(fn, retries = 3, delay = 1000) {
        return async function retryableFunction(...args) {
            return this.retry(() => fn.apply(this, args), retries, delay);
        };
    }
    
    /**
     * Create a function that batches calls
     */
    static batched(fn, batchSize = 10, delay = 100) {
        let batch = [];
        let timeout;
        
        return function batchedFunction(...args) {
            return new Promise((resolve, reject) => {
                batch.push({ args, resolve, reject });
                
                if (batch.length >= batchSize) {
                    this.processBatch();
                } else if (!timeout) {
                    timeout = setTimeout(() => this.processBatch(), delay);
                }
            });
        };
    }
    
    /**
     * Process batched calls
     */
    processBatch() {
        if (batch.length === 0) return;
        
        const currentBatch = [...batch];
        batch = [];
        timeout = null;
        
        try {
            const results = fn(currentBatch.map(item => item.args));
            currentBatch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            currentBatch.forEach(item => item.reject(error));
        }
    }
    
    /**
     * Create a function that caches results by key
     */
    static keyedCache(fn, keyFn) {
        const cache = new Map();
        return function keyedCacheFunction(...args) {
            const key = keyFn(...args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = fn.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }
    
    /**
     * Create a function that validates input
     */
    static validated(fn, validator) {
        return function validatedFunction(...args) {
            if (!validator(...args)) {
                throw new Error('Invalid arguments');
            }
            return fn.apply(this, args);
        };
    }
    
    /**
     * Create a function that logs execution
     */
    static logged(fn, logger = console.log) {
        return function loggedFunction(...args) {
            const start = Date.now();
            const result = fn.apply(this, args);
            const duration = Date.now() - start;
            logger(`Function ${fn.name} executed in ${duration}ms`);
            return result;
        };
    }
    
    /**
     * Create a function that measures performance
     */
    static measured(fn) {
        return function measuredFunction(...args) {
            const start = performance.now();
            const result = fn.apply(this, args);
            const duration = performance.now() - start;
            
            if (window.errorLogger) {
                window.errorLogger.debug('Function performance measured', {
                    function: fn.name,
                    duration: duration,
                    args: args.length
                });
            }
            
            return result;
        };
    }
    
    /**
     * Create a function that handles errors gracefully
     */
    static safe(fn, fallback = null) {
        return function safeFunction(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                if (window.errorLogger) {
                    window.errorLogger.error('Function execution failed', {
                        function: fn.name,
                        error: error.message,
                        args: args
                    });
                }
                return fallback;
            }
        };
    }
    
    /**
     * Create a function that can be cancelled
     */
    static cancellable(fn) {
        let cancelled = false;
        
        const cancel = () => {
            cancelled = true;
        };
        
        const cancellableFn = function cancellableFunction(...args) {
            if (cancelled) {
                throw new Error('Function execution cancelled');
            }
            return fn.apply(this, args);
        };
        
        cancellableFn.cancel = cancel;
        return cancellableFn;
    }
    
    /**
     * Create a function that can be paused and resumed
     */
    static pausable(fn) {
        let paused = false;
        let pausedAt = null;
        
        const pause = () => {
            paused = true;
            pausedAt = Date.now();
        };
        
        const resume = () => {
            paused = false;
            pausedAt = null;
        };
        
        const pausableFn = function pausableFunction(...args) {
            if (paused) {
                throw new Error('Function execution paused');
            }
            return fn.apply(this, args);
        };
        
        pausableFn.pause = pause;
        pausableFn.resume = resume;
        pausableFn.isPaused = () => paused;
        pausableFn.getPausedDuration = () => paused ? Date.now() - pausedAt : 0;
        
        return pausableFn;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernUtils;
}
