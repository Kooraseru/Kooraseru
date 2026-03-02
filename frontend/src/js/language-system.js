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

            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language, translation }
            }));
            
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
    
    // ===========================
    // MARKDOWN PARSER
    // ===========================

    /**
     * Escape HTML special characters for safe embedding.
     * @param {string} str
     * @returns {string}
     */
    function escapeHtmlMd(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Parse inline Markdown syntax within a single line of text.
     * Supported:
     *   [text](url)    → <a> link
     *   `code`         → <code>
     *   ~~text~~       → <del> (strikethrough, standard)
     *   ~text~         → <del> (strikethrough, shorthand)
     *   **text**       → <strong> (bold)
     *   *text*         → <em> (italic)
     * @param {string} text
     * @returns {string} HTML string
     */
    function parseInlineMarkdown(text) {
        // Links [text](url) — only allow http(s) or root-relative URLs
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
            const safeUrl = /^https?:\/\//.test(url) || url.startsWith('/') ? url : '#';
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
        });

        // Protect inline code spans from further replacements
        const codeSpans = [];
        text = text.replace(/`([^`]+)`/g, (_, code) => {
            codeSpans.push(escapeHtmlMd(code));
            return `\x00CODE${codeSpans.length - 1}\x00`;
        });

        // Strikethrough ~~text~~ (standard) or ~text~ (shorthand)
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
        text = text.replace(/~([^~\s][^~]*)~/g, '<del>$1</del>');

        // Bold **text** (must come before italic)
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic *text*
        text = text.replace(/\*([^*\s][^*]*)\*/g, '<em>$1</em>');

        // Restore code spans
        text = text.replace(/\x00CODE(\d+)\x00/g, (_, i) => `<code>${codeSpans[+i]}</code>`);

        return text;
    }

    /**
     * Parse a Markdown string into an HTML string.
     * Block-level: lines starting with `* ` or `- ` become <ul><li> bullet lists.
     * Empty lines become <br> separators.
     * All other content is passed through parseInlineMarkdown.
     * @param {string} text
     * @returns {string} HTML string
     */
    function parseMarkdown(text) {
        if (!text || typeof text !== 'string') return text || '';

        const lines = text.split(/\r?\n/);
        const blocks = [];
        let listItems = [];

        function flushList() {
            if (listItems.length) {
                blocks.push('<ul class="md-list">' + listItems.join('') + '</ul>');
                listItems = [];
            }
        }

        for (const line of lines) {
            const trimmed = line.trim();
            if (/^[*-] /.test(trimmed)) {
                listItems.push('<li>' + parseInlineMarkdown(trimmed.slice(2)) + '</li>');
            } else {
                flushList();
                if (trimmed === '') {
                    blocks.push('<br>');
                } else {
                    blocks.push(parseInlineMarkdown(line));
                }
            }
        }
        flushList();

        return blocks.join('');
    }

    /**
     * Update page content with translations.
     * Elements with data-no-translate are skipped entirely.
     * Elements with data-native-font keep their pinned font family via CSS.
     * Translation values support Markdown syntax (see parseMarkdown).
     */
    function updatePageContent(translation) {
        // Update elements with data-i18n attribute, skipping no-translate elements
        document.querySelectorAll('[data-i18n]').forEach(element => {
            // Skip elements explicitly tagged as no-translate
            if (element.hasAttribute('data-no-translate')) return;

            const key = element.dataset.i18n;
            const translatedText = t(key);

            if (element.dataset.i18nAttr) {
                const attr = element.dataset.i18nAttr;
                element.setAttribute(attr, String(translatedText));
            } else {
                element.innerHTML = parseMarkdown(String(translatedText));
            }
        });
    }
    
    /**
     * Switch to a different language
     * @param {string} newLanguage - Language code to switch to
     * @returns {Promise<boolean>} Success status
     */
    async function switchLanguage(newLanguage) {
        if (!SUPPORTED_LANGUAGES[newLanguage]) {
            console.error(`Unsupported language: ${newLanguage}`);
            return false;
        }
        
        try {
            console.log(`[LanguageSystem] Switching to ${newLanguage}`);
            const translation = await loadTranslation(newLanguage);
            
            applyLanguageFont(newLanguage);
            setHtmlLanguage(newLanguage);
            
            // Update stored values
            window.currentLanguage = newLanguage;
            window.translations = translation;
            
            // Update all page content
            updatePageContent();

            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: newLanguage, translation }
            }));
            
            console.log(`[LanguageSystem] Successfully switched to ${newLanguage}`);
            return true;
        } catch (error) {
            console.error(`Failed to switch language to ${newLanguage}:`, error);
            return false;
        }
    }
    
    return {
        init,
        t,
        updatePageContent,
        switchLanguage,
        parseMarkdown,
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

// Expose to global scope for access from HTML scripts
window.LanguageSystem = LanguageSystem;

// Expose Markdown parser globally so non-module scripts (e.g. projects.js) can use it
window.parseMarkdown = LanguageSystem.parseMarkdown;