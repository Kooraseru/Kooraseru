const Skills = (() => {
    function t(key, fallback = key) {
        if (window.LanguageSystem && typeof window.LanguageSystem.t === 'function') {
            return window.LanguageSystem.t(key, fallback);
        }
        return fallback;
    }

    function getSkillGroups() {
        const groups = t('skills.groups', []);
        return Array.isArray(groups) ? groups : [];
    }

    /**
     * Renders all skill groups and animated progress bars into the skills grid container.
     */
    function renderSkills() {
        const container = document.getElementById('skillsGrid');
        if (!container) return;

        const groups = getSkillGroups();
        container.innerHTML = groups.map(group => {
            const items = Array.isArray(group.items) ? group.items : [];
            const itemsHtml = items.map(item => {
                return `
                    <div class="skill-row">
                        <div class="skill-row-header">
                            <span class="skill-name">${escapeHtml(item.name || '')}</span>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="skill-group">
                    <div class="skill-group-title">${escapeHtml(group.title || '')}</div>
                    <div class="skill-list">${itemsHtml}</div>
                </div>
            `;
        }).join('');

    }

    function animateSkillBars(root) {
        const bars = root.querySelectorAll('.skill-progress-fill');
        if (!bars.length) return;

        if (!('IntersectionObserver' in window)) {
            bars.forEach(bar => {
                bar.style.width = `${bar.dataset.level || 0}%`;
            });
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const level = entry.target.dataset.level || '0';
                requestAnimationFrame(() => {
                    entry.target.style.width = `${level}%`;
                });
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.35 });

        bars.forEach(bar => {
            bar.style.width = '0%';
            observer.observe(bar);
        });
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Initializes the skills section by rendering skill groups and registering
     * a listener to re-render on language changes.
     */
    function init() {
        renderSkills();
        
        // Refresh skills when language changes
        document.addEventListener('languageChanged', () => {
            renderSkills();
        });
    }

    return {
        init,
        render: renderSkills
    };
})();

window.Skills = Skills;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Skills.init());
} else {
    Skills.init();
}
