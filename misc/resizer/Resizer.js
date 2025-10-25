export class Resizer {
	constructor(callback, delay = 100) {
		if (typeof callback !== "function") return;
		this.timer = 0;
		this.delay = delay;
		this.callback = callback;

		this.listener = () => {
			clearTimeout(this.timer);
			this.timer = setTimeout(this.callback, this.delay);
		};
		window.addEventListener("resize", this.listener);
	}

	disconnect() {
		window.removeEventListener("resize", this.listener);
	}
}
