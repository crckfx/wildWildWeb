/* ========== DATA ========== */
/* ========================== */
const slides = [
  {
    title: "Portfolio Piece #1",
    subtitle: "Case Study",
    intro:
      "Short one-liner that sets context for the piece. What it is and why it matters.",
    staff: [
      { label: "Role", value: "UX / UI / Front-end" }
    ],
    poster: "/resources/lachoutlaws/Images/charParty.jpeg",  
    links: [
      { label: "CASE STUDY", href: "#" },
    ],
    hero:  "/resources/lachoutlaws/Images/charParty.jpeg",
  },
  {
    title: "Portfolio Piece #2",
    subtitle: "Prototype",
    intro: "Interactive prototype exploring navigation options.",
    staff: [{ label: "Role", value: "Prototyping, Motion" }],
    poster: "/resources/lachoutlaws/Images/chibiRobo.jpg",

    links: [{ label: "CASE STUDY", href: "#" }],
    hero: "/resources/lachoutlaws/Images/chibiRobo.jpg"
  },
  {
    title: "Portfolio Piece #3",
    subtitle: "Research",
    intro: "User interviews and insights distilled into opportunities.",
    staff: [{ label: "Role", value: "Research, Synthesis" }],
    poster: "/resources/lachoutlaws/Images/pikmin.jpg",
    links: [{ label: "CASE STUDY", href: "#" }],
    hero: "/resources/lachoutlaws/Images/pikmin.jpg"
  }
];

// 1) Your images (local or remote). Add as many as you want.
const playImages = [
  { src: "/resources/lachoutlaws/Images/chibiRobo.jpg", alt: 'ChibiRobo' },
  { src: "/resources/lachoutlaws/Images/pikmin.jpg", alt: 'Pikmin' },
  { src: "/resources/lachoutlaws/Images/charParty.jpeg", alt: 'Charlee Party' },
];

/* ========== GALLERY ========== */
/* ============================= */


const gallery   = document.querySelector('.gallery');
const center    = gallery.querySelector('.pane.center');
const leftImg   = gallery.querySelector('.left-img');
const rightImg  = gallery.querySelector('.right-img');
const btnPrev   = gallery.querySelector('.arrow-left');
const btnNext   = gallery.querySelector('.arrow-right');
const leftPane  = gallery.querySelector('.pane.left');
const rightPane = gallery.querySelector('.pane.right');

let index = 0;
const wrap = (n, m) => ((n % m) + m) % m;

function centerMarkup(s) {
  const currentPoster = s.posterOverride || s.poster;

  const staffLines = (s.staff || [])
    .map(({label, value}) => `<div class="credit"><strong>${label}:</strong> ${value}</div>`)
    .join("");


  const links = (s.links || [])
    .map(l => `<a class="btn" href="${l.href}">${l.label}</a>`)
    .join("");

  return `
    <div class="caseCard" role="group" aria-labelledby="case-title">
      <div class="caseBody">
        <div class="caseLeft">
          <h3 id="case-title" class="caseTitle">${s.title}</h3>
          <p class="kicker">${s.subtitle || ""}</p>

          ${staffLines ? `<h4 class="sectionHd">OVERVIEW</h4>${staffLines}` : ""}

          ${s.intro ? `<p class="credit">${s.intro}</p>` : ""}


          ${links ? `<div class="actions">${links}</div>` : ""}
        </div>

        <figure class="caseRight">
          <img src="${currentPoster}" alt="Poster image for ${s.title}" />
        </figure>
      </div>
    </div>
  `;
}

function render() {
  const s = slides[index];
  center.innerHTML = centerMarkup(s);
  const prev = slides[wrap(index - 1, slides.length)];
  const next = slides[wrap(index + 1, slides.length)];
  leftImg.src  = prev.hero || prev.poster;
  rightImg.src = next.hero || next.poster;
}

function goPrev(){ index = wrap(index - 1, slides.length); render(); }
function goNext(){ index = wrap(index + 1, slides.length); render(); }

btnPrev.addEventListener('click', goPrev);
btnNext.addEventListener('click', goNext);
document.querySelector('.edge-left') .addEventListener('click', goPrev);
document.querySelector('.edge-right').addEventListener('click', goNext);
leftPane.addEventListener('click', e => { if (!e.target.closest('.arrow')) goPrev(); });
rightPane.addEventListener('click', e => { if (!e.target.closest('.arrow')) goNext(); });

center.addEventListener('click', (e) => {
  const thumb = e.target.closest('.thumbs img');
  if (!thumb) return;

  const src = thumb.getAttribute('src');

  slides[index].posterOverride = src;

  const posterEl = center.querySelector('.caseRight img');
  if (posterEl) posterEl.src = src;

  center.querySelectorAll('.thumbs img').forEach(el => {
    el.classList.toggle('is-active', el === thumb);
  });
});

render();


/* ========== BUTTONS ========== */

/* ========== YES/NO ========== */
/* ============================ */


document.querySelectorAll('.iconBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log(btn.getAttribute('aria-label')); 
  });
});

/* ========== WORK/PLAY ========== */
/* =============================== */

const tabs = document.querySelectorAll('.tabBtn');
const panels = {
    work: document.getElementById('workPanel'),
    play: document.getElementById('playPanel')
};

function switchMode(mode){
    tabs.forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.mode === mode)));
    Object.entries(panels).forEach(([key, el]) => {
        el.hidden = key !== mode;
    });
}

tabs.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchMode(btn.dataset.mode); }
    });
});

switchMode('work');

/* ========== IMAGES ========== */
/* ============================ */

function renderPlayGrid(items) {
  const grid = document.querySelector('#playPanel .playGrid');
  if (!grid) return;
  grid.innerHTML = ''; 

  items.forEach((item, i) => {
    const fig = document.createElement('figure');
    const img = new Image();
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = item.src;
    img.alt = item.alt || `Illustration ${i + 1}`;
    fig.appendChild(img);
    grid.appendChild(fig);

    img.addEventListener('error', () => {
      img.alt = img.alt + ' (failed to load)';
      img.style.opacity = 0.4;
    });
  });
}

renderPlayGrid(playImages);