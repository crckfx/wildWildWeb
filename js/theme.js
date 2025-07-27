function getPreferredTheme() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
    const theme = (mode === 'auto') ? getPreferredTheme() : mode;
    document.body.setAttribute('data-theme', theme);
}

export function loadTheme() {
    const select = document.querySelector('.color-picker select');
    if (!select) return;

    // Apply initial selection
    applyTheme(select.value);

    // Listen for user changes
    select.addEventListener('change', () => {
        applyTheme(select.value);
    });
}
