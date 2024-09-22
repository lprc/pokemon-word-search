const { jsPDF } = require("jspdf"); // Make sure to install jsPDF in your project using npm or CDN.
const svg2pdf = require("svg2pdf.js"); // Include the svg2pdf.js library for converting SVG to PDF.

const gridSize = 20;
let words = [];
let grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

function generateCrossword(inputWords) {
    words = inputWords;

    for (const word of words) {
        let placed = false;

        while (!placed) {
            // Randomly choose a horizontal or vertical orientation
            const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(word, startRow, startCol, orientation)) {
                placeWord(word, startRow, startCol, orientation);
                placed = true;
            }
        }
    }

    generateSVG();
    generatePDF();
}

function canPlaceWord(word, row, col, orientation) {
    if (orientation === 'horizontal') {
        if (col + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }
    } else {
        if (row + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    }
    return true;
}

function placeWord(word, row, col, orientation) {
    for (let i = 0; i < word.length; i++) {
        if (orientation === 'horizontal') {
            grid[row][col + i] = word[i];
        } else {
            grid[row + i][col] = word[i];
        }
    }
}

function generateSVG() {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" font-size="16">`;

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            svgContent += `<text x="${col * 10 + 5}" y="${row * 10 + 15}" text-anchor="middle" fill="black">${grid[row][col] || ''}</text>`;
            if (grid[row][col]) {
                svgContent += `<rect x="${col * 10}" y="${row * 10}" width="10" height="10" fill="none" stroke="black"/>`;
            }
        }
    }
    svgContent += `</svg>`;

    document.getElementById('crossword').innerHTML = svgContent;

    // Convert SVG to PDF
    const svgElement = new Blob([svgContent], { type: 'image/svg+xml' });
    const pdf = new jsPDF();
    svg2pdf(svgElement, pdf);
    pdf.save("crossword.pdf");
}

// Example input
// const inputWords = ["sun", "moon", "earth", "star", "planet", "galaxy", "cosmos", "space", "universe", "blackhole", "gravity", "lightyear", "asteroid", "comet", "nebula", "quasar", "supernova", "satellite", "orbital", "solstice"];
// generateCrossword(inputWords);

function generateSVGs(event) {
    event.preventDefault(); // Prevent default form submission
    const numberInput = document.getElementById('numberInput').value;
    const svgContainer = document.getElementById('svgContainer');
    svgContainer.innerHTML = ''; // Clear previous SVGs

    // Generate the requested number of SVG circles
    for (let i = 0; i < numberInput; i++) {
        const svgElement = document.createElement('svg');
        svgElement.setAttribute('width', '100');
        svgElement.setAttribute('height', '100');
        svgElement.classList.add('svg-circle');
        svgElement.innerHTML = '<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />';
        svgContainer.appendChild(svgElement);
    }
}