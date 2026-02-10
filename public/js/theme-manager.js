/**
 * Simplified Theme Management
 * Now purely JavaScript-based for reliability and performance
 */

const ThemeManager = (() => {
    const COOKIE_NAME = 'theme';
    const COOKIE_MAX_AGE = 31536000; // 30 days in seconds
    const DEFAULT_THEME = 'dark';
    const VALID_THEMES = ['light', 'dark'];
    
    /**
     * Get theme from cookie
     */
    function getThemeCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === COOKIE_NAME && value) {
                const theme = decodeURIComponent(value);
                return VALID_THEMES.includes(theme) ? theme : null;
            }
        }
        return null;
    }
    
    /**
     * Set theme cookie
     */
    function setThemeCookie(theme) {
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + COOKIE_MAX_AGE);
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; expires=${expires.toUTCString()}`;
    }
    
    /**
     * Apply theme to DOM
     */
    function applyTheme(theme) {
        if (!VALID_THEMES.includes(theme)) {
            theme = DEFAULT_THEME;
        }
        document.documentElement.setAttribute('data-theme', theme);
        return theme;
    }
    
    /**
     * Get preferred theme
     */
    function getPreferredTheme() {
        // Check cookie first
        const saved = getThemeCookie();
        if (saved) {
            return saved;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return DEFAULT_THEME;
    }
    
    /**
     * Initialize theme system
     */
    function init() {
        const theme = getPreferredTheme();
        applyTheme(theme);
        console.log('Theme system initialized:', theme);
    }
    
    /**
     * Set theme and persist
     */
    function setTheme(theme) {
        if (!VALID_THEMES.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return false;
        }
        applyTheme(theme);
        setThemeCookie(theme);
        return true;
    }
    
    /**
     * Get current theme
     */
    function getCurrentTheme() {
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        return VALID_THEMES.includes(htmlTheme) ? htmlTheme : DEFAULT_THEME;
    }
    
    return {
        init,
        setTheme,
        getCurrentTheme,
        getPreferredTheme
    };
})();

// Initialize theme system immediately to prevent flash
ThemeManager.init();
