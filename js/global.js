import { loadTheme } from "./theme.js";
import { Numbin } from '/misc/numbin/Numbin.js';

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();

    // init any numbins
    document.querySelectorAll('.numbin').forEach(div => {
        new Numbin(div, {
            min: +div.dataset.min || 0,
            max: +div.dataset.max || 9999,
            step: +div.dataset.step || 1,
            loop: div.dataset.loop === 'true'
        });
    });

    const html = document.documentElement;
    const gen_h_numbin = document.querySelector("#genColorPicker .numbin");

    // set it up anyways whatever the theme
    if (gen_h_numbin) {
        const numbinput = gen_h_numbin.querySelector('input');
        numbinput.addEventListener("input", () => {
            const val = numbinput.value; // we actually don't want to safeguard here; it's up to numbin
            html.style.setProperty("--gen-h-1", val); // replace this with theme interactivity later
        });
        // read computed value of --gen-h-1
        const h = getComputedStyle(html).getPropertyValue("--gen-h-1").trim();
        if (h) numbinput.value = parseFloat(h);
    }

});