/**
 * Confetti Management System
 * Data-Oriented Design approach for confetti effects
 * Supports: cookie-based type persistence, custom image particles, multiple effect types
 */

const Confetti = (() => {

    const state = {
        confettiLib: null,
        isInitialized: false,
        activeAnimations: [],
        snowAnimationId: null,
        imageAnimId: null,
        imageCanvas: null,
        loadedImages: [],
        initAttempts: 0,
        typesConfig: null,
        currentType: 'standard'
    };

    const config = {
        MAX_INIT_ATTEMPTS: 50,
        INIT_RETRY_DELAY: 100,
        WELCOME_DELAY: 500,
        DEFAULT_Z_INDEX: -1,
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
                particleCount: 1,
                startVelocity: 0,
                shapes: ['circle'],
                gravity: [0.3, 0.5],
                scalar: [0.6, 1.2],
                drift: [-0.3, 0.3],
                ticks: [300, 600]
            },
            burst: {
                particleCount: 100,
                spread: 70,
                startVelocity: 45,
                origin: { x: 0.5, y: 0.5 }
            }
        }
    };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    function log(msg, ...a)  { console.log(`[Confetti] ${msg}`, ...a); }
    function warn(msg, ...a) { console.warn(`[Confetti] ${msg}`, ...a); }
    function error(msg, ...a){ console.error(`[Confetti] ${msg}`, ...a); }

    function getCookie(name) {
        const m = document.cookie.match(
            new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
        );
        return m ? decodeURIComponent(m[1]) : null;
    }

    function setCookie(name, value, days) {
        const maxAge = days ? `; max-age=${days * 86400}` : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${maxAge}; path=/; SameSite=Lax`;
    }

    function hasCookieConsent() {
        return true;
    }

    async function loadTypesConfig() {
        try {
            const res = await fetch('/frontend/src/json/confetti-types.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            state.typesConfig = await res.json();
            log('Types loaded:', state.typesConfig.types.map(t => t.id).join(', '));
        } catch (err) {
            warn('Could not load confetti-types.json, using defaults:', err.message);
            state.typesConfig = {
                types: [
                    { id: 'none',     labelKey: 'confetti.types.none'     },
                    { id: 'standard', labelKey: 'confetti.types.standard' },
                    { id: 'snow',     labelKey: 'confetti.types.snow'     }
                ],
                images: []
            };
        }
    }

    async function loadCustomImages() {
        const paths = state.typesConfig?.images;
        if (!paths || paths.length === 0) return;

        const loaded = await Promise.all(paths.map(filename =>
            new Promise(resolve => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => { warn('Failed to load confetti image:', filename); resolve(null); };
                img.src = `/public/images/confetti/${filename}`;
            })
        ));
        state.loadedImages = loaded.filter(Boolean);
        log('Loaded', state.loadedImages.length, 'custom images');
    }

    function tl(key, fallback = key) {
        return window.LanguageSystem?.t?.(key, fallback) ?? fallback;
    }

    function getType() { return state.currentType; }

    function setType(id, save = true) {
        stopAll();
        state.currentType = id;

        if (save && hasCookieConsent()) {
            setCookie('confettiType', id, 365);
        }

        if (id === 'snow') {
            playSnow();
        } else if (id === 'images') {
            playImageConfetti({ continuous: true });
        }

        updateConfettiCurrentLabel(id);
        log('Type set to:', id);
    }

    function updateConfettiCurrentLabel(typeId) {
        const el = document.getElementById('confettiCurrent');
        if (!el || !state.typesConfig) return;
        const found = state.typesConfig.types.find(t => t.id === typeId);
        if (!found) return;
        el.textContent = tl(found.labelKey, typeId);
        el.dataset.i18n = found.labelKey;
    }

    function buildDropdown() {
        const content = document.getElementById('confettiDropdownContent');
        if (!content || !state.typesConfig) return;

        const visible = state.typesConfig.types.filter(t =>
            !(t.id === 'images' && state.loadedImages.length === 0)
        );

        content.innerHTML = visible.map(type =>
            `<button class="dropdown-option confetti-type-option${state.currentType === type.id ? ' active' : ''}" ` +
            `data-confetti-type="${type.id}" data-i18n="${type.labelKey}">${tl(type.labelKey, type.id)}</button>`
        ).join('');

        content.querySelectorAll('.confetti-type-option').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                setType(btn.dataset.confettiType);
                document.getElementById('confettiDropdown')?.classList.remove('active');
                content.querySelectorAll('.confetti-type-option').forEach(b =>
                    b.classList.toggle('active', b.dataset.confettiType === state.currentType)
                );
            });
        });
    }

    function isReady() {
        return state.isInitialized && state.confettiLib !== null;
    }

    function fire(options = {}) {
        if (!isReady()) { warn('Not initialized'); return; }
        state.confettiLib({ zIndex: config.DEFAULT_Z_INDEX, ...options });
    }

    function stopAll() {
        stopSnow();
        stopImageConfetti();
        state.activeAnimations.forEach(id => clearInterval(id));
        state.activeAnimations = [];
        if (state.confettiLib?.reset) state.confettiLib.reset();
    }

    function playWelcome() {
        if (!isReady()) { warn('Not ready for welcome'); return; }

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
                const idx = state.activeAnimations.indexOf(intervalId);
                if (idx > -1) state.activeAnimations.splice(idx, 1);
                return;
            }
            const particleCount = preset.particleCount * (timeLeft / preset.duration);
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

    function playImageConfetti(options = {}) {
        if (state.loadedImages.length === 0) {
            warn('No custom images — falling back to standard welcome');
            if (isReady()) playWelcome();
            return;
        }

        stopImageConfetti();

        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;';
        document.body.appendChild(canvas);
        state.imageCanvas = canvas;

        const ctx = canvas.getContext('2d');
        const continuous = options.continuous || false;
        const DURATION    = options.duration || 5000;
        const COUNT       = continuous ? 60 : 80;
        const startTime   = Date.now();

        function resize() {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        const onResize = () => resize();
        window.addEventListener('resize', onResize);
        canvas._resizeHandler = onResize;

        function spawnParticle(startY = null) {
            const img = state.loadedImages[Math.floor(Math.random() * state.loadedImages.length)];
            return {
                img,
                x: Math.random() * canvas.width,
                y: startY !== null ? startY : -Math.random() * canvas.height * 0.5,
                size: 22 + Math.random() * 26,
                speedX: (Math.random() - 0.5) * 2.5,
                speedY: continuous ? 1.2 + Math.random() * 1.8 : 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.08
            };
        }

        const particles = Array.from({ length: COUNT }, () => spawnParticle());

        function frame() {
            const elapsed  = Date.now() - startTime;
            const progress = continuous ? 0 : Math.min(elapsed / DURATION, 1);
            const alpha    = progress > 0.75 ? 1 - (progress - 0.75) / 0.25 : 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particles) {
                p.x += p.speedX;
                p.y += p.speedY;
                p.rotation += p.rotSpeed;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                if (p.x < -p.size) p.x = canvas.width + p.size;
                if (p.x > canvas.width + p.size) p.x = -p.size;
                if (continuous && p.y > canvas.height + p.size) {
                    Object.assign(p, spawnParticle(-p.size));
                }
            }

            if (continuous || progress < 1) {
                state.imageAnimId = requestAnimationFrame(frame);
            } else {
                stopImageConfetti();
            }
        }

        state.imageAnimId = requestAnimationFrame(frame);
        log('Image confetti started', continuous ? '(continuous)' : '(burst)');
    }

    function stopImageConfetti() {
        if (state.imageAnimId !== null) {
            cancelAnimationFrame(state.imageAnimId);
            state.imageAnimId = null;
        }
        if (state.imageCanvas) {
            if (state.imageCanvas._resizeHandler) {
                window.removeEventListener('resize', state.imageCanvas._resizeHandler);
            }
            state.imageCanvas.remove();
            state.imageCanvas = null;
        }
    }

    function getTextColor() {
        return getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    }

    function playSnow() {
        if (!isReady()) { warn('Not ready for snow'); return; }
        if (state.snowAnimationId !== null) stopSnow();

        const preset = config.PRESETS.snow;
        let skew = 1, frameCount = 0;

        function frame() {
            skew = Math.max(0.8, skew - 0.001);
            frameCount++;
            const textColor = getTextColor();
            const count = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 2 : 0);
            for (let i = 0; i < count; i++) {
                fire({
                    particleCount: preset.particleCount,
                    startVelocity: preset.startVelocity,
                    ticks: randomInRange(preset.ticks[0], preset.ticks[1]),
                    origin: { x: Math.random(), y: (Math.random() * skew) - 0.2 },
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
        log('Snow started');
    }

    function stopSnow() {
        if (state.snowAnimationId !== null) {
            cancelAnimationFrame(state.snowAnimationId);
            state.snowAnimationId = null;
            log('Snow stopped');
        }
    }

    function playCurrent() {
        switch (state.currentType) {
            case 'none':
                break;
            case 'snow':
                playSnow();
                break;
            case 'images':
                playImageConfetti({ continuous: true });
                break;
            case 'standard':
            default:
                // Use image burst for opening if images are available
                if (state.loadedImages.length > 0) {
                    playImageConfetti({ continuous: false, duration: 5000 });
                } else if (isReady()) {
                    playWelcome();
                }
                break;
        }
    }

    function playBurst(x = 0.5, y = 0.5, options = {}) {
        if (!isReady()) return;
        fire({ ...config.PRESETS.burst, ...options, origin: { x, y } });
    }

    function play(animationData) {
        if (!isReady()) return;
        fire(animationData);
    }

    function reset() {
        stopAll();
        log('Reset complete');
    }

    function getState() {
        return {
            isInitialized: state.isInitialized,
            currentType: state.currentType,
            activeAnimations: state.activeAnimations.length,
            loadedImages: state.loadedImages.length
        };
    }

    function getPresets() { return Object.keys(config.PRESETS); }

    async function init() {
        if (state.isInitialized) { log('Already initialized'); return true; }

        await loadTypesConfig();
        await loadCustomImages();

        // Restore saved type from cookie (only if consent given)
        if (hasCookieConsent()) {
            const saved = getCookie('confettiType');
            if (saved && state.typesConfig.types.some(t => t.id === saved)) {
                state.currentType = saved;
            }
        }

        buildDropdown();
        updateConfettiCurrentLabel(state.currentType);

        // Rebuild dropdown text on language change
        document.addEventListener('languageChanged', () => {
            buildDropdown();
            updateConfettiCurrentLabel(state.currentType);
        });

        return initLib();
    }

    function initLib() {
        if (typeof window.confetti !== 'undefined') {
            state.confettiLib = window.confetti;
            state.isInitialized = true;
            log('Library ready');
            setTimeout(() => playCurrent(), config.WELCOME_DELAY);
            return true;
        }

        state.initAttempts++;
        if (state.initAttempts < config.MAX_INIT_ATTEMPTS) {
            setTimeout(initLib, config.INIT_RETRY_DELAY);
            return false;
        }

        // Library never loaded — still mark initialized so image type works
        warn(`Library not loaded after ${state.initAttempts} attempts`);
        state.isInitialized = true;
        if (state.currentType === 'images' && state.loadedImages.length > 0) {
            setTimeout(() => playCurrent(), config.WELCOME_DELAY);
        }
        return false;
    }

    return {
        init,
        isReady,
        play,
        playWelcome,
        playSnow,
        stopSnow,
        playBurst,
        playImageConfetti,
        stopImageConfetti,
        reset,
        getState,
        getType,
        setType,
        getPresets,
        fire
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Confetti.init());
} else {
    Confetti.init();
}

window.Confetti = Confetti;