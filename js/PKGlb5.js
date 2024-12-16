const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let segments = [];
let clipWindow = { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            parseInput(content);
            draw();
        };
        reader.readAsText(file);
    }
});

// Парсинг входного файла
function parseInput(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const n = parseInt(lines[0]);
    segments = [];
    for (let i = 1; i <= n; i++) {
        const [x1, y1, x2, y2] = lines[i].split(/\s+/).map(Number);
        segments.push({ x1, y1, x2, y2 });
    }
    const [xmin, ymin, xmax, ymax] = lines[n + 1].split(/\s+/).map(Number);
    clipWindow = { xmin, ymin, xmax, ymax };
}

// Отрисовка
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка системы координат
    ctx.strokeStyle = 'lightgray';
    for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Отрисовка отсекающего окна
    ctx.strokeStyle = 'blue';
    ctx.strokeRect(clipWindow.xmin, clipWindow.ymin, clipWindow.xmax - clipWindow.xmin, clipWindow.ymax - clipWindow.ymin);

    // Отрисовка исходных отрезков
    ctx.strokeStyle = 'red';
    segments.forEach(segment => {
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.stroke();
    });

    // Отсечение (пример для алгоритма Сазерленда-Коэна)
    const clippedSegments = sutherlandCohen(segments, clipWindow);

    // Отрисовка видимых частей отрезков
    ctx.strokeStyle = 'green';
    clippedSegments.forEach(segment => {
        ctx.beginPath();
        ctx.moveTo(segment.x1, segment.y1);
        ctx.lineTo(segment.x2, segment.y2);
        ctx.stroke();
    });
}

// Алгоритм Сазерленда-Коэна
function sutherlandCohen(segments, clipWindow) {
    const clippedSegments = [];
    const { xmin, ymin, xmax, ymax } = clipWindow;

    segments.forEach(segment => {
        const { x1, y1, x2, y2 } = segment;
        let code1 = getCode(x1, y1, clipWindow);
        let code2 = getCode(x2, y2, clipWindow);

        while (true) {
            if (!(code1 | code2)) { // Отрезок полностью внутри
                clippedSegments.push({ x1, y1, x2, y2 });
                break;
            }
            if (code1 & code2) { // Отрезок полностью снаружи
                break;
            }

            // Выбираем точку снаружи
            let code = code1 ? code1 : code2;
            let x, y;

            if (code & 8) { // Верх
                x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
                y = ymax;
            } else if (code & 4) { // Низ
                x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
                y = ymin;
            } else if (code & 2) { // Право
                y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
                x = xmax;
            } else if (code & 1) { // Лево
                y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
                x = xmin;
            }

            if (code === code1) {
                x1 = x;
                y1 = y;
                code1 = getCode(x1, y1, clipWindow);
            } else {
                x2 = x;
                y2 = y;
                code2 = getCode(x2, y2, clipWindow);
            }
        }
    });

    return clippedSegments;
}

// Код точки (для алгоритма Сазерленда-Коэна)
function getCode(x, y, clipWindow) {
    const { xmin, ymin, xmax, ymax } = clipWindow;
    let code = 0;
    if (y > ymax) code |= 8;
    if (y < ymin) code |= 4;
    if (x > xmax) code |= 2;
    if (x < xmin) code |= 1;
    return code;
}