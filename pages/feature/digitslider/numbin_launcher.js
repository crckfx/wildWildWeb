import { Numbin } from '/numbin/Numbin.js';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input.numbin').forEach(input => {
        const min = parseInt(input.getAttribute('min'), 10) || 0;
        const max = parseInt(input.getAttribute('max'), 10) || 9999;
        const step = parseInt(input.getAttribute('step'), 10) || 1;

        new Numbin(input, { min, max, step });
    });
});