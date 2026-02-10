/**
 * Kooraseru - Client-side theme helper
 * Provides fallback if WebAssembly module hasn't loaded yet
 */

const ThemeHelper = (() => {
    const COOKIE_NAME = 'theme';
    const COOKIE_MAX_AGE = 31536000; // 30 days in seconds
    const DEFAULT_THEME = 'dark';
    
    /**
     * Get the theme cookie value
     * @returns {string|null} The theme value or null if not found
     */
    function getCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === COOKIE_NAME && value) {
                return decodeURIComponent(value);
            }
        }
        return null;
    }
    
    /**
     * Set the theme cookie
     * @param {string} theme - The theme name
     */
    function setCookie(theme) {
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + COOKIE_MAX_AGE);
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; expires=${expires.toUTCString()}`;
    }
    
    /**
     * Apply a theme to the document
     * @param {string} theme - The theme name
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    /**
     * Get the preferred theme
     * @returns {string} The preferred theme
     */
    function getPreferredTheme() {
        // Check cookie first
        const saved = getCookie();
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
     * Initialize the theme system
     */
    function init() {
        const theme = getPreferredTheme();
        applyTheme(theme);
    }
    
    /**
     * Set theme with cookie persistence
     * @param {string} theme - The theme name
     */
    function setTheme(theme) {
        applyTheme(theme);
        setCookie(theme);
    }
    
    return {
        init,
        setTheme,
        getPreferredTheme,
        applyTheme,
        getCookie,
        setCookie,
    };
})();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ThemeHelper.init);
} else {
    ThemeHelper.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeHelper;
}