export const validThemes = ['light', 'dark', 'system', 'gen'];
const select = document.querySelector('.color-picker select');

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(choice) {
    return choice === 'system' ? getSystemTheme() : choice;
}

function applyTheme(choice) {
    // apply the theme
    document.documentElement.dataset.theme = resolveTheme(choice);
    // save the choice
    localStorage.setItem('theme', choice);
    // update the UI
    if (select) select.value = choice;

}

export function loadTheme() {
    if (!select) return;

    // load theme from storage 
    let saved = localStorage.getItem('theme');
    // if it's not valid, use 'system'
    if (!validThemes.includes(saved)) saved = 'system';

    applyTheme(saved);

    // Listen for user changes
    select.addEventListener('change', () => applyTheme(select.value));
}
