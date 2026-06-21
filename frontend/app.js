const API_URL = '/api/calculate';
let chartM, chartQ, chartY;
let isHovered = false; 
let currentYData = []; 

// Получаем холст расчетной схемы
const schemeCanvas = document.getElementById('schemeCanvas');
const schemeCtx = schemeCanvas.getContext('2d');

function resizeSchemeCanvas() {
    schemeCanvas.width = schemeCanvas.clientWidth;
    schemeCanvas.height = schemeCanvas.clientHeight;
}
window.addEventListener('resize', () => {
    resizeSchemeCanvas();
    drawScheme();
});

// Рисование схемы балки
function drawScheme() {
    const ctx = schemeCtx;
    const width = schemeCanvas.width;
    const height = schemeCanvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 60;
    const beamY = height / 2;
    const beamWidth = width - padLeft - padRight;

    const L = document.getElementById('length').value;
    const F = document.getElementById('force').value;

    // Стержень балки
    ctx.beginPath();
    ctx.moveTo(padLeft, beamY);
    ctx.lineTo(padLeft + beamWidth, beamY);
    ctx.strokeStyle = '#3B82F6'; 
    ctx.lineWidth = 6;
    ctx.stroke();

    // Жесткая заделку слева (Опора А)
    ctx.fillStyle = '#6B7280';
    ctx.fillRect(padLeft - 8, beamY - 25, 8, 50);
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1.5;
    for (let pos = -20; pos <= 20; pos += 6) {
        ctx.beginPath();
        ctx.moveTo(padLeft - 8, beamY + pos);
        ctx.lineTo(padLeft - 14, beamY + pos + 5);
        ctx.stroke();
    }

    // Точки А и Б
    ctx.fillStyle = '#F3F4F6';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('А', padLeft - 25, beamY + 5); 
    ctx.fillText('Б', padLeft + beamWidth + 15, beamY + 5); 

    // Длина балки
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`L = ${L} м`, padLeft + beamWidth / 2, beamY + 30);
    
    ctx.beginPath();
    ctx.moveTo(padLeft, beamY + 18);
    ctx.lineTo(padLeft + beamWidth, beamY + 18);
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Сила F
    if (Number(F) !== 0) {
        const isUpward = Number(F) > 0;
        const arrowLength = 35;
        const arrowX = padLeft + beamWidth;
        const startArrowY = isUpward ? beamY + arrowLength : beamY - arrowLength;
        const endArrowY = beamY;

        ctx.beginPath();
        ctx.moveTo(arrowX, startArrowY);
        ctx.lineTo(arrowX, endArrowY);
        
        const tipSize = 6;
        const dir = isUpward ? 1 : -1;
        ctx.moveTo(arrowX, endArrowY);
        ctx.lineTo(arrowX - tipSize, endArrowY + dir * tipSize);
        ctx.moveTo(arrowX, endArrowY);
        ctx.lineTo(arrowX + tipSize, endArrowY + dir * tipSize);

        ctx.strokeStyle = '#FBBF24'; 
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`F = ${F} кН`, arrowX, isUpward ? startArrowY + 15 : startArrowY - 8);
    }
}

// Конфигурация графиков Chart.js
function createChartConfig(label, color, fill = false, invertY = false, suggestZeroY = false) {
    return {
        type: 'line',
        data: { datasets: [{ label: label, data: [], borderColor: color, backgroundColor: color + '1A', fill: fill, borderWidth: 2.5, pointRadius: 0 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animations: { y: { type: 'number', duration: 800, easing: 'easeOutQuart' } },
            plugins: { 
                legend: { labels: { color: '#9CA3AF' } },
                tooltip: {
                    callbacks: {
                        title: (context) => `Координата X: ${Number(context[0].parsed.x).toFixed(2)} м`,
                        label: (context) => `Значение: ${Number(context.parsed.y).toFixed(3)}`
                    }
                }
            },
            scales: {
                x: { 
                    type: 'linear',
                    grid: { color: '#374151' }, 
                    ticks: { color: '#9CA3AF', maxTicksLimit: 5, callback: val => Number(val).toFixed(1) + ' м' } 
                },
                y: { reverse: invertY, grid: { color: '#374151' }, ticks: { color: '#9CA3AF' }, beginAtZero: suggestZeroY }
            }
        }
    };
}

// Инициализация
const ctxM = document.getElementById('chartM').getContext('2d');
const ctxQ = document.getElementById('chartQ').getContext('2d');
const ctxY = document.getElementById('chartY').getContext('2d');

chartM = new Chart(ctxM, createChartConfig('Изгибающий момент M (кН·м)', '#EF4444', true, true, true));
chartQ = new Chart(ctxQ, createChartConfig('Поперечная сила Q (кН)', '#10B981', true, false, true));
chartY = new Chart(ctxY, createChartConfig('Прогиб балки Y (м)', '#3B82F6', false, false, true));
chartY.data.datasets[0].cubicInterpolationMode = 'monotone';

// Анимация волны при наведении на график прогибов
function loop(timestamp) {
    if (!isHovered || !currentYData.length) return;
    const speed = 0.005; 
    const amplitude = 0.15; 
    const wave = 1 + amplitude * Math.sin(timestamp * speed);

    chartY.data.datasets[0].data = currentYData.map(pt => ({ x: pt.x, y: pt.y * wave }));
    chartY.options.animations.y = false;
    chartY.update('none'); 
    requestAnimationFrame(loop);
}

const canvasY = document.getElementById('chartY');
canvasY.addEventListener('mouseenter', () => { isHovered = true; requestAnimationFrame(loop); });
canvasY.addEventListener('mouseleave', () => {
    isHovered = false;
    chartY.options.animations.y = { type: 'number', duration: 600, easing: 'easeOutQuart' };
    chartY.data.datasets[0].data = currentYData;
    chartY.update();
});

// Запрос и расчет данных
async function calculate() {
    const L = document.getElementById('length').value;
    const F = document.getElementById('force').value;
    const EI = document.getElementById('ei').value;

    drawScheme();

    try {
        const response = await fetch(`${API_URL}?L=${L}&F=${F}&EI=${EI}`);
        if (!response.ok) throw new Error('Ошибка сервера');
        
        const data = await response.json();

        const pointsM = data.x.map((xVal, idx) => ({ x: xVal, y: data.M[idx] }));
        const pointsQ = data.x.map((xVal, idx) => ({ x: xVal, y: data.Q[idx] }));
        currentYData = data.x.map((xVal, idx) => ({ x: xVal, y: data.Y[idx] }));

        chartM.options.scales.x.min = 0; chartM.options.scales.x.max = Number(L);
        chartQ.options.scales.x.min = 0; chartQ.options.scales.x.max = Number(L);
        chartY.options.scales.x.min = 0; chartY.options.scales.x.max = Number(L);

        const absYValues = data.Y.map(Math.abs);
        const maxY = Math.max(...absYValues, 0.001);
        if (Number(F) >= 0) {
            chartY.options.scales.y.min = 0; chartY.options.scales.y.max = maxY * 1.25;
        } else {
            chartY.options.scales.y.min = -maxY * 1.25; chartY.options.scales.y.max = 0;
        }

        chartM.data.datasets[0].data = pointsM;
        chartQ.data.datasets[0].data = pointsQ;
        
        if (!isHovered) {
            chartY.options.animations.y = { type: 'number', duration: 800, easing: 'easeOutQuart' };
            chartY.data.datasets[0].data = currentYData;
            chartY.update();
        }

        chartM.update();
        chartQ.update();

        // ВЫВОД РЕШЕНИЯ В ШИРОКИЙ БЛОК БЕЗ ЛИШНИХ ПЕРЕНОСОВ СТРОК
        const solutionContainer = document.getElementById('solutionBlock');
        solutionContainer.innerHTML = data.solution.join('');

        // Рендеринг формул через MathJax
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([solutionContainer]).catch((err) => console.log(err));
        }

    } catch (error) {
        alert('Не удалось связаться с расчетным движком.');
        console.error(error);
    }
}

document.getElementById('calcBtn').addEventListener('click', calculate);

// Первый запуск при загрузке страницы
resizeSchemeCanvas();
calculate();