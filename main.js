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

class Puzzle {
    constructor(grid, gridSolutions, pokemonsToFind, width, height, directions, showPokemonList) {
        this.grid = grid;
        this.gridSolutions = gridSolutions;
        this.pokemonsToFind = pokemonsToFind;
        this.numPokemons = pokemonsToFind.length;
        this.width = width;
        this.height = height;
        this.directions = directions;
        this.showPokemonList = showPokemonList;
    }
}

// const gridSize = 20;
var gridWidth = 20;
var gridHeight = 20;
const retries = 50; // number of retries to place a pokemon

// var allGrids = [];
// var allFilledGrids = [];
var allPuzzles = [];
var pdfa4Puzzles;
var pdfa4Solutions;

window.addEventListener("DOMContentLoaded", function (event) {
    document.getElementById('btnGenerate').onclick = onGenerate;

    document.getElementById('btnAllDirs').onclick = function () {
        document.getElementById('dir1').checked = true;
        document.getElementById('dir2').checked = true;
        document.getElementById('dir3').checked = true;
        document.getElementById('dir4').checked = true;
        document.getElementById('dir5').checked = true;
        document.getElementById('dir6').checked = true;
        document.getElementById('dir7').checked = true;
        document.getElementById('dir8').checked = true;
    };

    document.getElementById('btnNoneDirs').onclick = function () {
        document.getElementById('dir1').checked = false;
        document.getElementById('dir2').checked = false;
        document.getElementById('dir3').checked = false;
        document.getElementById('dir4').checked = false;
        document.getElementById('dir5').checked = false;
        document.getElementById('dir6').checked = false;
        document.getElementById('dir7').checked = false;
        document.getElementById('dir8').checked = false;
    };

    document.getElementById('btnDownloadPdf').onclick = function () {
        for (let i = 0; i < allPuzzles.length; i++) {
            let svgElement = document.getElementById(`svg-puzzle-${i}`).firstElementChild;
            let svgElementSolution = document.getElementById(`svg-solution-${i}`).firstElementChild;
            exportPDF(svgElement, `puzzle-${i}`);
            exportPDF(svgElementSolution, `solution-${i}`);
        }
    };

    document.getElementById('btnDownloadPdfSingle').onclick = function () {
        if (allPuzzles.length > 0) {
            savePDFa4();
        }
    };

    document.getElementById('btnDownloadSvg').onclick = function () {
        for (let i = 0; i < allPuzzles.length; i++) {
            let svgElement = document.getElementById(`svg-puzzle-${i}`).firstElementChild;
            let svgElementSolution = document.getElementById(`svg-solution-${i}`).firstElementChild;

            let svgString = new XMLSerializer().serializeToString(svgElement);
            let a = document.createElement('a');
            a.href = 'data:image/svg+xml,' + encodeURIComponent(svgString);
            a.download = `puzzle-${i}.svg`;
            a.click();

            svgString = new XMLSerializer().serializeToString(svgElementSolution);
            a.href = 'data:image/svg+xml,' + encodeURIComponent(svgString);
            a.download = `solution-${i}.svg`;
            a.click();
        }
    };

    document.getElementById('fontSize').onchange = updatePDFa4;
    document.getElementById('font').onchange = updatePDFa4;
    document.getElementById('pageMargin').onchange = updatePDFa4;
    document.getElementById('puzzleMargin').onchange = updatePDFa4;
    document.getElementById('charSpacing').onchange = updatePDFa4;
});

// callback for submit
function onGenerate() {
    document.getElementById('puzzles-container').innerHTML = "";
    document.getElementById('solutions-container').innerHTML = "";
    allPuzzles = [];

    gridWidth = parseInt(document.getElementById('numRows').value);
    gridHeight = parseInt(document.getElementById('numCols').value);

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
    const numberOfPuzzles = document.getElementById('numPuzzles').value;
    const showPokemonList = document.getElementById('showPokemonList').checked;

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
        console.log("dirs: " + dirs);

        console.log("gen1: " + gen1);
        console.log("gen2: " + gen2);
        console.log("gen3: " + gen3);
        console.log("gen4: " + gen4);

        console.log("language: " + language);

        console.log("number of pokemons: " + numberOfPokemons);
        console.log("number of puzzles: " + numberOfPuzzles);

        console.log("first pokemon: " + pokemons[0]);

        console.log("dirs: " + dirs.map(dirToStr));
    }

    for (let i = 0; i < numberOfPuzzles; i++) {
        // take random entries from pokemons
        const pokemon_filtered = [];
        while (pokemon_filtered.length < numberOfPokemons) {
            const randomIndex = Math.floor(Math.random() * pokemons.length);
            // const randomPokemon = pokemons.splice(randomIndex, 1)[0];
            const randomPokemon = pokemons[randomIndex];
            if ((randomPokemon.length <= gridWidth || randomPokemon.length <= gridHeight) && !pokemon_filtered.includes(randomPokemon)) {
                pokemon_filtered.push(randomPokemon);
            }
        }

        let puzzle = generatePuzzle(pokemon_filtered, dirs, showPokemonList);

        // allGrids.push(grid_and_num);
        // allFilledGrids.push(filledGrid);
        allPuzzles.push(puzzle);

        generateSVG(puzzle, i);
    }
    generatePDFa4();
    previewPDFa4();
}

function generatePuzzle(inputWords, dirs, showPokemonList) {
    var grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(''));
    let pokemonsToFind = [];
    for (const word of inputWords) {
        let placed = false;
        let dir = dirs[Math.floor(Math.random() * dirs.length)];
        let tryno = 0;

        while (!placed && tryno < retries) {
            const startRow = Math.floor(Math.random() * gridHeight);
            const startCol = Math.floor(Math.random() * gridWidth);

            if (canPlaceWord(grid, word, startRow, startCol, dir)) {
                placeWord(grid, word, startRow, startCol, dir);
                placed = true;
                pokemonsToFind.push(word);
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

    let filledGrid = copyAndFillGrid(grid);
    return new Puzzle(filledGrid, grid, pokemonsToFind, gridWidth, gridHeight, dirs, showPokemonList);
}

function canPlaceWord(grid, word, row, col, direction) {
    if (direction === DIR.LR) {
        if (col + word.length > gridWidth) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }

    } else if (direction === DIR.RL) {
        word = reverse(word);
        if (col + word.length > gridWidth) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) return false;
        }
    }
    else if (direction === DIR.TB) {
        if (row + word.length > gridHeight) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    }
    else if (direction === DIR.BT) {
        word = reverse(word);
        if (row + word.length > gridHeight) return false;
        for (let i = 0; i < word.length; i++) {
            if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) return false;
        }
    } else if (direction === DIR.TLBR) {
        for (let i = 0; i < word.length; i++) {
            if (row + i >= gridHeight || col + i >= gridWidth ||
                (grid[row + i][col + i] !== '' && grid[row + i][col + i] !== word[i])) return false;
        }
    } else if (direction === DIR.BRTL) {
        word = reverse(word);
        for (let i = 0; i < word.length; i++) {
            if (row + i >= gridHeight || col + i >= gridWidth ||
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

function generateSVG(puzzle, svgNum) {
    let grid = puzzle.gridSolutions;
    let filledGrid = puzzle.grid;
    let svgContent = "";
    let svgContentSolution = "";

    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            svgContent += `<text x="${col * 15 + 5}" y="${row * 15 + 15}" text-anchor="middle" fill="black">${grid[row][col] ? grid[row][col].toUpperCase() : filledGrid[row][col].toUpperCase()}</text>`;
            svgContentSolution += `<text x="${col * 15 + 5}" y="${row * 15 + 15}" text-anchor="middle" fill="${grid[row][col] ? 'red' : 'black'}" font-weight="${grid[row][col] ? 'bold' : 'normal'}">${grid[row][col] ? grid[row][col].toUpperCase() : filledGrid[row][col].toUpperCase()}</text>`;
        }
    }

    const fontSize = document.getElementById('fontSize').value || 12;
    const font = document.getElementById('font').value || "Courier";

    const svgContainer1 = document.createElement('div');
    svgContainer1.classList.add('svg-container');
    svgContainer1.setAttribute('id', `svg-puzzle-${svgNum}`);
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', gridWidth * 15);
    svgElement.setAttribute('height', gridHeight * 15);
    svgElement.setAttribute('font-size', fontSize);
    svgElement.setAttribute('font-family', font);
    svgElement.innerHTML = svgContent;
    svgContainer1.appendChild(svgElement);
    document.getElementById('puzzles-container').appendChild(svgContainer1);

    const svgContainer2 = document.createElement('div');
    svgContainer2.classList.add('svg-container');
    svgContainer2.setAttribute('id', `svg-solution-${svgNum}`);
    const svgElementSolution = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElementSolution.setAttribute('width', gridWidth * 15);
    svgElementSolution.setAttribute('height', gridHeight * 15);
    svgElementSolution.setAttribute('font-size', fontSize);
    svgElementSolution.setAttribute('font-family', font);
    svgElementSolution.innerHTML = svgContentSolution;
    svgContainer2.appendChild(svgElementSolution);
    document.getElementById('solutions-container').appendChild(svgContainer2);
}

// export pdf
function exportPDF(svgElement, name) {
    svgElement.getBoundingClientRect(); // force layout calculation
    const width = svgElement.width.baseVal.value;
    const height = svgElement.height.baseVal.value + 5;
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    // const pdf = new jsPDF('p', 'pt', "a4");

    pdf.svg(svgElement, { width, height })
        .then(() => {
            // save the created pdf
            pdf.save(`${name}.pdf`)
        })
}

// export all in one a4 pdf from global variables allGrids and allFilledGrids
function generatePDFa4() {
    const fontSize = document.getElementById('fontSize').value || 12;
    const font = document.getElementById('font').value || "Courier";
    const pageMargin = parseInt(document.getElementById('pageMargin').value) || 20;
    const puzzleMargin = parseInt(document.getElementById('puzzleMargin').value) || 12;
    const charSpacing = parseInt(document.getElementById('charSpacing').value) || 12;

    pdfa4Puzzles = new jsPDF('p', 'pt', "a4", true);
    const width = pdfa4Puzzles.internal.pageSize.getWidth();
    const height = pdfa4Puzzles.internal.pageSize.getHeight();
    pdfa4Puzzles.setFont(font);
    pdfa4Puzzles.setFontSize(fontSize);

    pdfa4Solutions = new jsPDF('p', 'pt', "a4", true);
    pdfa4Solutions.setFont(font);
    pdfa4Solutions.setFontSize(fontSize);

    const puzzleWidth = gridWidth * charSpacing;
    const puzzleHeight = gridHeight * charSpacing;
    const puzzleHeightWithNumPokemons = puzzleHeight + 10;

    const pokemonListWidth = allPuzzles[0].showPokemonList ? pdfa4Puzzles.internal.pageSize.getWidth() - pageMargin * 2 - puzzleWidth - puzzleMargin * 2 : 0;
    const puzzleWidthWithList = puzzleWidth + pokemonListWidth;

    const numPuzzles = allPuzzles.length;
    const numPuzzlesPerRow = Math.floor(width / (puzzleWidthWithList + puzzleMargin + pageMargin));
    const numPuzzlesPerCol = Math.floor(height / (puzzleHeightWithNumPokemons + puzzleMargin + pageMargin));
    const numPuzzlesPerPage = numPuzzlesPerRow * numPuzzlesPerCol;

    for (let i = 0; i < numPuzzles; i++) {
        const pdfRow = Math.floor(i / numPuzzlesPerRow) % numPuzzlesPerCol;
        const pdfCol = (i % numPuzzlesPerRow) % numPuzzlesPerRow;

        if (i > 0 && i % numPuzzlesPerPage === 0) {
            pdfa4Puzzles.addPage();
            pdfa4Solutions.addPage();
        }

        const grid = allPuzzles[i].gridSolutions;
        const numPokemons = allPuzzles[i].numPokemons;
        const filledGrid = allPuzzles[i].grid;

        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                const text = grid[row][col] ? grid[row][col].toUpperCase() : filledGrid[row][col].toUpperCase();
                const x = pdfCol * (puzzleWidthWithList + puzzleMargin) + col * charSpacing + pageMargin;
                const y = pdfRow * (puzzleHeightWithNumPokemons + puzzleMargin) + row * charSpacing + pageMargin;
                pdfa4Puzzles.text(text, x, y, 'center');
                pdfa4Solutions.setFont(font, grid[row][col] ? 'bold' : 'normal').text(text, x, y, 'center');
            }
        }

        // print number of pokemons in this puzzle below
        const x = pdfCol * (puzzleWidthWithList + puzzleMargin) + 0 * charSpacing + pageMargin;
        const y = pdfRow * (puzzleHeightWithNumPokemons + puzzleMargin) + gridHeight * charSpacing + pageMargin;
        const text = `Number of Pokemons: ${numPokemons}`;
        pdfa4Puzzles.text(text, x, y);
        pdfa4Solutions.setFont(font, 'normal').text(text, x, y);

        // print list of pokemon, if desired, right of puzzle
        if (allPuzzles[i].showPokemonList) {
            const x = pdfCol * (puzzleWidthWithList + puzzleMargin) + gridWidth * charSpacing + pageMargin;
            const y = pdfRow * (puzzleHeightWithNumPokemons + puzzleMargin) + pageMargin;
            const text = 'Pokemons to find:\n' + allPuzzles[i].pokemonsToFind.join(', ');
            pdfa4Puzzles.text(text, x, y, { maxWidth: pokemonListWidth });
            pdfa4Solutions.text(text, x, y, { maxWidth: pokemonListWidth });
        }
    }
}

function previewPDFa4() {
    if (pdfa4Puzzles && pdfa4Solutions) {
        const puzzlesBlob = pdfa4Puzzles.output('blob');
        const puzzlesUrl = URL.createObjectURL(puzzlesBlob);
        const solutionsBlob = pdfa4Solutions.output('blob');
        const solutionsUrl = URL.createObjectURL(solutionsBlob);

        document.getElementById("pdf-frame-puzzles").src = puzzlesUrl;
        document.getElementById("pdf-frame-solutions").src = solutionsUrl;
    }
}

function updatePDFa4() {
    generatePDFa4();
    previewPDFa4();
}

function savePDFa4() {
    pdfa4Puzzles.save(`puzzle.pdf`);
    pdfa4Solutions.save(`solution.pdf`);
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

// fills empty places in grid with random chars
function copyAndFillGrid(grid) {
    var newGrid = copyGrid(grid);
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            if (newGrid[row][col] === '')
                newGrid[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));

        }
    }
    return newGrid;
}

function copyGrid(grid) {
    var newGrid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(''));
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            newGrid[row][col] = grid[row][col];
        }
    }
    return newGrid;
}