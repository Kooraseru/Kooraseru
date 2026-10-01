/**
 * Language Detection and Routing System
 * Detects subdomain and loads appropriate language configuration
 */

import { parse as parseToml } from 'https://cdn.jsdelivr.net/npm/smol-toml@1.9.0/dist/index.js';

const LanguageSystem = (() => {
    const COOKIE_NAME = 'site_language';
    const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
    const translationCache = new Map();
    let manifest;
    let catalogPromise;

    async function fetchToml(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`${path} returned ${response.status}`);
        return parseToml(await response.text());
    }
    
    function getLanguage() {
        const entry = document.cookie.split('; ').find(part => part.startsWith(`${COOKIE_NAME}=`));
        if (!entry) return manifest.default;
        let value;
        try { value = decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)); }
        catch { return manifest.default; }
        return manifest.locales.some(locale => locale.key === value) ? value : manifest.default;
    }

    function saveLanguage(language) {
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
    
    /**
     * Load translation JSON file
     * @param {string} language - Language code
     * @returns {Promise<Object>} Translation object
     */
    async function loadTranslation(locale) {
        if (translationCache.has(locale.key)) return translationCache.get(locale.key);
        if (!catalogPromise) catalogPromise = Promise.all([
            fetchToml('/i18n/site.toml'), fetchToml('/i18n/skills.toml')
        ]).catch(error => { catalogPromise = null; throw error; });
        const [catalog, skills] = await catalogPromise;
        const document = { language: locale.htmlLang, languageName: locale.language, direction: locale.direction || 'ltr' };
        function visit(node, target) {
            for (const [key, value] of Object.entries(node)) {
                if (value.values) target[key] = value.values[locale.key] ?? value.values[manifest.default];
                else { target[key] = {}; visit(value, target[key]); }
            }
        }
        visit(catalog, document);
        document.skills ||= {};
        document.skills.groups = skills.groups.map(group => ({
            title: group.titleKey.split('.').reduce((node, key) => node?.[key], document),
            items: group.items.map(name => ({ name }))
        }));
        translationCache.set(locale.key, document);
        return document;
    }
    
    /**
     * Apply font based on language
     * @param {string} language - Language code
     */
    function applyLanguageFont(locale) {
        document.documentElement.style.setProperty('--font-family-lang', locale.fontFamily);
        document.body.style.fontFamily = locale.fontFamily;
    }
    
    /**
     * Set HTML lang attribute
     * @param {string} language - Language code
     */
    function setHtmlLanguage(locale) {
        document.documentElement.lang = locale.htmlLang;
        document.documentElement.dir = locale.direction || 'ltr';
    }
    
    /**
     * Initialize language system
     * @returns {Promise<Object>} Translation object
     */
    let requestVersion = 0;
    let initPromise;

    async function loadManifest() {
        const data = await fetchToml('/i18n/locales.toml');
        if (!Array.isArray(data.locales) || !data.locales.some(locale => locale.key === data.default)) {
            throw new Error('Invalid locale manifest');
        }
        manifest = data;
        const options = document.querySelector('#languageDropdown .dropdown-content');
        if (options) {
            options.replaceChildren(...data.locales.map(locale => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'dropdown-option language-option';
                button.dataset.lang = locale.key;
                button.lang = locale.htmlLang;
                button.textContent = locale.language;
                return button;
            }));
        }
    }

    async function applyLanguage(language) {
        const version = ++requestVersion;
        let locale = manifest.locales.find(item => item.key === language)
            || manifest.locales.find(item => item.key === manifest.default);
        let translation;
        try { translation = await loadTranslation(locale); }
        catch (error) {
            console.error(`Failed to load translation for ${locale.key}:`, error);
            if (locale.key === manifest.default) return false;
            locale = manifest.locales.find(item => item.key === manifest.default);
            try { translation = await loadTranslation(locale); }
            catch (fallbackError) {
                console.error('Failed to load default translation:', fallbackError);
                return false;
            }
        }
        if (version !== requestVersion) return false;

        applyLanguageFont(locale);
        setHtmlLanguage(locale);
        window.currentLanguage = locale.key;
        window.translations = translation;
        updatePageContent(translation);
        const current = document.getElementById('languageCurrent');
        if (current) current.textContent = locale.language;
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.toggle('active', option.dataset.lang === locale.key);
        });
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: locale.key, translation }
        }));
        return true;
    }

    function init() {
        if (!initPromise) initPromise = loadManifest().then(() => applyLanguage(getLanguage())).catch(error => {
            console.error('Failed to initialize languages:', error);
            initPromise = null;
            return false;
        });
        return initPromise;
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
    
    // Markdown parser utilities

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
     *   [text](url)    â†’ <a> link
     *   `code`         â†’ <code>
     *   ~~text~~       â†’ <del> (strikethrough, standard)
     *   ~text~         â†’ <del> (strikethrough, shorthand)
     *   **text**       â†’ <strong> (bold)
     *   *text*         â†’ <em> (italic)
     * @param {string} text
     * @returns {string} HTML string
     */
    function parseInlineMarkdown(text) {
        // Links [text](url) â€” only allow http(s) or root-relative URLs
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
        await init();
        if (!manifest || !manifest.locales.some(locale => locale.key === newLanguage)) {
            console.error(`Unsupported language: ${newLanguage}`);
            return false;
        }
        
        const changed = await applyLanguage(newLanguage);
        if (changed) saveLanguage(newLanguage);
        return changed;
    }
    
    return {
        init,
        t,
        updatePageContent,
        switchLanguage,
        parseMarkdown,
        getCurrentLanguage: () => window.currentLanguage || manifest?.default || null
    };
})();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LanguageSystem.init());
} else {
    LanguageSystem.init();
}

// Expose to global scope for access from HTML scripts
window.LanguageSystem = LanguageSystem;

// Expose Markdown parser globally so non-module scripts (e.g. projects.js) can use it
window.parseMarkdown = LanguageSystem.parseMarkdown;
