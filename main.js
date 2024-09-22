const { jsPDF } = require("jspdf"); // Make sure to install jsPDF in your project using npm or CDN.
const svg2pdf = require("svg2pdf.js"); // Include the svg2pdf.js library for converting SVG to PDF.

const { pokemons_en } = require(`./data/pokemons.en.js`);
const { pokemons_de } = require(`./data/pokemons.de.js`);

const DEBUG = true;

const gridSize = 20;
let words = [];
let grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

window.addEventListener("DOMContentLoaded", function (event) {
    document.getElementById('btnGenerate').onclick = onGenerate;
});

// callback for submit
function onGenerate() {
    const dir1 = document.getElementById('dir1').checked;
    const dir2 = document.getElementById('dir2').checked;
    const dir3 = document.getElementById('dir3').checked;
    const dir4 = document.getElementById('dir4').checked;
    const dir5 = document.getElementById('dir5').checked;
    const dir6 = document.getElementById('dir6').checked;
    const dir7 = document.getElementById('dir7').checked;
    const dir8 = document.getElementById('dir8').checked;

    const gen1 = document.getElementById('gen1').checked;
    const gen2 = document.getElementById('gen2').checked;
    const gen3 = document.getElementById('gen3').checked;
    const gen4 = document.getElementById('gen4').checked;

    const language = document.querySelector('input[name="lang"]:checked').value;

    // load pokemons by language and generation
    let pokemons = [];
    if (language == "de") {
        pokemons = pokemons.concat((gen1 ? pokemons_de[0] : []),
            (gen2 ? pokemons_de[1] : []),
            (gen3 ? pokemons_de[2] : []),
            (gen4 ? pokemons_de[3] : []));
    }
    else {
        pokemons = pokemons.concat((gen1 ? pokemons_en[0] : []),
            (gen2 ? pokemons_en[1] : []),
            (gen3 ? pokemons_en[2] : []),
            (gen4 ? pokemons_en[3] : []));
    }

    if (DEBUG) {
        console.log("dir1: " + dir1);
        console.log("dir2: " + dir2);
        console.log("dir3: " + dir3);
        console.log("dir4: " + dir4);
        console.log("dir5: " + dir5);
        console.log("dir6: " + dir6);
        console.log("dir7: " + dir7);
        console.log("dir8: " + dir8);

        console.log("gen1: " + gen1);
        console.log("gen2: " + gen2);
        console.log("gen3: " + gen3);
        console.log("gen4: " + gen4);

        console.log("language: " + language);

        console.log("first pokemon: " + pokemons[0]);
    }

    generateCrossword(pokemon);
}

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