export class Splitter {
	constructor(splitterEl, targetEl) {
		this.splitter = splitterEl;
		this.target = targetEl;
		this.onDrag = this.onDrag.bind(this);
		this.endDrag = this.endDrag.bind(this);
		this.startDrag = this.startDrag.bind(this);
		this.splitter.addEventListener('pointerdown', this.startDrag);
	}

	startDrag(e) {
		this.startY = e.clientY;
		this.startHeight = this.target.offsetHeight;
		document.addEventListener('pointermove', this.onDrag);
		document.addEventListener('pointerup', this.endDrag);
		document.body.style.userSelect = 'none';
	}

	onDrag(e) {
		const dy = e.clientY - this.startY;
		this.target.style.height = `${this.startHeight - dy}px`;
	}

	endDrag() {
		document.removeEventListener('pointermove', this.onDrag);
		document.removeEventListener('pointerup', this.endDrag);
		document.body.style.userSelect = '';
	}
}
