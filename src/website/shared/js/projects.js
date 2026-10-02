const Projects = (() => {
    const state = {
        projects: [],
        sortOrder: 'newest',
        searchQuery: '',
        scrollTargets: [0],
        currentIndex: 0,
        modalOpen: false,
        activeProjectId: null,
        isLoaded: false
    };

    function t(key, fallback = key) {
        if (window.LanguageSystem && typeof window.LanguageSystem.t === 'function') {
            return window.LanguageSystem.t(key, fallback);
        }
        return fallback;
    }

    function getCurrentLocale() {
        return window.LanguageSystem?.getCurrentLanguage?.() || document.documentElement.lang;
    }

    async function loadProjects() {
        try {
            if (!state.catalog) {
                const { parse } = await import('https://cdn.jsdelivr.net/npm/smol-toml@1.9.0/dist/index.js');
                const files = document.querySelector('meta[name="project-files"]')?.content.split(',').filter(Boolean) || [];
                state.catalog = await Promise.all(files.map(async filename => {
                    const response = await fetch(`/projects/${encodeURIComponent(filename)}`);
                    if (!response.ok) throw new Error(`${filename} returned ${response.status}`);
                    return parse(await response.text());
                }));
            }
            const language = window.LanguageSystem?.getCurrentLanguage?.();
            state.projects = state.catalog.map(project => ({
                ...project,
                ...(project.translations?.[language] || {}),
                url: project.link,
                status: project.status === 'released' ? 'completed' : 'active'
            }));
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
        const query = state.searchQuery.trim().toLocaleLowerCase();
        const list = state.projects.filter(project => !query || [
            project.title, project.description, project.details, ...(project.tags || [])
        ].some(value => String(value || '').toLocaleLowerCase().includes(query)));
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
        if (!dateStr) return isActive ? t('common.present', 'Present') : 'â€”';
        const [year, month] = dateStr.split('-');
        if (!month) return year;
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return new Intl.DateTimeFormat(getCurrentLocale(), { year: 'numeric', month: 'short' }).format(date);
    }

    function getProjectImages(project) {
        return Array.isArray(project.images) && project.images.length
            ? project.images.filter(Boolean)
            : (project.image ? [project.image] : []);
    }

    function renderImages(project, modal = false) {
        const images = getProjectImages(project);
        if (!images.length) return '';
        const wrapper = modal ? 'project-modal-image-carousel' : 'project-card-image';
        const imageClass = modal ? 'project-modal-image' : '';
        const slides = images.map((src, index) =>
            `<img class="${imageClass}" src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} ${index + 1}" loading="lazy" ${index ? 'hidden' : ''} />`
        ).join('');
        const controls = images.length > 1 ? `
            <button class="project-image-nav project-image-nav--prev" type="button" aria-label="${escapeHtml(t('portfolio.previousImage', 'Previous image'))}">‹</button>
            <button class="project-image-nav project-image-nav--next" type="button" aria-label="${escapeHtml(t('portfolio.nextImage', 'Next image'))}">›</button>
            <span class="project-image-count">1 / ${images.length}</span>` : '';
        return `<div class="${wrapper} project-image-carousel" data-image-index="0">${slides}${controls}</div>`;
    }

    function bindImageCarousels(root) {
        root.querySelectorAll('.project-image-carousel').forEach(carousel => {
            carousel.querySelectorAll('.project-image-nav').forEach(button => {
                button.addEventListener('click', event => {
                    event.stopPropagation();
                    const slides = [...carousel.querySelectorAll('img')];
                    const direction = button.classList.contains('project-image-nav--next') ? 1 : -1;
                    const index = (Number(carousel.dataset.imageIndex) + direction + slides.length) % slides.length;
                    slides.forEach((slide, i) => { slide.hidden = i !== index; });
                    carousel.dataset.imageIndex = index;
                    carousel.querySelector('.project-image-count').textContent = `${index + 1} / ${slides.length}`;
                });
            });
        });
    }

    function renderCard(project) {
        const startFormatted = formatDate(project.startDate, false);
        const endFormatted = project.endDate ? formatDate(project.endDate, false) : t('common.present', 'Present');
        const dateHtml = project.startDate ? `<span class="project-date">${startFormatted} &ndash; ${endFormatted}</span>` : '';
        const statusClass = `project-status--${project.status || 'completed'}`;
        const statusLabel = project.status === 'active'
            ? t('portfolio.status.active', 'Active')
            : t('portfolio.status.completed', 'Completed');

        const tagsHtml = (project.tags || []).map(tag =>
            `<span class="project-tag">${escapeHtml(tag)}</span>`
        ).join('');

        const imageHtml = renderImages(project);

        return `
            <div class="project-card ks-card${imageHtml ? '' : ' project-card--text-only'}" data-project-id="${escapeHtml(project.id)}" role="button" tabindex="0" aria-label="${escapeHtml(project.title)}">
                ${imageHtml}
                <div class="project-card-body">
                    <div class="project-card-header">
                        <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
                        <span class="project-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <p class="project-card-description">${renderMarkdown(project.description)}</p>
                    <div class="project-card-footer">
                        ${dateHtml}
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
            container.innerHTML = `<p class="projects-empty">${escapeHtml(t(state.searchQuery ? 'portfolio.noResults' : 'portfolio.empty', state.searchQuery ? 'No matching projects.' : 'No projects yet.'))}</p>`;
            if (dots) dots.innerHTML = '';
            state.scrollTargets = [0];
            state.currentIndex = 0;
            updateActiveDot();
            return;
        }

        container.innerHTML = sorted.map(renderCard).join('');
        container.scrollLeft = 0;
        bindImageCarousels(container);

        // Graceful image fallback
        hookImageErrors(container);

        updateScrollTargets();

        // Attach card click listeners
        container.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.project-image-nav')) return;
                openModal(card.dataset.projectId);
            });
            card.addEventListener('keydown', e => {
                if (e.target !== card) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(card.dataset.projectId);
                }
            });
        });

    }

    function scrollToCard(index) {
        const container = document.getElementById('projectsCarousel');
        if (!container) return;
        if (state.scrollTargets[index] !== undefined) {
            container.scrollTo({ left: state.scrollTargets[index], behavior: 'smooth' });
            state.currentIndex = index;
            updateActiveDot();
        }
    }

    function updateScrollTargets() {
        const container = document.getElementById('projectsCarousel');
        const dots = document.getElementById('carouselDots');
        if (!container) return;
        const cards = [...container.querySelectorAll('.project-card')];
        const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
        const firstLeft = cards[0]?.offsetLeft || 0;
        state.scrollTargets = [...new Set(cards.map(card =>
            Math.min(maxScroll, card.offsetLeft - firstLeft)
        ))];
        if (!state.scrollTargets.length) state.scrollTargets = [0];
        if (state.scrollTargets.at(-1) !== maxScroll) state.scrollTargets.push(maxScroll);
        const dotPrefix = escapeHtml(t('portfolio.projectLabel', 'Project'));
        if (dots) {
            dots.innerHTML = state.scrollTargets.map((_, i) =>
                `<button class="carousel-dot" data-index="${i}" aria-label="${dotPrefix} ${i + 1}"></button>`
            ).join('');
            dots.querySelectorAll('.carousel-dot').forEach(dot =>
                dot.addEventListener('click', () => scrollToCard(Number(dot.dataset.index)))
            );
        }
        syncScrollPosition();
    }

    function syncScrollPosition() {
        const container = document.getElementById('projectsCarousel');
        if (!container) return;
        state.currentIndex = state.scrollTargets.reduce((best, target, index) =>
            Math.abs(target - container.scrollLeft) < Math.abs(state.scrollTargets[best] - container.scrollLeft)
                ? index : best, 0);
        updateActiveDot();
    }

    function updateActiveDot() {
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === state.currentIndex);
        });
        const prev = document.getElementById('carouselPrev');
        const next = document.getElementById('carouselNext');
        if (prev) prev.disabled = state.currentIndex === 0;
        if (next) next.disabled = state.currentIndex >= state.scrollTargets.length - 1;
    }

    function bindScrollSync() {
        const container = document.getElementById('projectsCarousel');
        if (!container) return;
        let scrollTimer;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                syncScrollPosition();
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

        const imageHtml = renderImages(project, true);

        const urlHtml = project.url
            ? `<a class="project-modal-link" href="${escapeHtml(project.url)}" rel="noopener noreferrer">${escapeHtml(t('portfolio.viewProject', 'View Project â†’'))}</a>`
            : '';

        modalContent.innerHTML = `
            ${imageHtml}
            <div class="project-modal-body">
                <div class="project-modal-header">
                    <h2 class="project-modal-title">${escapeHtml(project.title)}</h2>
                    <span class="project-status ${statusClass}">${statusLabel}</span>
                </div>
                ${project.startDate ? `<span class="project-modal-dates">${startFormatted} &ndash; ${endFormatted}</span>` : ''}
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
        bindImageCarousels(modalContent);
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
        const sortToggle = document.getElementById('sortToggle');
        const sortCurrent = document.getElementById('sortCurrent');
        const sortDropdown = document.getElementById('sortDropdown');
        const sortOptions = document.querySelectorAll('.sort-option');
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
            sortDropdown.style.top = (rect.bottom + 4) + 'px';
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
                const newIndex = Math.max(0, state.currentIndex - 1);
                scrollToCard(newIndex);
            });
        }

        if (next) {
            next.addEventListener('click', () => {
                const newIndex = Math.min(state.scrollTargets.length - 1, state.currentIndex + 1);
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
        const carousel = img.closest('.project-image-carousel');
        if (carousel) {
            const slides = [...carousel.querySelectorAll('img')];
            img.remove();
            const remaining = slides.length - 1;
            if (!remaining) {
                carousel.remove();
                return;
            }
            const index = Math.min(Number(carousel.dataset.imageIndex), remaining - 1);
            carousel.dataset.imageIndex = index;
            carousel.querySelectorAll('img').forEach((slide, i) => { slide.hidden = i !== index; });
            const count = carousel.querySelector('.project-image-count');
            if (count) count.textContent = `${index + 1} / ${remaining}`;
            if (remaining === 1) carousel.querySelectorAll('.project-image-nav, .project-image-count').forEach(el => el.remove());
            return;
        }
        const cardWrap = img.closest('.project-card-image');
        if (cardWrap) {
            cardWrap.remove();
            return;
        }
        const modalWrap = img.closest('.project-modal-image-link') || img;
        modalWrap.remove();
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
        const search = document.getElementById('projectSearch');
        if (search) search.setAttribute('aria-label', t('portfolio.search', 'Search projects'));
        renderCarousel();
        syncSortCurrentLabel();
        if (state.modalOpen && state.activeProjectId) {
            openModal(state.activeProjectId);
        }
    }

    /**
     * Loads projects from the current language translation, renders the carousel,
     * and binds all sort, navigation, and modal event handlers.
     *
     * @returns {Promise<void>}
     */
    async function init() {
        document.addEventListener('languageChanged', () => refreshFromLanguage());
        await loadProjects();
        renderCarousel();
        bindSortControl();
        bindCarouselNav();
        bindScrollSync();
        window.addEventListener('resize', updateScrollTargets);
        document.getElementById('projectSearch')?.addEventListener('input', event => {
            state.searchQuery = event.target.value;
            renderCarousel();
        });
        bindModalEvents();
        
    }

    return {
        init,
        refresh: refreshFromLanguage
    }
})();

window.Projects = Projects;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Projects.init());
} else {
    Projects.init();
};
