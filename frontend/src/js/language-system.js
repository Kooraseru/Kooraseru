/**
 * Language Detection and Routing System
 * Detects subdomain and loads appropriate language configuration
 */

const LanguageSystem = (() => {
    const DEFAULT_LANGUAGE = 'en';
    const SUPPORTED_LANGUAGES = {
        'en': { name: 'English', fontFamily: '"Google Sans", system-ui, -apple-system, sans-serif' },
        'ja': { name: '日本語', fontFamily: '"Noto Sans JP", "Google Sans", system-ui, -apple-system, sans-serif' }
    };
    
    /**
     * Get current subdomain
     * @returns {string} Current subdomain or 'www' if root
     */
    function getCurrentSubdomain() {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // localhost or IP address
        if (parts.length === 1 || hostname.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            // Check for port-based language hint (e.g., localhost:8000 = en)
            const port = window.location.port;
            return DEFAULT_LANGUAGE;
        }
        
        // Extract subdomain (first part before first dot)
        if (parts.length > 2) {
            return parts[0]; // jp.kooraseru.com -> jp
        }
        
        // Root domain or www
        return 'www';
    }
    
    /**
     * Get language from subdomain or fallback
     * @returns {string} Language code (en, ja, etc.)
     */
    function getLanguage() {
        const subdomain = getCurrentSubdomain();
        
        // Map subdomains to languages
        const subdomainMap = {
            'jp': 'ja',
            'ja': 'ja',
            'en': 'en',
            'www': 'en',
            'root': 'en'
        };
        
        const language = subdomainMap[subdomain];
        return language || DEFAULT_LANGUAGE;
    }
    
    /**
     * Redirect to default domain if unsupported subdomain
     */
    function validateSubdomain() {
        const currentLang = getLanguage();
        const currentSubdomain = getCurrentSubdomain();
        const isLocalhost = window.location.hostname.includes('localhost');
        
        // If localhost or dev server, allow everything
        if (isLocalhost || window.location.hostname.includes('127.0.0.1')) {
            return;
        }
        
        // If unsupported subdomain, redirect to www/root
        if (!Object.values(Object.keys(SUPPORTED_LANGUAGES)).includes(currentLang)) {
            const protocol = window.location.protocol;
            const pathname = window.location.pathname;
            const search = window.location.search;
            const newUrl = `${protocol}//www.kooraseru.com${pathname}${search}`;
            window.location.replace(newUrl);
        }
    }
    
    /**
     * Load translation JSON file
     * @param {string} language - Language code
     * @returns {Promise<Object>} Translation object
     */
    async function loadTranslation(language) {
        try {
            const response = await fetch(`frontend/src/i18n/${language}.json`);
            if (!response.ok) {
                console.warn(`Translation not found for ${language}, using default`);
                return loadTranslation(DEFAULT_LANGUAGE);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to load translation for ${language}:`, error);
            return { language: DEFAULT_LANGUAGE, languageName: 'English' };
        }
    }
    
    /**
     * Apply font based on language
     * @param {string} language - Language code
     */
    function applyLanguageFont(language) {
        const langConfig = SUPPORTED_LANGUAGES[language];
        if (langConfig) {
            document.documentElement.style.setProperty('--font-family-lang', langConfig.fontFamily);
            // Apply to body if CSS variables aren't supported
            document.body.style.fontFamily = langConfig.fontFamily;
        }
    }
    
    /**
     * Set HTML lang attribute
     * @param {string} language - Language code
     */
    function setHtmlLanguage(language) {
        document.documentElement.lang = language;
    }
    
    /**
     * Initialize language system
     * @returns {Promise<Object>} Translation object
     */
    async function init() {
        try {
            validateSubdomain();
            const language = getLanguage();
            const translation = await loadTranslation(language);
            
            applyLanguageFont(language);
            setHtmlLanguage(language);
            
            // Store in window for access by other scripts
            window.currentLanguage = language;
            window.translations = translation;
            
            return translation;
        } catch (error) {
            console.error('Failed to initialize language system:', error);
            return { language: DEFAULT_LANGUAGE };
        }
    }
    
    /**
     * Get translation value
     * @param {string} key - Dot-notation key (e.g., 'topbar.logoAlt')
     * @param {*} fallback - Fallback value if not found
     * @returns {*} Translated value or fallback
     */
    function t(key, fallback = key) {
        if (!window.translations) return fallback;
        
        const parts = key.split('.');
        let value = window.translations;
        
        for (const part of parts) {
            if (typeof value === 'object' && value !== null && part in value) {
                value = value[part];
            } else {
                return fallback;
            }
        }
        
        return value;
    }
    
    /**
     * Update page content with translations
     * @param {Object} translation - Translation object
     */
    function updatePageContent(translation) {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.dataset.i18n;
            const translatedText = t(key);
            
            if (element.tagName === 'IMG' || element.tagName === 'INPUT') {
                // For attributes
                const attr = element.dataset.i18nAttr || 'alt';
                element.setAttribute(attr, translatedText);
            } else {
                // For text content
                element.textContent = translatedText;
            }
        });
    }
    
    return {
        init,
        t,
        updatePageContent,
        getCurrentLanguage: () => window.currentLanguage || DEFAULT_LANGUAGE,
        getSubdomain: getCurrentSubdomain
    };
})();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LanguageSystem.init().then(() => LanguageSystem.updatePageContent()));
} else {
    LanguageSystem.init().then(() => LanguageSystem.updatePageContent());
}
