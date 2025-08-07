import * as C from './constants.js';
import { initUI, drawBoard } from './ui.js';
import { resetGame } from './game.js';

function loadImages(callback) {
    const pieces = ['bb', 'bk', 'bn', 'bp', 'bq', 'br', 'wb', 'wk', 'wn', 'wp', 'wq', 'wr'];
    let loadedCount = 0;
    const totalPieces = pieces.length;

    pieces.forEach(piece => {
        const img = new Image();
        img.src = `images/${piece}.png`;
        img.onload = () => {
            C.PIECE_IMAGES[piece] = img;
            loadedCount++;
            if (loadedCount === totalPieces) {
                callback();
            }
        };
        img.onerror = () => {
            console.error(`Error loading image: ${img.src}`);
        };
    });
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadImages(() => {
        resetGame(); // This will set up the initial gameState
        initUI();    // This will set up event listeners
        drawBoard(); // This will draw the initial board from the new gameState
    });
});
