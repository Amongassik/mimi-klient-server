const SolveButton = document.getElementById('solve-btn');
const plotDiv = document.getElementById('plot-3d');

async function solve() {
    const n = Number(document.getElementById('n-value-display').textContent);
    const m = Number(document.getElementById('m-value-display').textContent);

    try {
        const res = await fetch('/api/mechanic/scheme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stepX: n, stepT: m }),
        });

        const raw = await res.json().catch(() => null);

        if (!res.ok) {
            console.log(raw?.details || raw?.error || `Сервер вернул ${res.status}`);
            return;
        }

        // Сервер оборачивает ответ в { data: { x, t, u } }
        const result = raw?.data ?? raw;   // ← ключевая строка

        console.log(result)
        // --- диагностика ---
        console.log('keys:', Object.keys(result));
        console.log('x:', result.x?.length, 't:', result.t?.length,
                    'u:', result.u?.length, 'u[0]:', result.u?.[0]?.length);

        if (!result.x || !result.t || !result.u) {
            console.error('Неожиданный формат ответа:', result);
            return;
        }

        const flat = result.u.flat();
        console.log('u min/max:', Math.min(...flat), Math.max(...flat));

        if (!plotDiv || plotDiv.clientHeight === 0) {
            console.warn('Контейнер #plot-3d не найден или имеет нулевую высоту!');
            return;
        }

        drawSurface(result);

    } catch (error) {
        console.error(error);
    }
}

function drawSurface(data) {
    const { x, t, u } = data;

    const trace = {
        type: 'surface',
        x, y: t, z: u,
        colorscale: 'Viridis',
        colorbar: { title: 'u' },
        hovertemplate:
            'x = %{x:.4f}<br>' +
            't = %{y:.4f}<br>' +
            'u = %{z:.4f}<extra></extra>',
    };

    const layout = {
        title: 'Решение u(x, t)',
        height: 600,
        width: plotDiv.clientWidth || 900,
        scene: {
            xaxis: { title: 'x' },
            yaxis: { title: 't' },
            zaxis: { title: 'u' },
            camera: { eye: { x: 1.6, y: -1.6, z: 1.0 } },
        },
        margin: { l: 0, r: 0, t: 40, b: 0 },
    };

    Plotly.react(plotDiv, [trace], layout);
}

SolveButton.addEventListener('click', solve);