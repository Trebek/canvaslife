/*
 * Conway's Game of Life
 * Author: Alex C.
 * Updated: 2017-04-02
 * Version: 0.1
 *
 * An ECMAScript 2016 (JavaScript) implementation of Conway's Game of Life.
 *
 * TODO:
 * - Change cells to a Map? (Actually seems to be slower)
 * - Change cell states to simple integers? (Actually seems to be slower)
 *   - State stored in 1 byte.
 *     Ex. 0b10001000 (136) = alive, with 8 neighbours.
 *     - Top bit is alive state.
 *       - 0b10001000 (136) >> 7 = 1 (alive) | 0 (dead)
 *     - Rest of bits are neighbours.
 *       - 0b10001000 (136) | 0b1111 (15) = 1-8 (neighbours)
 * - Get B0/S8 rules working.
 *   - Requires alternating rules functions.
 * - Add errors/error handling.
 *
 */


//==============================================================================
// Constants
//==============================================================================

const KEY_ALIVE      = 'alive';
const KEY_NEIGHBOURS = 'neighbours';

const DEFAULT_RULE = 'B3/S23';  // Conway's Life


//==============================================================================
// Life Class
//==============================================================================

class Life {
    constructor(ruleString=null) {
        this.cells = {};
        
        this.living = 0;
        this.livingStart = 0;
        this.livingMax = 0;
        this.livingMaxGen = 0;
        this.generation = 0;

        this._ruleString = null;
        this._rules = null;
        this._rulesFuncs = null;
        this._rulesFuncKey = 0;
        this._ruleB0 = false;

        this.setRules(ruleString || DEFAULT_RULE);
    }

    // Returns the current cells as an Array.
    cellsArray() {
        let cells = [];
        let x, y;
        for (y in this.cells) {
            for (x in this.cells[y]) {
                cells.push([parseInt(x), parseInt(y)]);
            }
        }
        return cells;
    }

    // Clears the current cells.
    clear(resetGen=false) {
        this.cells = {};
        this.living = 0;
        if (resetGen) {
            this.generation = 0;
            this.livingStart = 0;
            this.livingMax = 0;
            this.livingMaxGen = 0;
        }
    }

    // Turns off (or "kills") a cell.
    killCell(x, y) {
        delete this.cells[y][x];
        this.living--;
    }

    // Calculates the next generation of cells.
    nextGeneration() {
        const nextGen = {};
        const ruleFunc = this._rulesFuncs[this._rulesFuncsKey];
        let x, xx, y, yy, n;

        for (y in this.cells) {
            y = parseInt(y);
            if (!(y in nextGen)) {
                nextGen[y] = {};
            }
            for (x in this.cells[y]) {
                x = parseInt(x);
                if (!(x in nextGen[y])) {
                    nextGen[y][x] = {
                        [KEY_ALIVE]: true,
                        [KEY_NEIGHBOURS]: 0
                    };
                }
                else {
                    nextGen[y][x][KEY_ALIVE] = true;
                }
                for (yy = y - 1; yy < y + 2; yy++) {
                    for (xx = x - 1; xx < x + 2; xx++) {
                        if ((yy != y) || (xx != x)) {
                            if (!(yy in nextGen)) {
                                nextGen[yy] = {};
                            }
                            if (!(xx in nextGen[yy])) {
                                nextGen[yy][xx] = {
                                    [KEY_ALIVE]: false,
                                    [KEY_NEIGHBOURS]: 1
                                };
                            }
                            else {
                                nextGen[yy][xx][KEY_NEIGHBOURS]++;
                            }
                        }
                    }
                }
            }
        }

        this.clear();

        for (y in nextGen) {
            for (x in nextGen[y]) {
                n = nextGen[y][x][KEY_NEIGHBOURS];
                if (ruleFunc(nextGen[y][x])) {
                    this.setCell(x, y, n);
                }
            }
        }

        // this._rulesFuncsKey = (!this.rulesFuncsKey | 0);
        this._rulesFuncsKey = this._rulesB0 ? (!this.rulesFuncsKey | 0) : 0;

        this.generation++;

        this.updateLivingData();
    }

    // Returns the current cells as an RLE string.
    rleString() {
        const cells = this.cells;
        const minCol = cellsMinCol(cells);
        const minRow = cellsMinRow(cells);
        let xKeys = null;
        let yKeys = Object.keys(cells).sort(compareKeys);
        let i, x, lx, y, ly, n, xDiff, yDiff;
        let RLEString = '';
        
        x = (cellsMaxCol(cells) - minCol);
        if (x > 0) x++;
        y = (cellsMaxRow(cells) - minRow);
        if (y > 0) y++;
        
        RLEString += `#R ${ minCol } ${ minRow }\n`;
        RLEString += `x = ${ x }, y = ${ y }, `;
        RLEString += `rule = ${ this._ruleString }\n`;
        
        if (yKeys.length < 1) return RLEString;
        
        ly = yKeys[0];
        
        for (y of yKeys) {
            xKeys = Object.keys(cells[y]).sort(compareKeys);
            xDiff = xKeys[0] - minCol;
            yDiff = y - ly;
            
            if (yDiff > 1) {
                RLEString += (yDiff + '$');
            }
            else if (yDiff == 1) {
                RLEString += '$';
            }
            
            if (xDiff > 1) {
                RLEString += xDiff.toString() + 'b'
            }
            else if (xDiff == 1) {
                RLEString += 'b'
            }
            
            i = 0, n = 0, lx = xKeys[0];
            
            while (i < xKeys.length) {
                x = xKeys[i];
                xDiff = (x - lx);
                if (xDiff == 1) {
                    n++;
                }
                else {
                    if (n > 1) {
                        RLEString += n.toString() + 'o'
                    }
                    else if (n == 1) {
                        RLEString += 'o'
                    }
                    if (xDiff > 2) {
                        RLEString += (xDiff - 1).toString() + 'b'
                    }
                    else if (xDiff > 1) {
                        RLEString += 'b'
                    }
                    n = 1;
                }
                lx = x;
                i++;
            }
            if (n > 1) {
                RLEString += n.toString() + 'o';
            }
            else {
                RLEString += 'o';
            }
            ly = y;
        }
        
        return wrapRLE(RLEString += '!', 70);
    }

    // Reads a given RLE string, setting and placing the appropriate cells, and
    // setting the rulestring.
    readRLEString(RLEString) {
        let cells = this.cells;
        let x, xs, y, ys, i, ii, c, lc, num, shiftX, shiftY;
        let ignore = [' ', '\n'];
        
        let patternStart = RLEString.search(/^((\d*[ob])+\$*)/im);
        let patternShift = RLEString.match(/#R\s+(-*\d+)\s+(-*\d+)/im);
        if (patternShift) {
            shiftX = parseInt(RegExp.$1 || '0');
            shiftY = parseInt(RegExp.$2 || '0');
        }
        else {
            shiftX = 0;
            shiftY = 0;
        }
        
        let ruleString = RLEString.match(/rule\s*=\s*(B\d*\/S\d*)/im);
        if (ruleString) {
            this.setRules(RegExp.$1);
        }
        
        x = 0, y = 0, i = patternStart;

        this.clear(true);
        
        while (i < RLEString.length) {
            c = RLEString[i];
            if (c == '#') {
                while (c != '\n') {
                    c = RLEString[++i];
                }
            }
            else if (!ignore.includes(c)) {
                xs = x + shiftX;
                ys = y + shiftY;
                num = '';
                while (!isNaN(parseInt(c))) {
                    num += c;
                    c = RLEString[++i];
                }
                if (c == 'o') {
                    if (num) {
                        for (ii = 0; ii < parseInt(num); ii++) {
                            this.setCell(xs++, ys);
                            x++;
                        }
                    }
                    else {
                        this.setCell(xs, ys);
                        x++;
                    }
                }
                else if (c == 'b') {
                    if (num) {
                        x += parseInt(num);
                    }
                    else {
                        x++;
                    }
                }
                else if (c == '$') {
                    if (num) {
                        y += parseInt(num);
                    }
                    else {
                        y++;
                    }
                    x = 0;
                }
            }
            i++;
        }
        if (c == 'o') {
            if (num) {
                for (i = 0; i < parseInt(num); i++) {
                    this.setCell(x++, y);
                }
            }
            else {
                this.setCell(x, y);
            }
        }
        this.updateLivingData();
    }

    // Sets a cell at the given position to "alive".
    setCell(x, y, neighbours=0) {
        if (!(y in this.cells)) {
            this.cells[y] = {};
        }

        if (!(x in this.cells[y])) {
            this.living++;
        }

        this.cells[y][x] = {
            [KEY_ALIVE]: true,
            [KEY_NEIGHBOURS]: neighbours
        };

        // this.cells[y][x] = newCell(true, neighbours);
    }

    // Sets the positions in an Object of cell Objects to "alive".
    setCells(cells, clear=true) {
        if (clear) {
            this.clear(true);
        }

        for (let y in cells) {
            for (let x in cells[y]) {
                this.setCell(x, y);
            }
        }
    }

    // Sets an Array of cell positions to "alive".
    // Positions should be Cartesian ([x, y]);
    setCellsArray(cells, clear=true) {
        let i, coords;
        let cellsCopy = cells.slice(0);

        if (clear) {
            this.clear(true);
            this.livingStart = cells.length;
        }

        while (coords = cellsCopy.shift()) {
            this.setCell(...coords);
        }
    }

    // Sets the current rule to the given rulestring.
    setRules(ruleString) {
        this._ruleString = ruleString.trim();
        this._rules = parseRulesString(this._ruleString);
        this._rulesFuncs = newRules3(this._ruleString);
        this._rulesFuncsKey = 0;
        this._ruleB0 = (0 in this._rules.born);
    }

    // Sets the function that handles the current rule.
    setRulesFunction(func) {
        this._isLiving = func;
    }

    // Updates data related to the current number of living cells.
    updateLivingData() {
        if (!this.generation){
            this.livingStart = this.living;
        }
        if (this.living > this.livingMax) {
            this.livingMax = this.living;
            this.livingMaxGen = this.generation;
        }
    }
}


//==============================================================================
// Rule Functions
//==============================================================================

function parseRulesString(ruleString) {
    let born = null, survive = null;

    ruleString.match(/(?:B)(\d+|\b)(?:\/)(?:S)(\d+|\b)/i);

    if (RegExp.$1 == null || RegExp.$2 == null) {
        return false;
    }

    born = Array.from(RegExp.$1).map(b => parseInt(b));
    survive = Array.from(RegExp.$2).map(s => parseInt(s));

    return {born, survive};
}


function newRules(ruleString) {
    let {born, survive} = parseRulesString(ruleString);
    return function(cell) {
        let {alive, neighbours} = cell;
        return (
            (alive && survive.includes(neighbours)) ||
            (!alive && born.includes(neighbours))
        );
    }
}


// TODO: Get B0/S8 rules working. Requires using alternating functions.
function newRules2(ruleString) {
    let {born, survive} = parseRulesString(ruleString);
    let n;
    let ruleFuncs = {};
    if (born.includes(0)) {
        bNums = '12345678';
        sNums = '12345678';
        for (n of born) {
            bnums = bNums.replace(n.toString(), '');
        }
        for (n of survive) {
            snums = sNums.replace(n.toString(), '');
        }
        born = [];
        for (n of sNums) {
            born.push((8 - parseInt(n)));
        }
        survive = [];
        for (n of bNums) {
            survive.push((8 - parseInt(n)));
        }
        if (survive.includes(8)) {
            bNums = '12345678';
            sNums = '12345678';
            for (n of born) {
                bnums = bNums.replace(n.toString(), '');
            }
            for (n of survive) {
                snums = sNums.replace(n.toString(), '');
            }
            born = [];
            for (n of sNums) {
                born.push((8 - parseInt(n)));
            }
            survive = [];
            for (n of bNums) {
                survive.push((8 - parseInt(n)));
            }
            ruleFuncs[0] = function(cell) {
                let {alive, neighbours} = cell;
                return (
                    (alive && survive.includes(neighbours)) ||
                    (!alive && born.includes(neighbours))
                );
            }
            ruleFuncs[1] = null;
        }
        else {
            return;
        }
    }
    else {
        ruleFuncs[0] = function(cell) {
            let {alive, neighbours} = cell;
            return (
                (alive && survive.includes(neighbours)) ||
                (!alive && born.includes(neighbours))
            );
        }
        ruleFuncs[1] = null;
    }
    return ruleFuncs;
}


// TODO: Get B0/S8 rules working. Requires using alternating functions.
function newRules3(ruleString) {
    let {born, survive} = parseRulesString(ruleString);
    let ruleFuncs = {};
    if (born.includes(0)) {
        let n, bornSwap, bornInvert, surviveSwap, surviveInvert;
        bornInvert = [1, 2, 3, 4, 5, 6, 7, 8].filter(x => !born.includes(x));
        surviveInvert = [1, 2, 3, 4, 5, 6, 7, 8].filter(x => !survive.includes(x));
        born = surviveInvert.map(x => (8 - x));
        // survive = bornInvert.map(x => (8 - x));
        if (survive.includes(8)) {
            survive = bornInvert.map(x => (8 - x));
            ruleFuncs[0] = function(cell) {
                let {alive, neighbours} = cell;
                return (
                    (alive && survive.includes(neighbours)) ||
                    (!alive && born.includes(neighbours))
                );
            };
            ruleFuncs[1] = null;
        }
        else {
            survive = bornInvert.map(x => (8 - x));
            ruleFuncs[0] = function(cell) {
                let {alive, neighbours} = cell;
                return (
                    (alive && surviveInvert.includes(neighbours)) ||
                    (!alive && bornInvert.includes(neighbours))
                );
            };
            ruleFuncs[1] = function(cell) {
                let {alive, neighbours} = cell;
                return (
                    (alive && survive.includes(neighbours)) ||
                    (!alive && born.includes(neighbours))
                );
            };
        }
    }
    else {
        ruleFuncs[0] = function(cell) {
            let {alive, neighbours} = cell;
            return (
                (alive && survive.includes(neighbours)) ||
                (!alive && born.includes(neighbours))
            );
        };
        ruleFuncs[1] = null;
    }
    return ruleFuncs;
}


function convertB0Rule(ruleString) {
    return;
}


//==============================================================================
// Pattern Utilities
//==============================================================================

function arrayMaxCol(pattern) {
    return pattern.reduce(
        (previous, coords) => {
            if (coords[0] > previous[0]) {
                return coords;
            }
            return previous;
        }
    )[0];
}


function arrayMinCol(pattern) {
    return pattern.reduce(
        (previous, coords) => {
            if (coords[0] < previous[0]) {
                return coords;
            }
            return previous;
        }
    )[0];
}


function arrayMaxRow(pattern) {
    return pattern.reduce(
        (previous, coords) => {
            if (coords[1] > previous[1]) {
                return coords;
            }
            return previous;
        }
    )[1];
}


function arrayMinRow(pattern) {
    return pattern.reduce(
        (previous, coords) => {
            if (coords[1] < previous[1]) {
                return coords;
            }
            return previous;
        }
    )[0];
}


function cellsMinRow(cells) {
    let cellsKeys = Object.keys(cells);
    if (cellsKeys.length == 0) {
        return 0;
    }
    return Math.min(...cellsKeys);
}


function cellsMaxRow(cells) {
    let cellsKeys = Object.keys(cells);
    if (cellsKeys.length == 0) {
        return 0;
    }
    return Math.max(...cellsKeys);
}


function cellsMinCol(cells) {
    let cellsKeys = Object.keys(cells);
    let y, temp, min = -1;
    if (cellsKeys.length == 0) {
        return 0;
    }
    for (y of cellsKeys) {
        temp = Math.min(...Object.keys(cells[y]));
        if ((min == -1) || (temp < min)) {
            min = temp;
        }
    }
    return min;
}


function cellsMaxCol(cells) {
    let cellsKeys = Object.keys(cells);
    let y, temp, max = -1;
    if (cellsKeys.length == 0) {
        return 0;
    }
    for (y of cellsKeys) {
        temp = Math.max(...Object.keys(cells[y]));
        if ((max == -1) || (temp > max)) {
            max = temp;
        }
    }
    return max;
}


function shiftPattern(pattern, x, y) {
    let cells = {};
    let xx, yy, yMod;
    for (yy in pattern) {
        yMod = yy + y;
        if (!(yMod in cells)) {
            cells[yMod] = {};
        }
        for (xx in pattern) {
            cells[yMod][xx + x] = pattern[yy][xx]; 
        }
    }
    return cells;
}


function shiftPatternArray(pattern, x, y) {
    for (let i = 0; i < pattern.length; i++) {
        pattern[i][0] += x;
        pattern[i][1] += y;
    }
    return pattern;
}


function centerPattern(pattern, columns, rows) {
    const patternColsHalf = Math.floor(cellsMaxCol(pattern) / 2) + 1;
    const patternRowsHalf = Math.floor(cellsMaxRow(pattern) / 2);
    const colsHalf = Math.floor(columns / 2);
    const rowsHalf = Math.floor(rows / 2);
    return shiftPatternArray(
        pattern,
        (colsHalf - patternColsHalf), (rowsHalf - patternRowsHalf)
    );
}


function centerPatternArray(pattern, columns, rows) {
    const patternColsHalf = Math.floor(arrayMaxCol(pattern) / 2) + 1;
    const patternRowsHalf = Math.floor(arrayMaxRow(pattern) / 2);
    const colsHalf = Math.floor(columns / 2);
    const rowsHalf = Math.floor(rows / 2);
    return shiftPatternArray(
        pattern,
        (colsHalf - patternColsHalf), (rowsHalf - patternRowsHalf)
    );
}


//==============================================================================
// RLE Utilities
//==============================================================================

function compareKeys(a, b) {
    a = parseInt(a);
    b = parseInt(b);
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}


function wrapRLE(RLEString, width) {
    let newText = '';
    let c, lc, i, j, w = 0;
    let widthMod = width - 1;
    let RLELength = RLEString.length;

    i = RLEString.search(/\n((\d*[ob])+\$*)/im) + 1;
    j = i;

    newText += RLEString.slice(0, i);

    while (i < RLELength) {
        while ((i < RLELength) && (w < width - 2)) {
            i++;
            w++;
        }
        while (!isNaN(parseInt(RLEString[i]))) {
            i--;
        }
        i++;
        newText += RLEString.slice(j, i) + '\n';
        j = i;
        w = 0;
    }
    return newText;
}

