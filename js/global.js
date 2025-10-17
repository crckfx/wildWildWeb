import { loadTheme } from "./theme.js";
import { Numbin } from '/misc/numbin/Numbin.js';

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();

    // init any numbins
    document.querySelectorAll('input.numbin').forEach(input => {
        const min = parseInt(input.getAttribute('min'), 10) || 0;
        const max = parseInt(input.getAttribute('max'), 10) || 9999;
        const step = parseInt(input.getAttribute('step'), 10) || 1;

        let loop = false;
        if (input.dataset.loop) loop = true;

        new Numbin(input, { min, max, step, loop });
    });

	const html = document.documentElement;
	const numbin = document.querySelector("#genColorPicker input.numbin");

    // set it up anyways whatever the theme
    if (numbin) {
		numbin.addEventListener("input", () => {
			const val = numbin.value; // we actually don't want to safeguard here; it's up to numbin
			html.style.setProperty("--gen-h-1", val); // replace this with theme interactivity later
		});
        // read computed value of --gen-h-1
        const h = getComputedStyle(html).getPropertyValue("--gen-h-1").trim();
        if (h) numbin.value = parseFloat(h);
    }
    
});