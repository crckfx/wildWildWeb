import { Ploder } from './Ploder.js';

const MAX_SIZE = 9999;

const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// controls
const bgColorInput = document.getElementById('bgColor');
const bgToggle = document.getElementById('bgToggle');
const renderWidth = document.getElementById('renderWidth');
const renderHeight = document.getElementById('renderHeight');
const toggle_fitToPage = document.getElementById('fitToggle');
const toggle_showOutline = document.getElementById('toggle_showOutline');
const previewBox = document.querySelector('.preview');

// keep track of loaded SVG as text
let currentSVGText = null;



// --- functions ---
function renderSVGToCanvas(svgText, opts = {}) {
    if (!svgText) return;
    currentSVGText = svgText; // keep around for re-renders

    const { w, h, showBackground, backgroundColor } = {
        w: parseInt(renderWidth.value, 10) || 512,
        h: parseInt(renderHeight.value, 10) || 512,
        showBackground: bgToggle.checked,
        backgroundColor: bgColorInput.value,
        ...opts
    };

    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
        if (w > MAX_SIZE || h > MAX_SIZE) return;
        canvas.width = w;
        canvas.height = h;

        // clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // background (optional)
        if (showBackground) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // draw svg scaled to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        URL.revokeObjectURL(url);
    };
    img.src = url;
}

async function handleSVGUpload(file) {
    if (!file || !file.type.match(/^image\/svg\+xml$/)) return;
    const svgText = await getSVGFromFile(file);
    resize_and_render(svgText);
}

async function resize_and_render(svgText) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    console.log('hi');

    img.onload = () => {
        // browser-provided intrinsic size
        renderWidth.value = img.naturalWidth;
        renderHeight.value = img.naturalHeight;

        // render with explicit size
        renderSVGToCanvas(svgText);
        URL.revokeObjectURL(url);
    };

    img.src = url;
}


// --- wire up controls ---
[bgColorInput, bgToggle, renderWidth, renderHeight].forEach(el => {
    el.addEventListener('input', () => {
        if (currentSVGText) renderSVGToCanvas(currentSVGText);
    });
});

toggle_fitToPage.addEventListener('input', () => {
    toggle_fitToPage.checked ? previewBox.classList.add('fit') : previewBox.classList.remove('fit');
})
toggle_showOutline.addEventListener('input', () => {
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline');
})

// --- run ---
new Ploder(document.getElementById('svgploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => {
        const file = files[0];
        handleSVGUpload(file);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    toggle_fitToPage.checked ? previewBox.classList.add('fit') : previewBox.classList.remove('fit');
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline');
    const defaultSVG = await getSVGFromURL('/resources/images/svg/snkbx_Boosh.svg');
    resize_and_render(defaultSVG);
});

// ----------------------------------------------------------------------------------------
// --- helper functions ---
function getSVGFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function getSVGFromURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
}
function inspectSVG(svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
    return {
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        viewBox: svg.getAttribute('viewBox'),
        preserveAspectRatio: svg.getAttribute('preserveAspectRatio')
    };
}