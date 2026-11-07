document.addEventListener('DOMContentLoaded',() => {
    const rangeInput = document.getElementById('h-range')
    const displayValue = document.getElementById('h-value-display')

    const updateHValue = (sliderValue) => {
        const minH = 0.0001
        const maxH = 0.01

        const t = (sliderValue-1)/99

        const h = maxH * Math.pow(minH / maxH, t)

        let formattedH
        if(h >- 0.001) {
            formattedH = h.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
        }else{
            formattedH = h.toFixed(5)
        }

        displayValue.textContent = formattedH
    }

    updateHValue(rangeInput.value)

    rangeInput.addEventListener('input', (e) => {
        updateHValue(e.target.value)
    })
})


document.addEventListener('DOMContentLoaded', () => {
    
    // --- Ползунок n (по x) ---
    const nRange = document.getElementById('n-range');
    const nDisplay = document.getElementById('n-value-display');

    if (nRange && nDisplay) {
        // При изменении ползунка просто берем его значение
        nRange.addEventListener('input', (e) => {
            nDisplay.textContent = e.target.value;
        });
    }

    // --- Ползунок m (по t) ---
    const mRange = document.getElementById('m-range');
    const mDisplay = document.getElementById('m-value-display');

    if (mRange && mDisplay) {
        // Аналогично для m
        mRange.addEventListener('input', (e) => {
            mDisplay.textContent = e.target.value;
        });
    }
});