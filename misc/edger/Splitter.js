export class Splitter {
    constructor(splitterEl, targetEl, { prop = 'height', min = 100, axis = 'y' } = {}) {
        this.splitter = splitterEl;
        this.min = min;
        this.target = targetEl;

        // bind once: which coordinate and which measurement to use
        if (axis === 'x') {
            this._getCoord = e => e.clientX;
            this._measure = () => this.target.offsetWidth;
        } else {
            this._getCoord = e => e.clientY;
            this._measure = () => this.target.offsetHeight;
        }

        const isVar = prop.startsWith('--');
        const cs = getComputedStyle(targetEl);

        this.read = isVar
            ? () => parseFloat(cs.getPropertyValue(prop))
            : () => parseFloat(cs[prop]);

        this.write = isVar
            ? v => targetEl.style.setProperty(prop, `${v}px`)
            : v => (targetEl.style[prop] = `${v}px`);

        this.startDrag = this.startDrag.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.endDrag = this.endDrag.bind(this);
        this.splitter.addEventListener('pointerdown', this.startDrag);
    }

    startDrag(e) {
		this.startCoord = this._getCoord(e);
		this.startVal = this.read();
        document.addEventListener('pointermove', this.onDrag);
        document.addEventListener('pointerup', this.endDrag);
        document.body.style.userSelect = 'none';
    }

    onDrag(e) {
        const delta = this._getCoord(e) - this.startCoord;
        this.write(Math.max(this.min, this.startVal - delta));
    }

    endDrag() {
        document.removeEventListener('pointermove', this.onDrag);
        document.removeEventListener('pointerup', this.endDrag);
        document.body.style.userSelect = '';
        this.write(this._measure()); // correct any overshoot from dragging out of bounds
    }
}
