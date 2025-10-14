import { validThemes } from '/js/theme.js';

const wrap = document.querySelector('.two-column');
const basis = document.querySelector('#basis');

for (const theme of validThemes) {
    if (theme === 'system') continue;

    const clone = basis.cloneNode(true);
    clone.id = '';
    clone.classList.add('element');
    clone.dataset.theme = theme;
    clone.querySelector('.theme-name').textContent = theme.toUpperCase() + ' THEME';

    wrap.appendChild(clone);
}