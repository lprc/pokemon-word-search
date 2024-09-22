const { jsPDF } = require("jspdf"); // Make sure to install jsPDF in your project using npm or CDN.
const svg2pdf = require("svg2pdf.js"); // Include the svg2pdf.js library for converting SVG to PDF.

const { pokemons_en } = require(`./data/pokemons.en.js`);
const { pokemons_de } = require(`./data/pokemons.de.js`);

const DEBUG = true;

// directions enum
const DIR = Object.freeze({
    LR: 0, // left to right
    RL: 1,
    TB: 2, // top to bottom
    BT: 3,
    TLBR: 4, // top-left to bottom-right
    BRTL: 5,
    TRBL: 6,
    BLTR: 7
});

const gridSize = 20;
const retries = 50; // number of retries to place a pokemon

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
    // only checked directions
    let dirs = [];
    if (dir1)
        dirs.push(DIR.LR);
    if (dir2)
        dirs.push(DIR.RL);
    if (dir3)
        dirs.push(DIR.TB);
    if (dir4)
        dirs.push(DIR.BT);
    if (dir5)
        dirs.push(DIR.TLBR);
    if (dir6)
        dirs.push(DIR.BRTL);
    if (dir7)
        dirs.push(DIR.TRBL);
    if (dir8)
        dirs.push(DIR.BLTR);

    const gen1 = document.getElementById('gen1').checked;
    const gen2 = document.getElementById('gen2').checked;
    const gen3 = document.getElementById('gen3').checked;
    const gen4 = document.getElementById('gen4').checked;

    const language = document.querySelector('input[name="lang"]:checked').value;

    const numberOfPokemons = document.getElementById('numPokemons').value;

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

    // take random entries from pokemons
    const pokemon_filtered = [];
    while (pokemon_filtered.length < numberOfPokemons) {
        const randomIndex = Math.floor(Math.random() * pokemons.length);
        const randomPokemon = pokemons.splice(randomIndex, 1)[0];
        if (!randomPokemon.length <= gridSize && !pokemon_filtered.includes(randomPokemon)) {
            pokemon_filtered.push(randomPokemon);
        }
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
        console.log("dirs: " + dirs);

        console.log("gen1: " + gen1);
        console.log("gen2: " + gen2);
        console.log("gen3: " + gen3);
        console.log("gen4: " + gen4);

        console.log("language: " + language);

        console.log("number of pokemons: " + numberOfPokemons)

        console.log("first pokemon: " + pokemons[0]);

        console.log("pokemons: " + pokemon_filtered);
        console.log("dirs: " + dirs.map(dirToStr));
    }


    let grid = generateCrossword(pokemon_filtered, dirs);
    generateSVG(grid);
}

function generateCrossword(inputWords, dirs) {
    var grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    for (const word of inputWords) {
        let placed = false;
        let dir = dirs[Math.floor(Math.random() * dirs.length)];
        let tryno = 0;

        while (!placed && tryno < retries) {
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);

            if (canPlaceWord(grid, word, startRow, startCol, dir)) {
                placeWord(grid, word, startRow, startCol, dir);
                placed = true;
                if (DEBUG) {
                    console.log(`word '${word}' placed at [${startRow}, ${startCol}] with direction '${dirToStr(dir)}'`);
                }
            }
            tryno++;

        }

        if (DEBUG && !placed) {
            console.log(`failed to place word '${word}' with direction '${dirToStr(dir)}'. Max retries reached.`);
        }
    }

    if (DEBUG) {
        console.log("grid: ");
        console.table(grid);
    }

    return grid;
    // generatePDF();
}

function canPlaceWord(grid, word, row, col, direction) {
    if (direction === DIR.LR) {
        if (col + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }

    } else if (direction === DIR.RL) {
        word = reverse(word);
        if (col + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }
    }
    else if (direction === DIR.TB) {
        if (row + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    }
    else if (direction === DIR.BT) {
        word = reverse(word);
        if (row + word.length > gridSize) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    } else if (direction === DIR.TLBR) {
        for (let i = 0; i < word.length; i++) {
            if (row + i >= gridSize || col + i >= gridSize ||
                (grid[row + i][col + i] !== '' && grid[row + i][col + i] !== word[i])) return false;
        }
    } else if (direction === DIR.BRTL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            if (row + i >= gridSize || col + i >= gridSize ||
                (grid[row + i][col + i] !== '' && grid[row + i][col + i] !== word[i])) return false;
        }
    } else if (direction === DIR.BLTR) {
        for (let i = 0; i < word.length; i++) {
            if (row - i < 0 || col + i < 0 ||
                (grid[row - i][col + i] !== '' && grid[row - i][col + i] !== word[i])) return false;
        }
    } else if (direction === DIR.TRBL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            if (row - i < 0 || col + i < 0 ||
                (grid[row - i][col + i] !== '' && grid[row - i][col + i] !== word[i])) return false;
        }
    }
    return true;
}

function placeWord(grid, word, row, col, direction) {
    if (direction === DIR.LR) {
        for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i];
        }

    } else if (direction === DIR.RL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i];
        }
    }
    else if (direction === DIR.TB) {
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col] = word[i];
        }
    }
    else if (direction === DIR.BT) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col] = word[i];
        }
    } else if (direction === DIR.TLBR) {
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col + i] = word[i];
        }
    } else if (direction === DIR.BRTL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            grid[row + i][col + i] = word[i];
        }
    } else if (direction === DIR.BLTR) {
        for (let i = 0; i < word.length; i++) {
            grid[row - i][col + i] = word[i];
        }
    } else if (direction === DIR.TRBL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            grid[row - i][col + i] = word[i];
        }
    }
}

function generateSVG(grid) {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridSize * 15}" height="${gridSize * 15}" font-size="16" font-family="monospace">`;
    let svgContentSolution = svgContent;

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            svgContent += `<text x="${col * 15 + 5}" y="${row * 15 + 15}" text-anchor="middle" fill="black">${grid[row][col] ? grid[row][col].toUpperCase() : String.fromCharCode(65 + Math.floor(Math.random() * 26))}</text>`;
            svgContentSolution += `<text x="${col * 15 + 5}" y="${row * 15 + 15}" text-anchor="middle" fill="${grid[row][col] ? 'red' : 'black'}">${grid[row][col] ? grid[row][col].toUpperCase() : String.fromCharCode(65 + Math.floor(Math.random() * 26))}</text>`;
        }
    }
    svgContent += `</svg>`;
    svgContentSolution += `</svg>`;

    document.getElementById('svgContainer').innerHTML = svgContent;
    document.getElementById('svgContainerSolution').innerHTML = svgContentSolution;

    // Convert SVG to PDF
    // const svgElement = new Blob([svgContent], { type: 'image/svg+xml' });
    // const pdf = new jsPDF();
    // svg2pdf(svgElement, pdf);
    // pdf.save("crossword.pdf");
}

// Reverse a string
function reverse(s) {
    return s.split("").reverse().join("");
}

function dirToStr(dir) {
    if (dir === DIR.LR) return "LR";
    if (dir === DIR.RL) return "RL";
    if (dir === DIR.TB) return "TB";
    if (dir === DIR.BT) return "BT";
    if (dir === DIR.TLBR) return "TLBR";
    if (dir === DIR.BRTL) return "BRTL";
    if (dir === DIR.BLTR) return "BLTR";
    if (dir === DIR.TRBL) return "TRBL";
}