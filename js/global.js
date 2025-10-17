import { loadTheme } from "./theme.js";
import { Numbin } from '/misc/numbin/Numbin.js';

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();

	const html = document.documentElement;
	const numbin = document.querySelector("#genColorPicker input.numbin");

    // set it up anyways whatever the theme
    if (numbin) {
        const min = 0;
        const max = 359;
        const step = 1;

        new Numbin(numbin, { min, max, step, loop: true });
		numbin.addEventListener("input", () => {
			const val = numbin.value; // we actually don't want to safeguard here; it's up to numbin
			html.style.setProperty("--gen-h-1", val); // replace this with theme interactivity later
		});
    }


    
	// only act if current theme is gen
	if (html.dataset.theme === "gen" && numbin) {
        
		// read computed value of --gen-h-1
		const h = getComputedStyle(html).getPropertyValue("--gen-h-1").trim();
		if (h) numbin.value = parseFloat(h);
	}    
});