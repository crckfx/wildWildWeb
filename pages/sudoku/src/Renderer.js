import { coords, H_NEIGHBOUR, H_SAME_NUMBER, H_SELECTED, STATUS_CORRECT, STATUS_ERROR, STATUS_GIVEN } from "./static.js";


function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const selectedCellColor = cssVar("--selectedCellColor");
const neighbourCellColor = cssVar("--neighbourCellColor");
const sameNumberCellColor = cssVar("--sameNumberCellColor");
const gridPrimaryColor = cssVar("--gridPrimaryColor");
const gridSecondaryColor = cssVar("--gridSecondaryColor");
const givenNumberColor = cssVar("--givenNumberColor");
const userNumberColor = cssVar("--userNumberColor");
const errorNumberColor = cssVar("--errorNumberColor");
const sudokuCanvasBg = cssVar("--sudokuCanvasBg");

const thin = 1;
const thick = 2;

export class Renderer {
    constructor({ canvas, game, settings = {} }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.game = game; // assumes game exposes .cells, .cellStatus, .highlightStatus, .coords, etc.

        this.size = 480; // default (currently 'max') canvas size
        this.cell = this.size / 9; // full grid is 9×9

        this.setGameSize();
    }

    setGameSize() {
        // do whatever rule about sizing first
        let size = 480;
        if (window.innerWidth - 48 < size) size = window.innerWidth - 48; // clamp size 
        // set the cell size based on new size
        this.size = size;
        this.cell = size / 9;
        // DO SCALING
        const dpr = window.devicePixelRatio || 1;
        // set canvas css size
        this.canvas.style.width = size + "px";
        this.canvas.style.height = size + "px";
        // set canvas internal size
        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        // scale the pixel-perfect ctx
        this.ctx.scale(dpr, dpr);
    }

    // generic canvas helpers
    drawLine(x1, y1, x2, y2, w) {
        const ctx = this.ctx;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }


    // specific canvas helpers
    drawGridLines() {
        const ctx = this.ctx;
        const size = this.size;
        // draw thin lines
        ctx.strokeStyle = gridSecondaryColor;
        for (let i = 1; i < 9; i++) {
            if (i % 3 !== 0) {
                const pos = this.cell * i;
                // horizontal
                this.drawLine(0, pos, size, pos, thin);
                // vertical
                this.drawLine(pos, 0, pos, size, thin);
            }
        }
        // draw thick lines over top
        ctx.strokeStyle = gridPrimaryColor;
        for (let i = 1; i < 9; i++) {
            if (i % 3 === 0) {
                const pos = this.cell * i;
                // horizontal
                this.drawLine(0, pos, size, pos, thick);
                // vertical
                this.drawLine(pos, 0, pos, size, thick);
            }
        }
        // draw the perimeter box
        ctx.lineWidth = thick;
        ctx.strokeStyle = gridPrimaryColor;
        ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    drawCellBackground(col, row, fill) {
        const ctx = this.ctx;

        const cell = this.cell;

        ctx.fillStyle = fill;
        ctx.fillRect(col * cell, row * cell, cell, cell);
    }

    drawHighlightedCellBorder(currentCell) {
        const ctx = this.ctx;

        const { row, col } = coords[currentCell];

        ctx.lineWidth = thick;
        ctx.strokeStyle = userNumberColor;
        // ctx.strokeRect(1, 1, size - 2, size - 2);

        const cell = this.cell;

        // ctx.fillStyle = fill;
        ctx.strokeRect((col * cell) + 1, (row * cell) + 1, cell - 2, cell - 2);
    }


    drawNumberFromCell(idx) {
        const ctx = this.ctx;
        const value = this.game.cells[idx];
        const cell = this.cell;
        if (value === 0) return;

        const { row, col } = coords[idx];
        const x = Math.floor(col * cell + cell / 2) + 0.5;
        const y = Math.floor(row * cell + cell / 2) + 0.5;

        // choose color based purely on status
        switch (this.game.cellStatus[idx]) {
            case STATUS_GIVEN:
                ctx.fillStyle = givenNumberColor;
                break;
            case STATUS_CORRECT:
                ctx.fillStyle = userNumberColor;
                break;
            case STATUS_ERROR:
                ctx.fillStyle = userNumberColor;
                // if (sudoku_show_errors) {
                //     ctx.fillStyle = errorNumberColor;
                // } else {
                //     ctx.fillStyle = userNumberColor;
                // }
                break;
            default:
                ctx.fillStyle = userNumberColor; // fallback for any future states
        }


        ctx.fillText(String(value), x, y);
    }



    // main draw function
    drawSudoku({ showSelectedCell = true, showHighlighting = true } = {}) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = sudokuCanvasBg;
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${this.cell * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const currentCell = this.game.currentCell;



        if (showSelectedCell) {
            // paint backgrounds first

            if (showHighlighting) {

                for (let i = 0; i < 81; i++) {
                    switch (this.game.highlightStatus[i]) {
                        case H_SELECTED: {
                            // handle separately
                            break;
                        }
                        case H_NEIGHBOUR: {
                            const { row, col } = coords[i];
                            this.drawCellBackground(col, row, neighbourCellColor);
                            break;
                        }
                        case H_SAME_NUMBER: {
                            const { row, col } = coords[i];
                            this.drawCellBackground(col, row, sameNumberCellColor);
                            break;
                        }
                    }
                }
            }

            const { row, col } = coords[currentCell];
            this.drawCellBackground(col, row, selectedCellColor);

        }

        // draw numbers
        for (let i = 0; i < 81; i++) {
            this.drawNumberFromCell(i);
        }
        // final grid overlay
        this.drawGridLines();

        if (showHighlighting) this.drawHighlightedCellBorder(currentCell);
    }

}