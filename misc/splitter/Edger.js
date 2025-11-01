// edger/Edger.js
export class Edger {
    /**
     * @param {HTMLElement} edge    // draggable edge element
     * @param {HTMLElement} target  // panel whose size we change
     * @param {{
     *   container?: HTMLElement,   // bounds; default target.parentElement
     *   axis?: 'x'|'y',            // dimension axis
     *   side?: 'left'|'right'|'top'|'bottom', // determines delta sign
     *   prop?: string,             // 'width' | 'height' | '--var-name'
     *   min?: number,              // px
     *   max?: number|null          // px; null => container size
     * }} opts
     */
    constructor(edge, target, opts = {}) {
        this.edge = edge;
        this.target = target;

        const {
            container = target.parentElement,
            axis = 'y',
            side = axis === 'y' ? 'bottom' : 'right',
            prop = axis === 'y' ? 'height' : 'width',
            min = 0,
            max = null
        } = opts;

        this.container = container;
        this.axis = axis;
        this.side = side;
        this.prop = prop;
        this.min = min;
        this.maxOpt = max;

        // coordinate and measure fns decided at bind time
        if (axis === 'x') {
            this._coord = e => e.clientX;
            this._containerSize = () => this.container.clientWidth;
            this._measure = () => this.target.offsetWidth;
        } else {
            this._coord = e => e.clientY;
            this._containerSize = () => this.container.clientHeight;
            this._measure = () => this.target.offsetHeight;
        }

        // write/read: css var vs style prop
        const isVar = this.prop.startsWith('--');
        const cs = getComputedStyle(this.target);

        // if (isVar) this.container.style.setProperty(prop, `${this._measure()}px`); // convert to pixels if var to avoid problems

        if (isVar) {
            const m = this._measure();
            if (m >= this.min && m <= (this.maxOpt ?? Infinity)) {
                this.container.style.setProperty(prop, `${m}px`);
            }
        }


        this._read = isVar
            ? () => parseFloat(cs.getPropertyValue(this.prop)) || this._measure()
            : () => parseFloat(cs[this.prop]) || this._measure();

        this._write = isVar
            ? v => this.container.style.setProperty(this.prop, `${v}px`)
            : v => (this.target.style[this.prop] = `${v}px`);

        // sign from side
        this._sign =
            (this.axis === 'x' && this.side === 'left') ||
                (this.axis === 'y' && this.side === 'top')
                ? -1
                : 1;

        // bind handlers
        this._onDown = this._onDown.bind(this);
        this._onMove = this._onMove.bind(this);
        this._onUp = this._onUp.bind(this);

        edge.addEventListener('pointerdown', this._onDown);
    }

    _onDown(e) {
        // establish drag baseline
        this.startCoord = this._coord(e);
        this.startSize = this._read();
        this.boundMax = Number.isFinite(this.maxOpt) ? this.maxOpt : this._containerSize();

        // interaction hooks
        document.addEventListener('pointermove', this._onMove);
        document.addEventListener('pointerup', this._onUp);
        document.body.style.userSelect = 'none';
        if (this.edge.setPointerCapture) {
            try { this.edge.setPointerCapture(e.pointerId); } catch { }
        }
    }

    _onMove(e) {
        const delta = (this._coord(e) - this.startCoord) * this._sign;
        const raw = this.startSize + delta;
        const next = Math.max(this.min, Math.min(this.boundMax, raw));
        this._write(next);
    }

    _onUp(e) {
        document.removeEventListener('pointermove', this._onMove);
        document.removeEventListener('pointerup', this._onUp);
        document.body.style.userSelect = '';
        if (this.edge.releasePointerCapture) {
            try { this.edge.releasePointerCapture(e.pointerId); } catch { }
        }
        // final clamp and snap to actual measured size to avoid layout drift
        const measured = this._measure();
        const clamped = Math.max(this.min, Math.min(this.boundMax, measured));
        this._write(clamped);
    }
}
