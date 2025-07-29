const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');

const BOARD_SIZE = 8;
const SQUARE_SIZE = canvas.width / BOARD_SIZE;

// Colors
const LIGHT_BROWN = '#CD853F';
const DARK_BROWN = '#8B4513';
const HIGHLIGHT_COLOR = 'rgba(255, 255, 0, 0.5)'; // Yellow with transparency

const PIECE_IMAGES = {};

// Initial board setup (same as Python version)
let board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let selectedPiece = null;
let selectedPos = null; // {row, col}
let currentPlayer = 'white'; // 'white' or 'black'

function loadImages(callback) {
    const pieces = ['bb', 'bk', 'bn', 'bp', 'bq', 'br', 'wb', 'wk', 'wn', 'wp', 'wq', 'wr'];
    let loadedCount = 0;
    const totalPieces = pieces.length;

    pieces.forEach(piece => {
        const img = new Image();
        img.src = `images/${piece}.png`;
        img.onload = () => {
            PIECE_IMAGES[piece] = img;
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

function drawBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const color = (row + col) % 2 === 0 ? LIGHT_BROWN : DARK_BROWN;
            ctx.fillStyle = color;
            ctx.fillRect(col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);

            // Highlight selected square
            if (selectedPos && selectedPos.row === row && selectedPos.col === col) {
                ctx.fillStyle = HIGHLIGHT_COLOR;
                ctx.fillRect(col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            }

            const piece = board[row][col];
            if (piece !== ' ') {
                let imageKey;
                if (piece === piece.toUpperCase()) { // It's a white piece
                    imageKey = 'w' + piece.toLowerCase();
                } else { // It's a black piece
                    imageKey = 'b' + piece.toLowerCase();
                }
                
                if (PIECE_IMAGES[imageKey]) {
                    ctx.drawImage(PIECE_IMAGES[imageKey], col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
                } else {
                    console.warn(`Image not found for key: ${imageKey}`);
                }
            }
        }
    }
}

function isPathClear(startPos, endPos, currentBoard) {
    const startRow = startPos.row;
    const startCol = startPos.col;
    const endRow = endPos.row;
    const endCol = endPos.col;

    // Horizontal move
    if (startRow === endRow) {
        const step = (endCol > startCol) ? 1 : -1;
        for (let col = startCol + step; col !== endCol; col += step) {
            if (currentBoard[startRow][col] !== ' ') {
                return false;
            }
        }
        return true;
    }
    // Vertical move
    else if (startCol === endCol) {
        const step = (endRow > startRow) ? 1 : -1;
        for (let row = startRow + step; row !== endRow; row += step) {
            if (currentBoard[row][startCol] !== ' ') {
                return false;
            }
        }
        return true;
    }
    // Diagonal move
    else if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol)) {
        const rowStep = (endRow > startRow) ? 1 : -1;
        const colStep = (endCol > startCol) ? 1 : -1;
        let r = startRow + rowStep;
        let c = startCol + colStep;
        while (r !== endRow) {
            if (currentBoard[r][c] !== ' ') {
                return false;
            }
            r += rowStep;
            c += colStep;
        }
        return true;
    }
    return false; // Not a straight or diagonal move
}

function findKing(player, currentBoard) {
    const kingPiece = (player === 'white') ? 'K' : 'k';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === kingPiece) {
                return {row: r, col: c};
            }
        }
    }
    return null;
}

function isInCheck(player, currentBoard) {
    const kingPos = findKing(player, currentBoard);
    if (!kingPos) return false; // Should not happen in a valid game

    const opponentPlayer = (player === 'white') ? 'black' : 'white';

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = currentBoard[r][c];
            if (piece !== ' ') {
                const isOpponentPiece = (opponentPlayer === 'white' && piece === piece.toUpperCase()) ||
                                        (opponentPlayer === 'black' && piece === piece.toLowerCase());
                if (isOpponentPiece) {
                    // Temporarily set checkForCheck to false to avoid infinite recursion
                    if (isValidMove( {row: r, col: c}, kingPos, opponentPlayer, currentBoard, false)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function isValidMove(startPos, endPos, player, currentBoard, checkSelfCheck = true) {
    const startRow = startPos.row;
    const startCol = startPos.col;
    const endRow = endPos.row;
    const endCol = endPos.col;

    const piece = currentBoard[startRow][startCol];
    const targetPiece = currentBoard[endRow][endCol];

    // Basic checks
    if (startRow === endRow && startCol === endCol) return false; // Cannot move to same square
    if (endRow < 0 || endRow >= BOARD_SIZE || endCol < 0 || endCol >= BOARD_SIZE) return false; // Out of bounds

    const isWhitePiece = piece === piece.toUpperCase();
    const isTargetWhitePiece = targetPiece === targetPiece.toUpperCase();

    // Check if the piece belongs to the current player
    if ((player === 'white' && !isWhitePiece) || (player === 'black' && isWhitePiece)) return false;

    // Check if target square contains own piece
    if (targetPiece !== ' ' && ((player === 'white' && isTargetWhitePiece) || (player === 'black' && !isTargetWhitePiece))) return false;

    // Piece-specific move rules
    const pieceType = piece.toLowerCase();

    switch (pieceType) {
        case 'p': // Pawn
            if (player === 'white') {
                // Single square move
                if (endCol === startCol && endRow === startRow - 1 && targetPiece === ' ') return true;
                // Two square initial move
                if (startRow === 6 && endCol === startCol && endRow === startRow - 2 && targetPiece === ' ' && currentBoard[startRow - 1][startCol] === ' ') return true;
                // Capture
                if (Math.abs(endCol - startCol) === 1 && endRow === startRow - 1 && targetPiece !== ' ' && !isTargetWhitePiece) return true;
            } else { // Black pawn
                // Single square move
                if (endCol === startCol && endRow === startRow + 1 && targetPiece === ' ') return true;
                // Two square initial move
                if (startRow === 1 && endCol === startCol && endRow === startRow + 2 && targetPiece === ' ' && currentBoard[startRow + 1][startCol] === ' ') return true;
                // Capture
                if (Math.abs(endCol - startCol) === 1 && endRow === startRow + 1 && targetPiece !== ' ' && isTargetWhitePiece) return true;
            }
            return false;

        case 'r': // Rook
            if ((startRow === endRow || startCol === endCol) && isPathClear(startPos, endPos, currentBoard)) return true;
            return false;

        case 'n': // Knight
            const drKnight = Math.abs(startRow - endRow);
            const dcKnight = Math.abs(startCol - endCol);
            if ((drKnight === 1 && dcKnight === 2) || (drKnight === 2 && dcKnight === 1)) return true;
            return false;

        case 'b': // Bishop
            if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol) && isPathClear(startPos, endPos, currentBoard)) return true;
            return false;

        case 'q': // Queen
            if (((startRow === endRow || startCol === endCol) || (Math.abs(startRow - endRow) === Math.abs(startCol - endCol))) && isPathClear(startPos, endPos, currentBoard)) return true;
            return false;

        case 'k': // King
            const drKing = Math.abs(startRow - endRow);
            const dcKing = Math.abs(startCol - endCol);
            if (drKing <= 1 && dcKing <= 1) return true;
            return false;

        default:
            return false;
    }

    // Check if the move puts the current player's king in check
    if (checkSelfCheck) {
        // Simulate the move
        const simulatedBoard = board.map(row => [...row]); // Deep copy
        simulatedBoard[endRow][endCol] = piece;
        simulatedBoard[startRow][startCol] = ' ';

        if (isInCheck(player, simulatedBoard)) {
            return false; // Move is illegal because it results in self-check
        }
    }

    return true;
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedCol = Math.floor(mouseX / SQUARE_SIZE);
    const clickedRow = Math.floor(mouseY / SQUARE_SIZE);

    const clickedPiece = board[clickedRow][clickedCol];

    if (selectedPiece === null) {
        // No piece selected, try to select one
        if (clickedPiece !== ' ') {
            const isWhitePiece = clickedPiece === clickedPiece.toUpperCase();
            if ((currentPlayer === 'white' && isWhitePiece) || (currentPlayer === 'black' && !isWhitePiece)) {
                selectedPiece = clickedPiece;
                selectedPos = {row: clickedRow, col: clickedCol};
                drawBoard(); // Redraw to show selection
            } else {
                console.log("Not your piece!");
            }
        } else {
            console.log("Clicked on an empty square, no piece selected.");
        }
    } else {
        // A piece is already selected, try to move it
        if (isValidMove(selectedPos, {row: clickedRow, col: clickedCol}, currentPlayer, board)) {
            // Move the piece
            board[clickedRow][clickedCol] = selectedPiece;
            board[selectedPos.row][selectedPos.col] = ' ';

            selectedPiece = null;
            selectedPos = null;
            currentPlayer = (currentPlayer === 'white') ? 'black' : 'white'; // Switch turns
            drawBoard(); // Redraw after move
            console.log(`Moved piece. Current player: ${currentPlayer}`);
        } else {
            console.log("Invalid move!");
            // If invalid move, deselect the piece or allow re-selection
            if (clickedRow === selectedPos.row && clickedCol === selectedPos.col) {
                selectedPiece = null;
                selectedPos = null;
                drawBoard(); // Deselect
            } else {
                // Optionally, allow selecting a different piece of your own color
                const isWhitePiece = clickedPiece === clickedPiece.toUpperCase();
                if (clickedPiece !== ' ' && ((currentPlayer === 'white' && isWhitePiece) || (currentPlayer === 'black' && !isWhitePiece))) {
                    selectedPiece = clickedPiece;
                    selectedPos = {row: clickedRow, col: clickedCol};
                    drawBoard();
                }
            }
        }
    }
});

loadImages(drawBoard);