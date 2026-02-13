/**
 * Simplified Theme Management with Cookie Persistence
 * Purely JavaScript-based for reliability and performance
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
        if (typeof document === 'undefined') return null;
        
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === COOKIE_NAME && value) {
                const theme = decodeURIComponent(value);
                if (VALID_THEMES.includes(theme)) {
                    console.log('[Theme] Found theme in cookie:', theme);
                    return theme;
                }
            }
        }
        return null;
    }
    
    /**
     * Set theme cookie with both expires and max-age for better compatibility
     */
    function setThemeCookie(theme) {
        if (!VALID_THEMES.includes(theme)) {
            console.warn('[Theme] Invalid theme for cookie:', theme);
            return;
        }
        
        try {
            const expires = new Date();
            expires.setTime(expires.getTime() + (COOKIE_MAX_AGE * 1000));
            
            const cookieString = `${COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; max-age=${COOKIE_MAX_AGE}; expires=${expires.toUTCString()}; SameSite=Lax`;
            document.cookie = cookieString;
            
            console.log('[Theme] Cookie set:', theme);
        } catch (error) {
            console.error('[Theme] Error setting cookie:', error);
        }
    }
    
    /**
     * Apply theme to DOM
     */
    function applyTheme(theme) {
        if (!VALID_THEMES.includes(theme)) {
            console.warn('[Theme] Invalid theme, using default:', theme);
            theme = DEFAULT_THEME;
        }
        
        try {
            document.documentElement.setAttribute('data-theme', theme);
            console.log('[Theme] Applied to DOM:', theme);
            return theme;
        } catch (error) {
            console.error('[Theme] Error applying theme:', error);
            return DEFAULT_THEME;
        }
    }
    
    /**
     * Get theme from system preference
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    
    /**
     * Get preferred theme in order: cookie > system > default
     */
    function getPreferredTheme() {
        // Check cookie first
        const saved = getThemeCookie();
        if (saved) {
            return saved;
        }
        
        // Check system preference
        const system = getSystemTheme();
        console.log('[Theme] Using system preference:', system);
        return system;
    }
    
    /**
     * Initialize theme system
     */
    function init() {
        const theme = getPreferredTheme();
        applyTheme(theme);
        console.log('[Theme] Initialization complete, current theme:', theme);
    }
    
    /**
     * Set theme and persist to cookie
     */
    function setTheme(theme) {
        console.log('[Theme] setTheme called with:', theme);
        
        if (!VALID_THEMES.includes(theme)) {
            console.error('[Theme] Invalid theme:', theme);
            return false;
        }
        
        // Apply to DOM first
        applyTheme(theme);
        
        // Then save to cookie
        setThemeCookie(theme);
        
        // Dispatch custom event for other listeners
        try {
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        } catch (error) {
            console.warn('[Theme] Could not dispatch event:', error);
        }
        
        return true;
    }
    
    /**
     * Get current theme from DOM
     */
    function getCurrentTheme() {
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        return VALID_THEMES.includes(htmlTheme) ? htmlTheme : DEFAULT_THEME;
    }
    
    return {
        init,
        setTheme,
        getCurrentTheme,
        getPreferredTheme,
        getSystemTheme
    };
})();

// Initialize theme system immediately to prevent flash
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
    ThemeManager.init();
}