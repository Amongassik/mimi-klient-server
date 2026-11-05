const solveButton = document.getElementById('solve-btn')
const methodsInputs = document.querySelectorAll('.radio')
const hRange = document.getElementById('h-value-display')

// Элементы для вывода графика
const answerContainer = document.getElementById('answer-container')
const canvas = document.getElementById('solution-chart')

// Глобальная переменная для хранения экземпляра графика
let chartInstance = null;

const toast = {
    element: document.getElementById('toast'),
    messageEl: document.getElementById('toast-message'),
    closeBtn: document.getElementById('toast-close'),
    timeoutId: null,

    show: function(message, type = 'info') {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.messageEl.textContent = message;
        this.element.classList.remove('toast-error');
        if (type === 'error') this.element.classList.add('toast-error');
        this.element.classList.add('show');
        this.timeoutId = setTimeout(() => this.hide(), 5000);
    },

    hide: function() {
        this.element.classList.remove('show');
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
};

const Method = {
    method: null,
    methods: ['mkr', 'mke'],
    getMethod(id) {
        this.method = this.methods.at(id)
    },
    notNull() {
        return Boolean(this.method)
    }
}

function getMethod() {
    const selectedInput = [...methodsInputs].find(inp => inp.checked);
    if (!selectedInput) {
        toast.show('Метод не выбран', 'error');
        return false;
    }
    const id = Number(selectedInput.id);
    Method.getMethod(id);
    if (!Method.notNull()) {
        toast.show('Неизвестный метод', 'error');
        return false;
    }
    return true;
}

// --- Отрисовка графика ---
function drawChart(X, Y, methodName) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    const lineColor = methodName === 'mkr' ? '#3b5bdb' : '#e11d48'; 
    const bgColor   = methodName === 'mkr' ? 'rgba(59, 91, 219, 0.1)' : 'rgba(225, 29, 72, 0.1)';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: X.map(x => x.toFixed(3)), // Ось X — координаты узлов
            datasets: [{
                label: `y(x) — ${methodName.toUpperCase()}`,
                data: Y,
                borderColor: lineColor,
                backgroundColor: bgColor,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: lineColor,
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        // В тултипе показываем точные значения
                        label: (ctx) => `y = ${ctx.parsed.y.toFixed(4)}`,
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'x' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    title: { display: true, text: 'y(x)' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });

    // Показываем контейнер с графиком
    answerContainer.style.display = 'flex';
}

async function solve() {
    if (!getMethod()) return;

    const h = +hRange.textContent;
    if (!h || h <= 0) {
        toast.show('Некорректный шаг h', 'error');
        return;
    }

    toast.show('Решаем...');

    const data = {
        method: Method.method,
        step: h,
    };

    try {
        const res = await fetch('/api/mechanick/sde', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok) {
            const msg = result?.details || result?.error || `Сервер вернул ${res.status}`;
            toast.show(msg, 'error');
            return;
        }

        if (result && result.data && result.data.X && result.data.Y) {
            toast.show('Успешно!');
            drawChart(result.data.X, result.data.Y, Method.method);
        } else {
            toast.show('Некорректный ответ от сервера', 'error');
        }
        console.log(result)

    } catch (e) {
        console.error(e);
        toast.show(e.message || 'Ошибка сети', 'error');
    }
}

solveButton.addEventListener('click', solve)