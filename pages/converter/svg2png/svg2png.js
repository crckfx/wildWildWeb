import { Ploder } from './Ploder.js';
import { Numbin } from '/numbin/Numbin.js';

const MAX_SIZE = 9999;

const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// controls
const bgColorInput = document.getElementById('bgColorInput');
const bgToggle = document.getElementById('bgToggle');
const renderWidth = document.getElementById('renderWidth');
const renderHeight = document.getElementById('renderHeight');
const toggle_fitToPage = document.getElementById('toggle_fitToPage');
const toggle_showOutline = document.getElementById('toggle_showOutline');
const toggle_showTextView = document.getElementById('toggle_showTextView');
const toggle_sizeLock = document.getElementById('toggle_sizeLock');
const textView = document.getElementById('textView');
const previewBox = document.getElementById('preview');
const textBox = textView.querySelector('.textBox');
const textView_exit = textView.querySelector('.exit');
const textView_name = textView.querySelector('.name');

const urlBtn = document.getElementById('urlInput');
const urlDialog = document.getElementById('urlDialog');
const urlForm = document.getElementById('urlForm');
const urlField = document.getElementById('urlField');






// --- state ---
let currentSVGText = null;
let currentFilename = null;
let lockedRatio = null;

const canvasState = {
    width: 512,
    height: 512,
    showBackground: true,
    backgroundColor: '#ffffff'
};

// --- central entry point ---
async function handleSVGSource(svgText, filename = "untitled.svg") {
    if (!svgText) return;

    currentFilename = filename;
    currentSVGText = svgText;

    await renderAndSyncState(svgText);
    textBox.textContent = svgText;

    if (toggle_sizeLock.checked) {
        lockedRatio = canvasState.width / canvasState.height;
    }
}


// --- helpers ---
function loadSVGImage(svgText) {
    return new Promise((resolve, reject) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = reject;
        img.src = url;
    });
}

function drawCanvas(img, opts = {}) {
    const { width, height, showBackground, backgroundColor } = opts;

    if (width > MAX_SIZE || height > MAX_SIZE) {
        console.log("error - something exceeded MAX_SIZE");
        return;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showBackground) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}



async function renderAndSyncState(svgText) {
    const img = await loadSVGImage(svgText);

    // Update canvasState and input elements
    canvasState.width = img.naturalWidth;
    canvasState.height = img.naturalHeight;
    renderWidth.value = canvasState.width;
    renderHeight.value = canvasState.height;

    drawCanvas(img, canvasState);
}

// --- render from inputs without overwriting them ---
async function renderSVGToCanvas(svgText, opts = {}) {
    if (!svgText) return;

    const renderOpts = {
        width: canvasState.width,
        height: canvasState.height,
        showBackground: canvasState.showBackground,
        backgroundColor: canvasState.backgroundColor,
        ...opts
    };

    const img = await loadSVGImage(svgText);
    drawCanvas(img, renderOpts);
}

async function handleSVGUpload(file) {
    if (!file || !file.type.match(/^image\/svg\+xml$/)) return;
    const svgText = await getSVGFromFile(file);
    handleSVGSource(svgText, file.name);
}

function handleCanvasPropertyInput() {
    canvasState.showBackground = bgToggle.checked;
    canvasState.backgroundColor = bgColorInput.value;

    if (currentSVGText) renderSVGToCanvas(currentSVGText);
}

function handleDimensionInput(key) {
    let newWidth = parseInt(renderWidth.value, 10) || canvasState.width;
    let newHeight = parseInt(renderHeight.value, 10) || canvasState.height;

    if (lockedRatio != null) {
        if (key === 'width') {
            newHeight = Math.round(newWidth / lockedRatio);
            renderHeight.value = newHeight;
        } else { // key === 'height'
            newWidth = Math.round(newHeight * lockedRatio);
            renderWidth.value = newWidth;
        }
    }

    canvasState.width = newWidth;
    canvasState.height = newHeight;
    if (currentSVGText) renderSVGToCanvas(currentSVGText);
}


renderWidth.addEventListener('input', () => handleDimensionInput('width'));
renderHeight.addEventListener('input', () => handleDimensionInput('height'));
bgColorInput.addEventListener('input', handleCanvasPropertyInput);
bgToggle.addEventListener('input', handleCanvasPropertyInput);


// --- toggles ---
toggle_fitToPage.addEventListener('input', () =>
    toggle_fitToPage.checked ? previewBox.classList.add('fit') : previewBox.classList.remove('fit')
);

toggle_showOutline.addEventListener('input', () =>
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline')
);

toggle_showTextView.addEventListener('click', () => {
    textView.classList.add('show');
    textView_name.textContent = currentFilename || 'untitled.svg';
});

toggle_sizeLock.addEventListener('input', () => {
    lockedRatio = toggle_sizeLock.checked ? canvasState.width / canvasState.height : null;
});

textView_exit.addEventListener('click', () => textView.classList.remove('show'));

urlBtn.addEventListener('click', () => {
	urlDialog.show();
	urlField.focus();
});

urlForm.addEventListener('submit', async () => {
	const url = urlField.value.trim();
	if (url) {
		try {
			const svgText = await getSVGFromURL(url);
			handleSVGSource(svgText, filenameFromURL(url));
		} catch (err) {
			console.error("Failed to load URL:", err);
		}
	}
	urlField.value = "";
});

urlDialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') urlDialog.close();
});

urlDialog.addEventListener('click', (e) => {
    if (e.target !== urlForm) {
        urlDialog.close();
    }
});


// --- Ploder initialization ---
new Ploder(document.getElementById('svgploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => handleSVGUpload(files[0])
});

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', async () => {

    document.querySelectorAll('input.numbin').forEach(input => {
        const min = parseInt(input.getAttribute('min'), 10) || 0;
        const max = parseInt(input.getAttribute('max'), 10) || 9999;
        const step = parseInt(input.getAttribute('step'), 10) || 1;
        new Numbin(input, { min, max, step });
    });

    // Initial sync of canvasState with inputs
    canvasState.showBackground = bgToggle.checked;
    canvasState.backgroundColor = bgColorInput.value;
    canvasState.width = parseInt(renderWidth.value, 10) || canvasState.width;
    canvasState.height = parseInt(renderHeight.value, 10) || canvasState.height;

    toggle_fitToPage.checked ? previewBox.classList.add('fit') : previewBox.classList.remove('fit');
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline');

    const defaultURL = '/resources/images/svg/snkbx_Boosh.svg';
    try {
        const defaultSVG = await getSVGFromURL(defaultURL);
        handleSVGSource(defaultSVG, filenameFromURL(defaultURL));
    } catch (err) {
        console.error("Failed to load default SVG:", err);
    }

});

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

function filenameFromURL(url) {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'untitled.svg';
}
