import { Resizer } from '../../misc/resizer/Resizer.js';
import { Ploder } from '/misc/ploder/Ploder.js';
import { Splitter } from '/misc/splitter/Splitter.js';
import { getSVGFromFile, getSVGFromURL, filenameFromURL, loadSVGImage } from './app-helpers.js';

const MAX_SIZE = 9999;
const applet = document.getElementById('applet_svg2png');
const canvas = document.getElementById('svgPreview');
const ctx = canvas.getContext('2d');

// controls
const bgColorInput = document.getElementById('bgColorInput');
const bgToggle = document.getElementById('bgToggle');
const toggle_fitToPage = document.getElementById('toggle_fitToPage');
const toggle_showOutline = document.getElementById('toggle_showOutline');
const toggle_showTextView = document.getElementById('toggle_showTextView');
const toggle_sizeLock = document.getElementById('toggle_sizeLock');
const previewBox = document.getElementById('preview');

const textView = document.getElementById('textView');
const textBox = textView.querySelector('.textBox');
const textView_exit = textView.querySelector('.exit');
const textView_name = textView.querySelector('.name');
const textView_submit = document.getElementById('submitTextView');

const urlBtn = document.getElementById('urlInput');
const urlDialog = document.getElementById('urlDialog');
const urlForm = document.getElementById('urlForm');
const urlField = document.getElementById('urlField');

// numbins: make sure they have their numbins existing in the HTML so that these instant queries work
const renderWidth = document.getElementById('_renderWidth').querySelector('input');
const renderHeight = document.getElementById('_renderHeight').querySelector('input');
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
// 
const viewSplitter = document.querySelector('.splitter');
new Splitter(viewSplitter, textView, { prop: '--tv-height', min: 200 });
new Resizer(handleResize, 50);
new Ploder(document.getElementById('uploder'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => handleSVGUpload(files[0]),
    click: false
});
new Ploder(document.getElementById('attachmentInput'), {
    accept: '.svg',
    pattern: /^image\/svg\+xml$/,
    onUpload: async (files) => handleSVGUpload(files[0])
});
// ***********************************************************************

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

function updateFitDimensions(w, h, container) {
    const scale = Math.min(
        container.clientWidth / w,
        container.clientHeight / h
    );

    canvas.style.setProperty('--fit-width', w * scale + 'px');
    canvas.style.setProperty('--fit-height', h * scale + 'px');
}


function closeTextView() {
    textView.classList.remove('show');
    viewSplitter.classList.remove('show');
}

// ------------------------------------------------------------------------------------------------
// ----- handlers -----
function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // the app's opinions about what constitutes 1. mobile/big 2. portrait/landscape
    const mobile = (w < 700 || h < 600);
    const aspect = (w / h) > 1.2 ? "landscape" : "portrait";
    updateFitDimensions(canvasState.width, canvasState.height, previewBox);
    // set the app's css --guys 
    applet.setAttribute("data-orientation", aspect);
    applet.setAttribute("data-mobile", mobile);
    console.log(`aspect-ratio: ${aspect}, w: ${w}, h:${h}`);
}

// load up from svg source text
async function handleSVGSource(svgText, filename = "untitled.svg") {
    if (!svgText) return;

    currentFilename = filename;
    currentSVGText = svgText;

    const img = await loadSVGImage(svgText);
    canvasState.width = img.naturalWidth;
    canvasState.height = img.naturalHeight;
    renderWidth.value = canvasState.width;
    renderHeight.value = canvasState.height;

    await renderSVGToCanvas(svgText);
    textBox.textContent = svgText;

    if (toggle_sizeLock.checked) {
        lockedRatio = canvasState.width / canvasState.height;
    }
    handleResize();
}

// handle toggling 'fit to screen'
function handleFitToggle() {
    if (toggle_fitToPage.checked) {
        previewBox.classList.add('fit');
        if (currentSVGText) renderSVGToCanvas(currentSVGText);
    } else {
        previewBox.classList.remove('fit');
    }
}

async function handleSVGUpload(file) {
    if (!file || !file.type.match(/^image\/svg\+xml$/)) return;
    const svgText = await getSVGFromFile(file);
    handleSVGSource(svgText, file.name);
}

function handleCanvasPropertyInput() {
    canvasState.showBackground = bgToggle.checked;
    canvasState.backgroundColor = bgColorInput.value;
    renderSVGToCanvas(currentSVGText);
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
    updateFitDimensions(canvasState.width, canvasState.height, previewBox);
    if (currentSVGText) renderSVGToCanvas(currentSVGText);
}

async function handleTextViewSubmit() {
    const newText = textBox.textContent;
    try {
        await handleSVGSource(newText, currentFilename || 'untitled.svg');
        textBox.classList.remove('edited', 'error');
        closeTextView();
    } catch (e) {
        textBox.classList.remove('edited');
        textBox.classList.add('error');
    }
}
// ------------------------------------------------------------------------------------------------

renderWidth.addEventListener('input', () => handleDimensionInput('width'));
renderHeight.addEventListener('input', () => handleDimensionInput('height'));
bgColorInput.addEventListener('input', handleCanvasPropertyInput);
bgToggle.addEventListener('input', handleCanvasPropertyInput);


// --- toggles ---
toggle_fitToPage.addEventListener('input', handleFitToggle);

toggle_showOutline.addEventListener('input', () =>
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline')
);


toggle_sizeLock.addEventListener('input', () => {
    lockedRatio = toggle_sizeLock.checked ? canvasState.width / canvasState.height : null;
});

toggle_showTextView.addEventListener('click', () => {
    textView.classList.add('show');
    viewSplitter.classList.add('show');
    textView_name.textContent = currentFilename || 'untitled.svg';
});
textView_exit.addEventListener('click', closeTextView);
textBox.addEventListener('input', () => {
    // User changed text
    textBox.classList.remove('error');
    textBox.classList.add('edited');
});
textView_submit.addEventListener('click', handleTextViewSubmit);


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
    if (e.target === urlDialog) {
        urlDialog.close();
    }
});




// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', async () => {
    // init canvas state
    canvasState.showBackground = bgToggle.checked;
    canvasState.backgroundColor = bgColorInput.value;
    canvasState.width = parseInt(renderWidth.value, 10) || canvasState.width;
    canvasState.height = parseInt(renderHeight.value, 10) || canvasState.height;
    toggle_fitToPage.checked ? previewBox.classList.add('fit') : previewBox.classList.remove('fit');
    toggle_showOutline.checked ? previewBox.classList.add('outline') : previewBox.classList.remove('outline');
    // some more init
    // handleResize();

    // load a default file
    const defaultURL = '/resources/images/svg/snkbx_Boosh.svg';
    try {
        const defaultSVG = await getSVGFromURL(defaultURL);
        handleSVGSource(defaultSVG, filenameFromURL(defaultURL));
    } catch (err) {
        console.error("Failed to load default SVG:", err);
    }
});





