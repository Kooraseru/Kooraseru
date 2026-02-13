/**
 * Language Detection and Routing System
 * Detects subdomain and loads appropriate language configuration
 */

interface LanguageConfig {
    name: string;
    fontFamily: string;
}

interface Translation {
    [key: string]: any;
}

interface LanguageSystemInterface {
    init: () => Promise<Translation>;
    t: (key: string, fallback?: string) => string;
    updatePageContent: (translation?: Translation) => void;
    getCurrentLanguage: () => string;
    getSubdomain: () => string;
}

const LanguageSystem: LanguageSystemInterface = (() => {
    const DEFAULT_LANGUAGE = 'en';
    const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
        'en': { name: 'English', fontFamily: '"Google Sans", system-ui, -apple-system, sans-serif' },
        'ja': { name: '日本語', fontFamily: '"Noto Sans JP", "Google Sans", system-ui, -apple-system, sans-serif' }
    };

    let currentLanguage = DEFAULT_LANGUAGE;
    let translations: Translation = {};

    /**
     * Get current subdomain
     * @returns {string} Current subdomain or 'www' if root
     */
    function getCurrentSubdomain(): string {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');

        // localhost or IP address
        if (parts.length === 1 || hostname.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
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
    function getLanguage(): string {
        const subdomain = getCurrentSubdomain();

        // Map subdomains to languages
        const subdomainMap: Record<string, string> = {
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
    function validateSubdomain(): void {
        const currentLang = getLanguage();
        const isLocalhost = window.location.hostname.includes('localhost');

        // If localhost or dev server, allow everything
        if (isLocalhost || window.location.hostname.includes('127.0.0.1')) {
            return;
        }

        // If unsupported subdomain, redirect to www/root
        if (!Object.keys(SUPPORTED_LANGUAGES).includes(currentLang)) {
            const protocol = window.location.protocol;
            const pathname = window.location.pathname;
            const search = window.location.search;
            const newUrl = `${protocol}//kooraseru.com${pathname}${search}`;
            window.location.replace(newUrl);
        }
    }

    /**
     * Load translation JSON file
     * @param {string} language - Language code
     * @returns {Promise<Translation>} Translation object
     */
    async function loadTranslation(language: string): Promise<Translation> {
        try {
            const response = await fetch(`frontend/src/json/i18n/${language}.json`);
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
    function applyLanguageFont(language: string): void {
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
    function setHtmlLanguage(language: string): void {
        document.documentElement.lang = language;
    }

    /**
     * Initialize language system
     * @returns {Promise<Translation>} Translation object
     */
    async function init(): Promise<Translation> {
        try {
            validateSubdomain();
            const language = getLanguage();
            const translation = await loadTranslation(language);

            applyLanguageFont(language);
            setHtmlLanguage(language);

            // Store in module scope
            currentLanguage = language;
            translations = translation;

            // Also store in window for global access
            (window as any).currentLanguage = language;
            (window as any).translations = translation;

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
     * @returns {string} Translated value or fallback
     */
    function t(key: string, fallback: string = key): string {
        const trans = (window as any).translations || translations;
        if (!trans) return fallback;

        const parts = key.split('.');
        let value: any = trans;

        for (const part of parts) {
            if (typeof value === 'object' && value !== null && part in value) {
                value = value[part];
            } else {
                return fallback;
            }
        }

        return typeof value === 'string' ? value : fallback;
    }

    /**
     * Update page content with translations
     * @param {Translation} translation - Translation object (optional)
     */
    function updatePageContent(): void {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach((element: Element) => {
            const htmlElement = element as HTMLElement;
            const key = htmlElement.dataset.i18n;
            if (!key) return;

            const translatedText = t(key);

            if (htmlElement.tagName === 'IMG' || htmlElement.tagName === 'INPUT') {
                // For attributes
                const attr = htmlElement.dataset.i18nAttr || 'alt';
                htmlElement.setAttribute(attr, translatedText);
            } else {
                // For text content
                htmlElement.textContent = translatedText;
            }
        });
    }

    return {
        init,
        t,
        updatePageContent,
        getCurrentLanguage: () => currentLanguage || DEFAULT_LANGUAGE,
        getSubdomain: getCurrentSubdomain
    };
})();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => 
        LanguageSystem.init().then(() => LanguageSystem.updatePageContent())
    );
} else {
    LanguageSystem.init().then(() => LanguageSystem.updatePageContent());
}

// Expose to global scope for access from HTML scripts
(window as any).LanguageSystem = LanguageSystem;
