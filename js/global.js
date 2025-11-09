import { loadTheme } from "./theme.js";
import { Numbin } from "/misc/numbin/Numbin.js";

// ---------- Numbin setup ----------
function initNumbins() {
    const list = document.querySelectorAll(".numbin");
    if (!list.length) return; // nothing to do

    for (const div of list) {
        if (div.__numbinInstance) continue; // already done
        const nb = new Numbin(div, {
            min: +div.dataset.min || 0,
            max: +div.dataset.max || 9999,
            step: +div.dataset.step || 1,
            loop: div.dataset.loop === "true",
            draggable: !(div.dataset.draggable === "false"), // default to true
            typeable: !(div.dataset.typeable === "false"), // default to true
            scrollable: !(div.dataset.scrollable === "false"), // default to true
        });
        div.__numbinInstance = nb;
    }
}

import { beforeInput_range } from "/misc/numbin/numbinHandlers.js";

// ---------- Theme setup ----------
function initThemeNumbin() {
    const html = document.documentElement;
    const gen_h_numbin = document.querySelector("#genColorPicker .numbin");
    if (!gen_h_numbin) return;
    const gen_h_ni = gen_h_numbin.__numbinInstance;
    if (!gen_h_ni) return;

    // const numbinput = gen_h_numbin.querySelector("input");
    const numbinput = gen_h_ni.input;
    numbinput.addEventListener("input", () => {
        const val = numbinput.value;
        html.style.setProperty("--gen-h-1", val);
        localStorage.setItem("gen-h-1", val);
    });

    const storedValue = localStorage.getItem("gen-h-1");
    const cssVal = getComputedStyle(html).getPropertyValue("--gen-h-1").trim();
    const initValue = storedValue ?? cssVal ?? 0;

    numbinput.value = initValue;
    html.style.setProperty("--gen-h-1", initValue);

    // const gen_nb = gen_h_numbin.__numbinInstance;
    console.log("hi from", gen_h_ni);

    // gen_nb.handleBeforeInput = beforeInput_range;
    gen_h_ni.handleBeforeInput = e => beforeInput_range(e, gen_h_ni);

}

// ---------- Run immediately or on ready ----------
function onReady() {
    loadTheme();
    initNumbins();
    initThemeNumbin();
}

if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", onReady);
else
    onReady();
