const Projects = (() => {
    const state = {
        projects: [],
        sortOrder: 'newest',
        currentIndex: 0,
        modalOpen: false,
        activeProjectId: null,
        isLoaded: false
    };

    const LANG_TO_LOCALE = {
        en: 'en-US',
        ja: 'ja-JP'
    };

    function t(key, fallback = key) {
        if (window.LanguageSystem && typeof window.LanguageSystem.t === 'function') {
            return window.LanguageSystem.t(key, fallback);
        }
        return fallback;
    }

    function getCurrentLocale() {
        const lang = window.LanguageSystem && typeof window.LanguageSystem.getCurrentLanguage === 'function'
            ? window.LanguageSystem.getCurrentLanguage()
            : 'en';
        return LANG_TO_LOCALE[lang] || 'en-US';
    }

    async function loadProjects() {
        try {
            const localized = t('portfolio.projects', []);
            state.projects = Array.isArray(localized) ? localized : [];
            state.isLoaded = true;
            console.log('[Projects] Loaded', state.projects.length, 'projects');
            return state.projects;
        } catch (err) {
            console.error('[Projects] Failed to load:', err);
            state.projects = [];
            return [];
        }
    }

    function getSortedProjects() {
        const list = [...state.projects];
        switch (state.sortOrder) {
            case 'newest':
                return list.sort((a, b) => {
                    const aDate = parseDate(a.startDate);
                    const bDate = parseDate(b.startDate);
                    return bDate - aDate;
                });
            case 'oldest':
                return list.sort((a, b) => {
                    const aDate = parseDate(a.startDate);
                    const bDate = parseDate(b.startDate);
                    return aDate - bDate;
                });
            case 'active':
                return list.sort((a, b) => {
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (b.status === 'active' && a.status !== 'active') return 1;
                    return parseDate(b.startDate) - parseDate(a.startDate);
                });
            default:
                return list;
        }
    }

    function parseDate(dateStr) {
        if (!dateStr) return 0;
        const [year, month] = dateStr.split('-').map(Number);
        return year * 12 + (month || 1);
    }

    function formatDate(dateStr, isActive) {
        if (!dateStr) return isActive ? t('common.present', 'Present') : '—';
        const [year, month] = dateStr.split('-');
        if (!month) return year;
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return new Intl.DateTimeFormat(getCurrentLocale(), { year: 'numeric', month: 'short' }).format(date);
    }

    function renderCard(project) {
        const startFormatted = formatDate(project.startDate, false);
        const endFormatted = project.endDate ? formatDate(project.endDate, false) : t('common.present', 'Present');
        const statusClass = `project-status--${project.status || 'completed'}`;
        const statusLabel = project.status === 'active'
            ? t('portfolio.status.active', 'Active')
            : t('portfolio.status.completed', 'Completed');

        const tagsHtml = (project.tags || []).map(tag =>
            `<span class="project-tag">${escapeHtml(tag)}</span>`
        ).join('');

        const imgLink = project.imageLink || project.url || null;
        const imageHtml = project.image
            ? `<div class="project-card-image">${
                imgLink
                    ? `<a class="project-card-image-link" href="${escapeHtml(imgLink)}" target="_blank" rel="noopener noreferrer" tabindex="-1"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy" /></a>`
                    : `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy" />`
              }</div>`
            : `<div class="project-card-image project-card-image--placeholder"><span class="project-card-image-icon">&#9638;</span></div>`;

        return `
            <div class="project-card" data-project-id="${escapeHtml(project.id)}" role="button" tabindex="0" aria-label="${escapeHtml(project.title)}">
                ${imageHtml}
                <div class="project-card-body">
                    <div class="project-card-header">
                        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
                        <span class="project-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <p class="project-card-description">${renderMarkdown(project.description)}</p>
                    <div class="project-card-footer">
                        <span class="project-date">${startFormatted} &ndash; ${endFormatted}</span>
                        <div class="project-tags">${tagsHtml}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCarousel() {
        const container = document.getElementById('projectsCarousel');
        const dots = document.getElementById('carouselDots');
        if (!container) return;

        const sorted = getSortedProjects();
        if (sorted.length === 0) {
            container.innerHTML = `<p class="projects-empty">${escapeHtml(t('portfolio.empty', 'No projects yet.'))}</p>`;
            return;
        }

        container.innerHTML = sorted.map(renderCard).join('');

        // Graceful image fallback
        hookImageErrors(container);

        // Rebuild dots
        if (dots) {
            const dotPrefix = escapeHtml(t('portfolio.projectLabel', 'Project'));
            dots.innerHTML = sorted.map((_, i) =>
                `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="${dotPrefix} ${i + 1}"></button>`
            ).join('');
            dots.querySelectorAll('.carousel-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    scrollToCard(parseInt(dot.dataset.index));
                });
            });
        }

        // Attach card click listeners
        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open modal if the click was on the image link
                if (e.target.closest('.project-card-image-link')) return;
                openModal(card.dataset.projectId);
            });
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(card.dataset.projectId);
                }
            });
        });

        // Reset scroll
        state.currentIndex = 0;
        updateActiveDot();
        bindScrollSync();
    }

    function scrollToCard(index) {
        const container = document.getElementById('projectsCarousel');
        if (!container) return;
        const cards = container.querySelectorAll('.project-card');
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            state.currentIndex = index;
            updateActiveDot();
        }
    }

    function updateActiveDot() {
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === state.currentIndex);
        });
    }

    function bindScrollSync() {
        const container = document.getElementById('projectsCarousel');
        if (!container) return;
        let scrollTimer;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const cards = container.querySelectorAll('.project-card');
                const containerLeft = container.getBoundingClientRect().left;
                let closestIndex = 0;
                let closestDist = Infinity;
                cards.forEach((card, i) => {
                    const dist = Math.abs(card.getBoundingClientRect().left - containerLeft);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestIndex = i;
                    }
                });
                state.currentIndex = closestIndex;
                updateActiveDot();
            }, 80);
        }, { passive: true });
    }

    function openModal(projectId) {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;

        const modal = document.getElementById('projectModal');
        const modalContent = document.getElementById('projectModalContent');
        if (!modal || !modalContent) return;

        const startFormatted = formatDate(project.startDate, false);
        const endFormatted = project.endDate ? formatDate(project.endDate, false) : t('common.present', 'Present');
        const statusClass = `project-status--${project.status || 'completed'}`;
        const statusLabel = project.status === 'active'
            ? t('portfolio.status.active', 'Active')
            : t('portfolio.status.completed', 'Completed');
        const tagsHtml = (project.tags || []).map(tag =>
            `<span class="project-tag">${escapeHtml(tag)}</span>`
        ).join('');

        const imgLink = project.imageLink || project.url || null;
        const imageHtml = project.image
            ? (imgLink
                ? `<a class="project-modal-image-link" href="${escapeHtml(imgLink)}" target="_blank" rel="noopener noreferrer"><img class="project-modal-image" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" /></a>`
                : `<img class="project-modal-image" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" />`)
            : `<div class="project-modal-image project-modal-image--placeholder"><span>&#9638;</span></div>`;

        const urlHtml = project.url
            ? `<a class="project-modal-link" href="${escapeHtml(project.url)}" rel="noopener noreferrer">${escapeHtml(t('portfolio.viewProject', 'View Project →'))}</a>`
            : '';

        modalContent.innerHTML = `
            ${imageHtml}
            <div class="project-modal-body">
                <div class="project-modal-header">
                    <h2 class="project-modal-title">${escapeHtml(project.title)}</h2>
                    <span class="project-status ${statusClass}">${statusLabel}</span>
                </div>
                <span class="project-modal-dates">${startFormatted} &ndash; ${endFormatted}</span>
                <p class="project-modal-details">${renderMarkdown(project.details || project.description)}</p>
                <div class="project-tags">${tagsHtml}</div>
                ${urlHtml}
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        state.modalOpen = true;
        state.activeProjectId = projectId;

        // Graceful image fallback
        hookImageErrors(modalContent);

        modal.querySelector('.project-modal-close')?.focus();
    }

    function closeModal() {
        const modal = document.getElementById('projectModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        state.modalOpen = false;
        state.activeProjectId = null;
    }

    function syncSortCurrentLabel() {
        const sortCurrent = document.getElementById('sortCurrent');
        const activeOption = document.querySelector(`.sort-option[data-sort="${state.sortOrder}"]`);
        if (sortCurrent && activeOption) {
            sortCurrent.textContent = activeOption.textContent;
            sortCurrent.dataset.i18n = activeOption.dataset.i18n;
        }
    }

    function bindSortControl() {
        const sortToggle   = document.getElementById('sortToggle');
        const sortCurrent  = document.getElementById('sortCurrent');
        const sortDropdown = document.getElementById('sortDropdown');
        const sortOptions  = document.querySelectorAll('.sort-option');
        if (!sortToggle || !sortDropdown) return;

        // Sync active highlight to current sort order
        function updateActiveOption() {
            sortOptions.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.sort === state.sortOrder);
            });
        }

        sortToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = sortToggle.getBoundingClientRect();
            sortDropdown.style.top  = (rect.bottom + 4) + 'px';
            sortDropdown.style.left = rect.left + 'px';
            sortDropdown.classList.toggle('active');
            updateActiveOption();
        });

        sortOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                state.sortOrder = opt.dataset.sort;
                syncSortCurrentLabel();
                sortDropdown.classList.remove('active');
                renderCarousel();
                updateActiveOption();
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sort-selector')) {
                sortDropdown.classList.remove('active');
            }
        });

        updateActiveOption();
        syncSortCurrentLabel();
    }

    function bindCarouselNav() {
        const prev = document.getElementById('carouselPrev');
        const next = document.getElementById('carouselNext');

        if (prev) {
            prev.addEventListener('click', () => {
                const sorted = getSortedProjects();
                const newIndex = Math.max(0, state.currentIndex - 1);
                scrollToCard(newIndex);
            });
        }

        if (next) {
            next.addEventListener('click', () => {
                const sorted = getSortedProjects();
                const newIndex = Math.min(sorted.length - 1, state.currentIndex + 1);
                scrollToCard(newIndex);
            });
        }
    }

    function bindModalEvents() {
        const modal = document.getElementById('projectModal');
        const closeBtn = document.getElementById('projectModalClose');
        if (!modal) return;

        closeBtn?.addEventListener('click', closeModal);

        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && state.modalOpen) closeModal();
        });
    }

    function hookImageErrors(root) {
        root.querySelectorAll('img').forEach(img => {
            if (img.complete && img.naturalWidth === 0) handleImgError(img);
            img.addEventListener('error', () => handleImgError(img), { once: true });
        });
    }

    function handleImgError(img) {
        const cardWrap = img.closest('.project-card-image');
        if (cardWrap) {
            cardWrap.innerHTML = '<span class="project-card-image-icon">&#9638;</span>';
            cardWrap.classList.add('project-card-image--placeholder');
            return;
        }
        const modalWrap = img.closest('.project-modal-image-link') || img;
        const placeholder = document.createElement('div');
        placeholder.className = 'project-modal-image project-modal-image--placeholder';
        placeholder.innerHTML = '<span>&#9638;</span>';
        modalWrap.replaceWith(placeholder);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderMarkdown(str) {
        if (typeof window.parseMarkdown === 'function') return window.parseMarkdown(str || '');
        return escapeHtml(str);
    }

    async function refreshFromLanguage() {
        await loadProjects();
        renderCarousel();
        syncSortCurrentLabel();
        if (state.modalOpen && state.activeProjectId) {
            openModal(state.activeProjectId);
        }
    }

    async function init() {
        await loadProjects();
        renderCarousel();
        bindSortControl();
        bindCarouselNav();
        bindModalEvents();
        document.addEventListener('languageChanged', refreshFromLanguage);
        console.log('[Projects] Initialized');
    }

    return {
        init,
        refresh: renderCarousel
    };
})();

window.Projects = Projects;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Projects.init());
} else {
    Projects.init();
}
