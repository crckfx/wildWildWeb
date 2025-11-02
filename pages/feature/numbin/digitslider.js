
function createDigitSlider(container) {
    let currentValue = parseInt(container.dataset.value, 10) || 0;
    const digitElement = container.querySelector('.digit');

    let startY = 0;

    const updateDigit = (newValue) => {
        currentValue = (newValue + 10) % 10; // Keep value within 0-9
        container.dataset.value = currentValue;
        digitElement.textContent = currentValue;
    };

    container.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startY = e.clientY; // Use clientY for pointer events
        container.setPointerCapture(e.pointerId); // Capture pointer for consistent tracking
    });
    
    container.addEventListener('pointermove', (e) => {
        e.preventDefault();
        if (e.buttons === 1) { // Check if the primary button is pressed
            const deltaY = e.clientY - startY;

            if (Math.abs(deltaY) > 20) { // Swipe threshold
                if (deltaY > 0) {
                    updateDigit(currentValue + 1); // Swipe up
                } else {
                    updateDigit(currentValue - 1); // Swipe down
                }
                startY = e.clientY; // Reset start position for continuous swiping
            }
        }
    });

    container.addEventListener('pointerup', (e) => {
        container.releasePointerCapture(e.pointerId);
    });

    container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            updateDigit(currentValue + 1);
        } else if (e.key === 'ArrowDown') {
            updateDigit(currentValue - 1);
        }
    });

    container.addEventListener('click', () => {
        container.focus();
    });


    container.addEventListener('wheel', (e) => {
        // convert deltaY into up/down
        if (e.deltaY > 0) {
            updateDigit(currentValue + 1);
        } else {
            updateDigit(currentValue - 1);
        }        
    })
}



document.querySelectorAll('.digit-container').forEach(container => {
    createDigitSlider(container);

});
