export class Resizer {
    /**
     * wraps a ResizeObserver in a debounce method
     * @param {Element} target - observed element
     * @param {Function} callback - function to call on resize
     * @param {number} delay - debounce time in ms
     */
    constructor(target, callback, delay = 100) {
        if (!(target instanceof Element) || typeof callback !== 'function') return;

        this.target = target;
        this.callback = callback;
        this.delay = delay;
        this.timer = null;

        this.listener = () => {
            clearTimeout(this.timer);
            this.timer = setTimeout(this.callback, this.delay);
        };

        this.observer = new ResizeObserver(this.listener);
        this.observer.observe(this.target);

        // initial sync
        this.listener();
    }

    disconnect() {
        if (this.observer) this.observer.disconnect();
        if (this.timer) clearTimeout(this.timer);
    }
}
