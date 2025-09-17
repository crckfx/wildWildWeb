import { Ploder } from './Ploder.js';

const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// controls
const bgColorInput = document.getElementById('bgColor');
const bgToggle     = document.getElementById('bgToggle');
const renderSize   = document.getElementById('renderSize');
const realSize     = document.getElementById('realSize');
const previewBox   = document.querySelector('.preview');

let currentSVGText = null; // store last loaded svg

// --- functions ---
function renderSVGToCanvas(svgText, opts = {}) {
    if (!svgText) return;
    currentSVGText = svgText; // keep around for re-renders

    const { size, showBackground, backgroundColor, useRealSize } = {
        size: parseInt(renderSize.value, 10) || 512,
        showBackground: bgToggle.checked,
        backgroundColor: bgColorInput.value,
        useRealSize: realSize.checked,
        ...opts
    };

    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
        // pick canvas size
        if (useRealSize && img.width && img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
        } else {
            canvas.width = size;
            canvas.height = size;
        }

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

// --- wire up controls ---
[bgColorInput, bgToggle, renderSize, realSize].forEach(el => {
    el.addEventListener('input', () => {
        if (currentSVGText) renderSVGToCanvas(currentSVGText);
    });
});

// --- run ---
new Ploder(document.getElementById('svgploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => {
        for (const file of files) {
            if (!file.type.match(/^image\/svg\+xml$/)) continue;
            renderSVGToCanvas(await getSVGFromFile(file));
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const defaultSVG = await getSVGFromURL('/resources/images/svg/snkbx_Boosh.svg');
    renderSVGToCanvas(defaultSVG);
});
