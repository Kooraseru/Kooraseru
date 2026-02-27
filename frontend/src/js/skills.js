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

    function renderSkills() {
        const container = document.getElementById('skillsGrid');
        if (!container) return;

        const groups = getSkillGroups();
        container.innerHTML = groups.map(group => {
            const items = Array.isArray(group.items) ? group.items : [];
            const itemsHtml = items.map(item => {
                const level = Number(item.level) || 0;
                const safeLevel = Math.max(0, Math.min(100, level));
                return `
                    <div class="skill-row">
                        <div class="skill-row-header">
                            <span class="skill-name">${escapeHtml(item.name || '')}</span>
                            <span class="skill-level">${safeLevel}%</span>
                        </div>
                        <div class="skill-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safeLevel}" aria-label="${escapeHtml(item.name || '')}">
                            <span class="skill-progress-fill" data-level="${safeLevel}"></span>
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

        animateSkillBars(container);
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

    function init() {
        renderSkills();
        document.addEventListener('languageChanged', renderSkills);
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
