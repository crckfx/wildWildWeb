export class MerryGoRound {
    constructor(carousel) {
        this.carouselEl = carousel;
        this.inner = this.carouselEl.querySelector('.carousel-inner');
        this.items = this.carouselEl.querySelectorAll('.carousel-item');
        this.total = this.items.length;
        this.activeIndex = 0;
        this.isSliding = false;

        // Determine initial active index
        this.activeIndex = Array.from(this.items).findIndex(item =>
            item.classList.contains('active')
        );

        // If none are active, default to index 0 and add class manually
        if (this.activeIndex === -1) {
            this.activeIndex = 0;
            this.items[0].classList.add('active');
        }


        document.getElementById('prevBtn').addEventListener('click', () => this.interactMoveLeft());
        document.getElementById('nextBtn').addEventListener('click', () => this.interactMoveRight());

        this.setCarouselMinHeight();

        this.startAutoMoveInterval();
    }

    // Helpers to add/remove multiple classes
    addClasses(el, ...classes) {
        classes.forEach(c => el.classList.add(c));
    }
    removeClasses(el, ...classes) {
        classes.forEach(c => el.classList.remove(c));
    }


    slide(direction) {
        if (this.isSliding) return;
        this.isSliding = true;

        const active = this.items[this.activeIndex];
        let nextIndex;
        if (direction === 'next') {
            nextIndex = (this.activeIndex + 1) % this.total;
        } else {
            nextIndex = (this.activeIndex - 1 + this.total) % this.total;
        }
        const next = this.items[nextIndex];

        // Prepare next slide class setup
        this.removeClasses(next, 'carousel-item-next', 'carousel-item-prev', 'carousel-item-start', 'carousel-item-end', 'slide-in', 'slide-out');
        this.removeClasses(active, 'carousel-item-next', 'carousel-item-prev', 'carousel-item-start', 'carousel-item-end', 'slide-in', 'slide-out');

        if (direction === 'next') {
            this.addClasses(next, 'carousel-item-next', 'carousel-item-start');
            this.addClasses(active, 'active', 'carousel-item-start');
            // Force reflow to apply start position before transition
            next.offsetWidth;
            this.addClasses(next, 'slide-in');
            this.addClasses(active, 'slide-out');
        } else {
            this.addClasses(next, 'carousel-item-prev', 'carousel-item-end');
            this.addClasses(active, 'active', 'carousel-item-end');
            next.offsetWidth;
            this.addClasses(next, 'slide-in');
            this.addClasses(active, 'slide-out');
        }

        // After transition ends
        const onTransitionEnd = (e) => {
            if (e.target !== next) return;
            // Cleanup classes
            this.removeClasses(active, 'active', 'carousel-item-start', 'carousel-item-end', 'slide-out');
            this.removeClasses(next, 'carousel-item-next', 'carousel-item-prev', 'carousel-item-start', 'carousel-item-end', 'slide-in');
            this.addClasses(next, 'active');

            this.activeIndex = nextIndex;
            this.isSliding = false;

            next.removeEventListener('transitionend', onTransitionEnd);
        };


        next.addEventListener('transitionend', onTransitionEnd);
    }

    setCarouselMinHeight() {
        // const inner = this.carouselEl.querySelector('.carousel-inner');

        // Clear min-height to let items shrink/grow naturally before measuring
        this.inner.style.minHeight = '';

        let tallest = 0;

        this.items.forEach(item => {
            // Temporarily ensure it's measurable
            const originalStyle = item.getAttribute('style') || '';
            item.style.visibility = 'hidden';
            item.style.display = 'block';
            item.style.position = 'relative';
            item.style.opacity = '0';

            const height = item.offsetHeight;
            tallest = Math.max(tallest, height);

            // Restore original inline style (if any)
            item.setAttribute('style', originalStyle);
        });

        this.inner.style.minHeight = `${tallest}px`;
    }

    startAutoMoveInterval() {
        // Clear any existing interval
        if (this.autoMoveIntervalId !== null) {
            clearInterval(this.autoMoveIntervalId);
        }
        this.autoMoveIntervalId = setInterval(() => this.slide('next'), 9000);
    }

    interactMoveLeft() {
        // opportunity to differentiate interact move orders from core moves
        this.slide('prev');
        this.startAutoMoveInterval();
    }
    interactMoveRight() {
        // opportunity to differentiate interact move orders from core moves
        this.slide('next');
        this.startAutoMoveInterval();
    }

}