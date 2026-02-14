/**
 * Wind System
 * Manages background wind effects with randomly generated particles
 * Data-Oriented Design approach
 */

const WindSystem = (() => {
    // ===========================
    // STATE (Data-Oriented Design)
    // ===========================
    
    const state = {
        canvas: null,
        ctx: null,
        animationFrameId: null,
        isActive: false,
        particles: [],
        windSpeed: 0,
        targetWindSpeed: 0,
        lastGustTime: 0
    };
    
    const config = {
        MAX_PARTICLES: 50,
        PARTICLE_SPAWN_RATE: 0.3, // Probability per frame
        WIND_TRANSITION_SPEED: 0.02,
        GUST_INTERVAL: { min: 3000, max: 8000 }, // milliseconds
        GUST_STRENGTH: { min: 0.5, max: 2.5 },
        BASE_WIND_SPEED: { min: 0.2, max: 0.8 },
        PARTICLE_SIZE: { min: 2, max: 6 },
        PARTICLE_OPACITY: { min: 0.1, max: 0.3 },
        PARTICLE_SPEED: { min: 1, max: 3 },
        PARTICLE_LIFE: { min: 100, max: 300 }, // frames
        Z_INDEX: -1 // Behind everything
    };
    
    // ===========================
    // PARTICLE CLASS
    // ===========================
    
    class WindParticle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = -10; // Start off-screen left
            this.y = Math.random() * (state.canvas?.height || window.innerHeight);
            this.size = randomInRange(config.PARTICLE_SIZE.min, config.PARTICLE_SIZE.max);
            this.opacity = randomInRange(config.PARTICLE_OPACITY.min, config.PARTICLE_OPACITY.max);
            this.baseSpeed = randomInRange(config.PARTICLE_SPEED.min, config.PARTICLE_SPEED.max);
            this.life = randomInRange(config.PARTICLE_LIFE.min, config.PARTICLE_LIFE.max);
            this.age = 0;
            this.wobble = Math.random() * Math.PI * 2;
            this.wobbleSpeed = randomInRange(0.02, 0.05);
            
            // Generate random shape (circle, line, or elongated oval)
            this.shape = Math.random() < 0.7 ? 'circle' : (Math.random() < 0.5 ? 'line' : 'oval');
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = randomInRange(-0.05, 0.05);
        }
        
        update() {
            // Apply wind speed
            const windEffect = state.windSpeed * this.baseSpeed;
            this.x += windEffect + this.baseSpeed;
            
            // Add subtle vertical wobble
            this.wobble += this.wobbleSpeed;
            this.y += Math.sin(this.wobble) * 0.5;
            
            // Rotate particle
            this.rotation += this.rotationSpeed;
            
            this.age++;
            
            // Check if particle is off-screen or expired
            if (this.x > (state.canvas?.width || window.innerWidth) + 10 || this.age > this.life) {
                this.reset();
            }
        }
        
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity * (1 - (this.age / this.life) * 0.5);
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-secondary').trim();
            
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'line') {
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.lineWidth = 1;
                ctx.strokeStyle = ctx.fillStyle;
                ctx.stroke();
            } else if (this.shape === 'oval') {
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size, this.size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // ===========================
    // UTILITY FUNCTIONS
    // ===========================
    
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function log(message, ...args) {
        console.log(`[Wind] ${message}`, ...args);
    }
    
    function warn(message, ...args) {
        console.warn(`[Wind] ${message}`, ...args);
    }
    
    // ===========================
    // WIND MANAGEMENT
    // ===========================
    
    function updateWind() {
        const now = Date.now();
        
        // Check if it's time for a wind gust
        if (now - state.lastGustTime > randomInRange(config.GUST_INTERVAL.min, config.GUST_INTERVAL.max)) {
            // Create random gust
            const gustStrength = randomInRange(config.GUST_STRENGTH.min, config.GUST_STRENGTH.max);
            state.targetWindSpeed = randomInRange(config.BASE_WIND_SPEED.min, config.BASE_WIND_SPEED.max) * gustStrength;
            state.lastGustTime = now;
            log(`Wind gust: ${state.targetWindSpeed.toFixed(2)}`);
        }
        
        // Smoothly transition wind speed
        const diff = state.targetWindSpeed - state.windSpeed;
        state.windSpeed += diff * config.WIND_TRANSITION_SPEED;
    }
    
    // ===========================
    // CANVAS MANAGEMENT
    // ===========================
    
    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'wind-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = config.Z_INDEX;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        document.body.appendChild(canvas);
        return canvas;
    }
    
    function resizeCanvas() {
        if (state.canvas) {
            state.canvas.width = window.innerWidth;
            state.canvas.height = window.innerHeight;
        }
    }
    
    // ===========================
    // ANIMATION LOOP
    // ===========================
    
    function animate() {
        if (!state.isActive) return;
        
        // Clear canvas
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        
        // Update wind
        updateWind();
        
        // Spawn new particles
        if (state.particles.length < config.MAX_PARTICLES && Math.random() < config.PARTICLE_SPAWN_RATE) {
            state.particles.push(new WindParticle());
        }
        
        // Update and draw particles
        for (const particle of state.particles) {
            particle.update();
            particle.draw(state.ctx);
        }
        
        state.animationFrameId = requestAnimationFrame(animate);
    }
    
    // ===========================
    // PUBLIC API
    // ===========================
    
    function init() {
        if (state.canvas) {
            warn('Already initialized');
            return;
        }
        
        log('Initializing wind system');
        
        // Create canvas
        state.canvas = createCanvas();
        state.ctx = state.canvas.getContext('2d');
        
        // Initialize wind
        state.targetWindSpeed = randomInRange(config.BASE_WIND_SPEED.min, config.BASE_WIND_SPEED.max);
        state.windSpeed = state.targetWindSpeed;
        state.lastGustTime = Date.now();
        
        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        
        log('Wind system initialized');
    }
    
    function start() {
        if (state.isActive) {
            warn('Already running');
            return;
        }
        
        if (!state.canvas) {
            init();
        }
        
        state.isActive = true;
        log('Wind effect started');
        animate();
    }
    
    function stop() {
        if (!state.isActive) return;
        
        state.isActive = false;
        if (state.animationFrameId) {
            cancelAnimationFrame(state.animationFrameId);
            state.animationFrameId = null;
        }
        
        // Clear canvas
        if (state.ctx) {
            state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
        }
        
        log('Wind effect stopped');
    }
    
    function setWindSpeed(speed) {
        state.targetWindSpeed = Math.max(0, Math.min(5, speed));
        log(`Wind speed set to: ${state.targetWindSpeed.toFixed(2)}`);
    }
    
    function getWindSpeed() {
        return {
            current: state.windSpeed,
            target: state.targetWindSpeed
        };
    }
    
    function getState() {
        return {
            isActive: state.isActive,
            particleCount: state.particles.length,
            windSpeed: state.windSpeed,
            targetWindSpeed: state.targetWindSpeed
        };
    }
    
    return {
        init,
        start,
        stop,
        setWindSpeed,
        getWindSpeed,
        getState
    };
})();

// ===========================
// AUTO-INITIALIZATION
// ===========================

function setupWind() {
    console.log('[Wind] Starting setup');
    WindSystem.init();
    WindSystem.start();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWind);
} else {
    setupWind();
}

// Expose to global scope
window.WindSystem = WindSystem;
