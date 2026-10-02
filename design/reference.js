const selector = document.getElementById('referenceTheme');
const requestedTheme = new URLSearchParams(location.search).get('theme');

if ([...selector.options].some(option => option.value === requestedTheme)) {
    document.documentElement.dataset.ksTheme = requestedTheme;
    selector.value = requestedTheme;
}

selector?.addEventListener('change', () => {
    document.documentElement.dataset.ksTheme = selector.value;
});
