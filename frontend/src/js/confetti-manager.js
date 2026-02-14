/**
 * Confetti Management System
 * Data-Oriented Design approach for confetti effects
 * Follows pattern similar to LanguageSystem
 */

const Confetti = (() => {
    // ===========================
    // STATE (Data-Oriented Design)
    // ===========================
    
    const state = {
        confettiLib: null,
        isInitialized: false,
        activeAnimations: [],
        snowAnimationId: null,
        initAttempts: 0
    };
    
    const config = {
        MAX_INIT_ATTEMPTS: 50,
        INIT_RETRY_DELAY: 100,
        WELCOME_DELAY: 500,
        DEFAULT_Z_INDEX: 0,
        PRESETS: {
            welcome: {
                duration: 3000,
                interval: 250,
                particleCount: 50,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                scalar: 0.8,
                origins: [
                    { x: [0.1, 0.3], y: [-0.2, 0] },
                    { x: [0.7, 0.9], y: [-0.2, 0] }
                ]
            },
            snow: {
                duration: 15000,
                particleCount: 1,
                startVelocity: 0,
                colors: ['#ffffff'], // Will be overridden dynamically
                shapes: ['circle'],
                gravity: [0.3, 0.5],
                scalar: [0.6, 1.2],
                drift: [-0.3, 0.3],
                ticks: [300, 600],
                swayAmplitude: [0.5, 1.5],
                swayFrequency: [0.01, 0.03]
            },
            burst: {
                particleCount: 100,
                spread: 70,
                startVelocity: 45,
                origin: { x: 0.5, y: 0.5 }
            }
        }
    };
    
    // ===========================
    // UTILITY FUNCTIONS
    // ===========================
    
    /**
     * Generate random number in range
     */
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Log with consistent prefix
     */
    function log(message, ...args) {
        console.log(`[Confetti] ${message}`, ...args);
    }
    
    function warn(message, ...args) {
        console.warn(`[Confetti] ${message}`, ...args);
    }
    
    function error(message, ...args) {
        console.error(`[Confetti] ${message}`, ...args);
    }
    
    // ===========================
    // INITIALIZATION
    // ===========================
    
    /**
     * Initialize confetti library with retry mechanism
     */
    function init() {
        if (state.isInitialized) {
            log('Already initialized');
            return true;
        }
        
        // Check if confetti library is loaded
        if (typeof window.confetti === 'undefined') {
            state.initAttempts++;
            if (state.initAttempts < config.MAX_INIT_ATTEMPTS) {
                // Retry after delay
                setTimeout(init, config.INIT_RETRY_DELAY);
                return false;
            }
            error(`Library not loaded after ${state.initAttempts} attempts`);
            return false;
        }
        
        state.confettiLib = window.confetti;
        state.isInitialized = true;
        log('Initialized successfully');
        
        // Fire welcome animation after initialization
        setTimeout(() => {
            playSnow();
        }, config.WELCOME_DELAY);
        
        return true;
    }
    
    /**
     * Check if confetti system is ready
     */
    function isReady() {
        return state.isInitialized && state.confettiLib !== null;
    }
    
    // ===========================
    // ANIMATION FUNCTIONS
    // ===========================
    
    /**
     * Fire confetti with given options
     */
    function fire(options = {}) {
        if (!isReady()) {
            warn('Not initialized, cannot fire confetti');
            return;
        }
        
        const opts = {
            zIndex: config.DEFAULT_Z_INDEX,
            ...options
        };
        
        state.confettiLib(opts);
    }
    
    /**
     * Play welcome burst animation
     */
    function playWelcome() {
        if (!isReady()) {
            warn('Not ready for welcome animation');
            return;
        }
        
        const preset = config.PRESETS.welcome;
        const animationEnd = Date.now() + preset.duration;
        const defaults = {
            startVelocity: preset.startVelocity,
            spread: preset.spread,
            ticks: preset.ticks,
            zIndex: config.DEFAULT_Z_INDEX,
            scalar: preset.scalar
        };
        
        const intervalId = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
                clearInterval(intervalId);
                const index = state.activeAnimations.indexOf(intervalId);
                if (index > -1) state.activeAnimations.splice(index, 1);
                return;
            }
            
            const particleCount = preset.particleCount * (timeLeft / preset.duration);
            
            // Fire from each origin point
            preset.origins.forEach(originRange => {
                fire({
                    ...defaults,
                    particleCount,
                    origin: {
                        x: randomInRange(originRange.x[0], originRange.x[1]),
                        y: randomInRange(originRange.y[0], originRange.y[1])
                    }
                });
            });
        }, preset.interval);
        
        state.activeAnimations.push(intervalId);
        log('Welcome burst started');
    }
    
    /**
     * Get current text color from CSS variable
     */
    function getTextColor() {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary').trim();
    }
    
    /**
     * Play snow effect
     */
    function playSnow() {
        if (!isReady()) {
            warn('Not ready for snow animation');
            return;
        }
        
        // Stop existing snow animation if running
        if (state.snowAnimationId !== null) {
            stopSnow();
        }
        
        const preset = config.PRESETS.snow;
        let skew = 1;
        let frameCount = 0;
        
        function frame() {
            skew = Math.max(0.8, skew - 0.001);
            frameCount++;
            
            // Get current text color for snow particles
            const textColor = getTextColor();
            
            // Create snow with natural movement
            const particleCount = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 2 : 0);
            
            for (let i = 0; i < particleCount; i++) {
                fire({
                    particleCount: preset.particleCount,
                    startVelocity: preset.startVelocity,
                    ticks: randomInRange(preset.ticks[0], preset.ticks[1]),
                    origin: {
                        x: Math.random(),
                        y: (Math.random() * skew) - 0.2
                    },
                    colors: [textColor],
                    shapes: preset.shapes,
                    gravity: randomInRange(preset.gravity[0], preset.gravity[1]),
                    scalar: randomInRange(preset.scalar[0], preset.scalar[1]),
                    drift: randomInRange(preset.drift[0], preset.drift[1]) + Math.sin(frameCount * 0.01) * 0.5
                });
            }
            
            state.snowAnimationId = requestAnimationFrame(frame);
        }
        
        state.snowAnimationId = requestAnimationFrame(frame);
        log('Snow effect started');
    }
    
    /**
     * Stop snow effect
     */
    function stopSnow() {
        if (state.snowAnimationId !== null) {
            cancelAnimationFrame(state.snowAnimationId);
            state.snowAnimationId = null;
            log('Snow effect stopped');
        }
    }
    
    /**
     * Play burst at specific coordinates
     */
    function playBurst(x = 0.5, y = 0.5, options = {}) {
        if (!isReady()) {
            warn('Not ready for burst');
            return;
        }
        
        const preset = config.PRESETS.burst;
        fire({
            ...preset,
            ...options,
            origin: { x, y }
        });
    }
    
    /**
     * Play custom confetti animation
     */
    function play(animationData) {
        if (!isReady()) {
            warn('Not ready to play animation');
            return;
        }
        
        fire(animationData);
    }
    
    // ===========================
    // CONTROL FUNCTIONS
    // ===========================
    
    /**
     * Stop all active animations and clear confetti
     */
    function reset() {
        // Stop snow animation
        stopSnow();
        
        // Clear active animation intervals
        state.activeAnimations.forEach(intervalId => {
            clearInterval(intervalId);
        });
        state.activeAnimations = [];
        
        // Reset confetti library
        if (state.confettiLib && state.confettiLib.reset) {
            state.confettiLib.reset();
            log('Reset complete');
        }
    }
    
    /**
     * Get current state (for debugging)
     */
    function getState() {
        return {
            isInitialized: state.isInitialized,
            activeAnimations: state.activeAnimations.length,
            initAttempts: state.initAttempts
        };
    }
    
    /**
     * Get available presets
     */
    function getPresets() {
        return Object.keys(config.PRESETS);
    }
    
    // ===========================
    // PUBLIC API
    // ===========================
    
    return {
        // Initialization
        init,
        isReady,
        
        // Animation controls
        play,
        playWelcome,
        playSnow,
        stopSnow,
        playBurst,
        
        // Utilities
        reset,
        getState,
        getPresets,
        
        // Low-level access
        fire
    };
})();

// ===========================
// AUTO-INITIALIZATION
// ===========================

/**
 * Setup confetti system
 */
function setupConfetti() {
    console.log('[Confetti] Starting setup');
    Confetti.init();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupConfetti);
} else {
    setupConfetti();
}

// Expose to global scope (like LanguageSystem and ThemeManager)
window.Confetti = Confetti;