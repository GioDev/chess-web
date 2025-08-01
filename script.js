const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');

const VERSION = '1.3.0';

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
let legalMovesForSelectedPiece = [];
let moveHistory = [];
let currentPlayer = 'white'; // 'white' or 'black'
let gameOver = false;
let enPassantTarget = null; // {row, col} of the pawn that can be captured
let castlingRights = {
    white: {kingSide: true, queenSide: true},
    black: {kingSide: true, queenSide: true}
};

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

function resetGame() {
    board = initialBoard.map(row => [...row]);
    selectedPiece = null;
    selectedPos = null;
    legalMovesForSelectedPiece = [];
    moveHistory = [];
    currentPlayer = 'white';
    gameOver = false;
    enPassantTarget = null;
    castlingRights = {
        white: {kingSide: true, queenSide: true},
        black: {kingSide: true, queenSide: true}
    };
    updateMoveHistoryDisplay();
    drawBoard();
}

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

            // Highlight legal moves
            if (legalMovesForSelectedPiece.some(move => move.end.row === row && move.end.col === col)) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.4)'; // Green with transparency
                ctx.beginPath();
                ctx.arc(col * SQUARE_SIZE + SQUARE_SIZE / 2, row * SQUARE_SIZE + SQUARE_SIZE / 2, SQUARE_SIZE / 5, 0, 2 * Math.PI);
                ctx.fill();
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

function isSquareAttacked(pos, attackerPlayer, currentBoard) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = currentBoard[r][c];
            if (piece !== ' ') {
                const isAttackerPiece = (attackerPlayer === 'white' && piece === piece.toUpperCase()) ||
                                      (attackerPlayer === 'black' && piece === piece.toLowerCase());
                if (isAttackerPiece) {
                    if (isValidMove({row: r, col: c}, pos, attackerPlayer, currentBoard, false)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
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

    // --- Start of new logic ---
    let isPseudoLegal = false;
    const pieceType = piece.toLowerCase();

    // Determine if the move is pseudo-legal (follows piece rules, ignoring checks for now)
    switch (pieceType) {
        case 'p': // Pawn
            if (player === 'white') {
                if (endCol === startCol && endRow === startRow - 1 && targetPiece === ' ') isPseudoLegal = true;
                else if (startRow === 6 && endCol === startCol && endRow === startRow - 2 && targetPiece === ' ' && currentBoard[startRow - 1][startCol] === ' ') isPseudoLegal = true;
                else if (Math.abs(endCol - startCol) === 1 && endRow === startRow - 1 && targetPiece !== ' ' && !isTargetWhitePiece) isPseudoLegal = true;
                else if (enPassantTarget && endRow === enPassantTarget.row && endCol === enPassantTarget.col && Math.abs(startCol - endCol) === 1 && endRow === startRow - 1) isPseudoLegal = true; // En passant capture
            } else { // Black pawn
                if (endCol === startCol && endRow === startRow + 1 && targetPiece === ' ') isPseudoLegal = true;
                else if (startRow === 1 && endCol === startCol && endRow === startRow + 2 && targetPiece === ' ' && currentBoard[startRow + 1][startCol] === ' ') isPseudoLegal = true;
                else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + 1 && targetPiece !== ' ' && isTargetWhitePiece) isPseudoLegal = true;
                else if (enPassantTarget && endRow === enPassantTarget.row && endCol === enPassantTarget.col && Math.abs(startCol - endCol) === 1 && endRow === startRow + 1) isPseudoLegal = true; // En passant capture
            }
            break;
        case 'r': // Rook
            if ((startRow === endRow || startCol === endCol) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'n': // Knight
            const drKnight = Math.abs(startRow - endRow);
            const dcKnight = Math.abs(startCol - endCol);
            if ((drKnight === 1 && dcKnight === 2) || (drKnight === 2 && dcKnight === 1)) isPseudoLegal = true;
            break;
        case 'b': // Bishop
            if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'q': // Queen
            if (((startRow === endRow || startCol === endCol) || (Math.abs(startRow - endRow) === Math.abs(startCol - endCol))) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'k': // King
            const drKing = Math.abs(startRow - endRow);
            const dcKing = Math.abs(startCol - endCol);
            if (drKing <= 1 && dcKing <= 1) {
                isPseudoLegal = true;
            } else if (dcKing === 2 && drKing === 0) { // Castling
                if (isInCheck(player, currentBoard)) break; // Cannot castle out of check

                if (player === 'white' && castlingRights.white.kingSide && endCol === 6) { // White king-side
                    if (currentBoard[7][5] === ' ' && currentBoard[7][6] === ' ' &&
                        !isSquareAttacked({row: 7, col: 5}, 'black', currentBoard) &&
                        !isSquareAttacked({row: 7, col: 6}, 'black', currentBoard)) {
                        isPseudoLegal = true;
                    }
                } else if (player === 'white' && castlingRights.white.queenSide && endCol === 2) { // White queen-side
                    if (currentBoard[7][1] === ' ' && currentBoard[7][2] === ' ' && currentBoard[7][3] === ' ' &&
                        !isSquareAttacked({row: 7, col: 2}, 'black', currentBoard) &&
                        !isSquareAttacked({row: 7, col: 3}, 'black', currentBoard)) {
                        isPseudoLegal = true;
                    }
                } else if (player === 'black' && castlingRights.black.kingSide && endCol === 6) { // Black king-side
                    if (currentBoard[0][5] === ' ' && currentBoard[0][6] === ' ' &&
                        !isSquareAttacked({row: 0, col: 5}, 'white', currentBoard) &&
                        !isSquareAttacked({row: 0, col: 6}, 'white', currentBoard)) {
                        isPseudoLegal = true;
                    }
                } else if (player === 'black' && castlingRights.black.queenSide && endCol === 2) { // Black queen-side
                    if (currentBoard[0][1] === ' ' && currentBoard[0][2] === ' ' && currentBoard[0][3] === ' ' &&
                        !isSquareAttacked({row: 0, col: 2}, 'white', currentBoard) &&
                        !isSquareAttacked({row: 0, col: 3}, 'white', currentBoard)) {
                        isPseudoLegal = true;
                    }
                }
            }
            break;
        default:
            isPseudoLegal = false;
            break;
    }

    if (!isPseudoLegal) {
        return false;
    }
    // --- End of new logic ---


    // Check if the move puts the current player's king in check
    if (checkSelfCheck) {
        // Simulate the move
        const simulatedBoard = currentBoard.map(row => [...row]); // Deep copy
        simulatedBoard[endRow][endCol] = piece;
        simulatedBoard[startRow][startCol] = ' ';

        if (isInCheck(player, simulatedBoard)) {
            return false; // Move is illegal because it results in self-check
        }
    }

    return true;
}

// --- Pawn Promotion Logic ---
function displayPromotionChoice(player) {
    return new Promise(resolve => {
        // Clear previous drawings and draw a semi-transparent overlay
        drawBoard(); // Redraw board first
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const promotionOptions = ['Q', 'R', 'B', 'N'];
        const displayPieces = (player === 'white') ? promotionOptions : promotionOptions.map(p => p.toLowerCase());

        const boxWidth = SQUARE_SIZE * promotionOptions.length;
        const boxHeight = SQUARE_SIZE;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = (canvas.height - boxHeight) / 2;

        ctx.fillStyle = '#CCC';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        const optionRects = [];
        displayPieces.forEach((pieceChar, i) => {
            const imageKey = (player === 'white') ? 'w' + pieceChar.toLowerCase() : 'b' + pieceChar.toLowerCase();
            const img = PIECE_IMAGES[imageKey];
            const x = boxX + i * SQUARE_SIZE;
            const y = boxY;
            ctx.drawImage(img, x, y, SQUARE_SIZE, SQUARE_SIZE);
            optionRects.push({piece: pieceChar, rect: {x: x, y: y, width: SQUARE_SIZE, height: SQUARE_SIZE}});
        });

        const clickHandler = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            for (const option of optionRects) {
                if (mouseX >= option.rect.x && mouseX <= (option.rect.x + option.rect.width) &&
                    mouseY >= option.rect.y && mouseY <= (option.rect.y + option.rect.height)) {
                    canvas.removeEventListener('click', clickHandler);
                    resolve(option.piece);
                    return;
                }
            }
        };
        canvas.addEventListener('click', clickHandler);
    });
}

async function handlePawnPromotion(endPos, player) {
    const piece = board[endPos.row][endPos.col];
    if (piece.toLowerCase() === 'p') {
        if ((player === 'white' && endPos.row === 0) || (player === 'black' && endPos.row === BOARD_SIZE - 1)) {
            const chosenPiece = await displayPromotionChoice(player);
            board[endPos.row][endPos.col] = chosenPiece;
            drawBoard(); // Redraw after promotion
            return true;
        }
    }
    return false;
}

const pawnEvalWhite = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0, 1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];

const pawnEvalBlack = pawnEvalWhite.slice().reverse();

const knightEval = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];

const bishopEvalWhite = [
    [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [ -1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [ -1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [ -1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [ -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [ -1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [ -2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];

const bishopEvalBlack = bishopEvalWhite.slice().reverse();

const rookEvalWhite = [
    [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [  0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [ -0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [  0.0,   0.0, 0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
];

const rookEvalBlack = rookEvalWhite.slice().reverse();

const queenEval = [
    [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [ -1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [ -1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [ -0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [  0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [ -1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [ -1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
    [ -2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];

const kingEvalWhite = [
    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [ -3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [ -2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [ -1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [  2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0 ],
    [  2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0 ]
];

const kingEvalBlack = kingEvalWhite.slice().reverse();

function getPieceValue(piece, row, col) {
    if (!piece || piece === ' ') return 0;
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    let positionalValue = 0;

    switch (pieceType) {
        case 'p': 
            positionalValue = isWhite ? pawnEvalWhite[row][col] : pawnEvalBlack[row][col];
            return 10 + positionalValue;
        case 'n': 
            positionalValue = knightEval[row][col];
            return 30 + positionalValue;
        case 'b': 
            positionalValue = isWhite ? bishopEvalWhite[row][col] : bishopEvalBlack[row][col];
            return 30 + positionalValue;
        case 'r': 
            positionalValue = isWhite ? rookEvalWhite[row][col] : rookEvalBlack[row][col];
            return 50 + positionalValue;
        case 'q': 
            positionalValue = queenEval[row][col];
            return 90 + positionalValue;
        case 'k': 
            positionalValue = isWhite ? kingEvalWhite[row][col] : kingEvalBlack[row][col];
            return 900 + positionalValue;
        default: return 0;
    }
}

function evaluateBoard(currentBoard) {
    let totalScore = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = currentBoard[row][col];
            if (piece !== ' ') {
                const value = getPieceValue(piece, row, col);
                const isWhite = piece === piece.toUpperCase();
                if (isWhite) {
                    totalScore += value;
                } else {
                    totalScore -= value;
                }
            }
        }
    }
    // The evaluation must be from the perspective of the AI player (black)
    // A positive score should be good for the AI, negative for the human.
    // Since white is positive and black is negative in totalScore, we negate it for black's perspective.
    return -totalScore;
}

// --- Game State and End Conditions ---
function getLegalMoves(player, currentBoard) {
    const legalMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = currentBoard[r][c];
            if (piece !== ' ') {
                const isWhitePiece = piece === piece.toUpperCase();
                if ((player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece)) {
                    for (let endR = 0; endR < BOARD_SIZE; endR++) {
                        for (let endC = 0; endC < BOARD_SIZE; endC++) {
                            if (isValidMove({row: r, col: c}, {row: endR, col: endC}, player, currentBoard, true)) {
                                legalMoves.push({start: {row: r, col: c}, end: {row: endR, col: endC}});
                            }
                        }
                    }
                }
            }
        }
    }
    return legalMoves;
}

function checkGameEnd() {
    console.log(`Checking game end for ${currentPlayer}...`);
    const legalMovesForNextPlayer = getLegalMoves(currentPlayer, board);
    console.log(`Legal moves for ${currentPlayer}: ${legalMovesForNextPlayer.length}`);
    const inCheck = isInCheck(currentPlayer, board);
    console.log(`${currentPlayer} is in check: ${inCheck}`);

    if (legalMovesForNextPlayer.length === 0) {
        if (inCheck) {
            displayMessage(`${currentPlayer.toUpperCase()} is in Checkmate! ${ (currentPlayer === 'white') ? 'Black' : 'White'} wins!`);
        } else {
            displayMessage("Stalemate! It's a draw!");
        }
        gameOver = true;
        saveGame();
    }
}

function displayMessage(message) {
    // Draw a semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function toChessNotation(pos) {
    const col = String.fromCharCode('a'.charCodeAt(0) + pos.col);
    const row = 8 - pos.row;
    return `${col}${row}`;
}

function recordMove(startPos, endPos, piece) {
    const moveNumber = Math.floor(moveHistory.length / 2) + 1;
    const playerColor = (piece === piece.toUpperCase()) ? 'White' : 'Black';
    const moveString = `${toChessNotation(startPos)} to ${toChessNotation(endPos)}`;

    if (playerColor === 'White') {
        moveHistory.push(`${moveNumber}. ${moveString}`);
    } else {
        // If the last move was white's, append black's move to the same line.
        if (moveHistory.length > 0 && !moveHistory[moveHistory.length - 1].includes('...')) {
            moveHistory[moveHistory.length - 1] += ` ... ${moveString}`;
        } else {
            moveHistory.push(`${moveNumber}. ... ${moveString}`);
        }
    }
    updateMoveHistoryDisplay();
}

function updateMoveHistoryDisplay() {
    const historyContainer = document.getElementById('move-history');
    if (!historyContainer) return;
    historyContainer.innerHTML = ''; // Clear previous history
    moveHistory.forEach(move => {
        const moveElement = document.createElement('p');
        moveElement.textContent = move;
        historyContainer.appendChild(moveElement);
    });
    // Auto-scroll to the bottom
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

// --- AI Logic ---
async function makeAIMove() {
    // AI is always black in this implementation
    const depth = 3; // Search depth
    const bestMove = findBestMove(depth, board, 'black');

    if (bestMove) {
        const startPos = bestMove.start;
        const endPos = bestMove.end;
        const pieceToMove = board[startPos.row][startPos.col];

        recordMove(startPos, endPos, pieceToMove);

        // --- Handle Special Moves --- 

        // 1. En Passant
        if (pieceToMove.toLowerCase() === 'p' && enPassantTarget && endPos.row === enPassantTarget.row && endPos.col === enPassantTarget.col) {
            const capturedPawnRow = (currentPlayer === 'white') ? endPos.row + 1 : endPos.row - 1;
            board[capturedPawnRow][endPos.col] = ' '; // Remove the captured pawn
        }

        // 2. Castling
        if (pieceToMove.toLowerCase() === 'k' && Math.abs(startPos.col - endPos.col) === 2) {
            if (endPos.col === 6) { // King-side
                const rook = board[startPos.row][7];
                board[startPos.row][5] = rook;
                board[startPos.row][7] = ' ';
            } else { // Queen-side
                const rook = board[startPos.row][0];
                board[startPos.row][3] = rook;
                board[startPos.row][0] = ' ';
            }
        }

        // --- Update State --- 

        // Reset en passant target each turn
        enPassantTarget = null;
        // Set new en passant target if a pawn moved two squares
        if (pieceToMove.toLowerCase() === 'p' && Math.abs(startPos.row - endPos.row) === 2) {
            enPassantTarget = {row: (startPos.row + endPos.row) / 2, col: startPos.col};
        }

        // Update castling rights if a king or rook moves
        if (pieceToMove === 'K') {
            castlingRights.white.kingSide = false;
            castlingRights.white.queenSide = false;
        } else if (pieceToMove === 'k') {
            castlingRights.black.kingSide = false;
            castlingRights.black.queenSide = false;
        } else if (pieceToMove === 'R' && startPos.row === 7 && startPos.col === 7) {
            castlingRights.white.kingSide = false;
        } else if (pieceToMove === 'R' && startPos.row === 7 && startPos.col === 0) {
            castlingRights.white.queenSide = false;
        } else if (pieceToMove === 'r' && startPos.row === 0 && startPos.col === 7) {
            castlingRights.black.kingSide = false;
        } else if (pieceToMove === 'r' && startPos.row === 0 && startPos.col === 0) {
            castlingRights.black.queenSide = false;
        }

        // --- Make the Move & Continue Game --- 

        board[endPos.row][endPos.col] = pieceToMove;
        board[startPos.row][startPos.col] = ' ';

        const promoted = await handlePawnPromotion(endPos, currentPlayer);
        if (!promoted) {
            drawBoard();
        }

        currentPlayer = 'white'; // Switch back to human player
        checkGameEnd();
    } else {
        checkGameEnd(); // No legal moves, check for checkmate/stalemate
    }
}

function findBestMove(depth, currentBoard, player) {
    let bestMove = null;
    let bestScore = -Infinity;

    const legalMoves = getLegalMoves(player, currentBoard);
    // Shuffle moves to add some unpredictability
    legalMoves.sort(() => Math.random() - 0.5);

    for (const move of legalMoves) {
        const simulatedBoard = simulateMove(currentBoard, move);
        const score = minimax(depth - 1, simulatedBoard, -Infinity, Infinity, false); // false because it's now opponent's turn

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(depth, currentBoard, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard(currentBoard);
    }

    const player = isMaximizingPlayer ? 'black' : 'white';
    const legalMoves = getLegalMoves(player, currentBoard);

    if (legalMoves.length === 0) {
        if (isInCheck(player, currentBoard)) {
            return isMaximizingPlayer ? -10000 : 10000; // Checkmate
        } else {
            return 0; // Stalemate
        }
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of legalMoves) {
            const simulatedBoard = simulateMove(currentBoard, move);
            const evalScore = minimax(depth - 1, simulatedBoard, alpha, beta, false);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return maxEval;
    } else { // Minimizing player (white)
        let minEval = Infinity;
        for (const move of legalMoves) {
            const simulatedBoard = simulateMove(currentBoard, move);
            const evalScore = minimax(depth - 1, simulatedBoard, alpha, beta, true);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}

function simulateMove(board, move) {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.start.row][move.start.col];
    newBoard[move.end.row][move.end.col] = piece;
    newBoard[move.start.row][move.start.col] = ' ';
    return newBoard;
}

canvas.addEventListener('click', async (event) => {
    if (gameOver) return; // Prevent clicks after game ends
    if (currentPlayer === 'black') return; // Prevent human clicks during AI turn

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
                legalMovesForSelectedPiece = getLegalMoves(currentPlayer, board).filter(move => move.start.row === clickedRow && move.start.col === clickedCol);
                drawBoard(); // Redraw to show selection and legal moves
            } else {
                console.log("Not your piece!");
            }
        } else {
            console.log("Clicked on an empty square, no piece selected.");
        }
    } else {
        // A piece is already selected, try to move it
        if (isValidMove(selectedPos, {row: clickedRow, col: clickedCol}, currentPlayer, board)) {
            const pieceToMove = board[selectedPos.row][selectedPos.col];
            const targetPiece = board[clickedRow][clickedCol];
            const startPos = selectedPos;
            const endPos = {row: clickedRow, col: clickedCol};

            // --- Handle Special Moves --- 

            // 1. En Passant
            if (pieceToMove.toLowerCase() === 'p' && enPassantTarget && endPos.row === enPassantTarget.row && endPos.col === enPassantTarget.col) {
                const capturedPawnRow = (currentPlayer === 'white') ? endPos.row + 1 : endPos.row - 1;
                board[capturedPawnRow][endPos.col] = ' '; // Remove the captured pawn
            }

            // 2. Castling
            if (pieceToMove.toLowerCase() === 'k' && Math.abs(startPos.col - endPos.col) === 2) {
                if (endPos.col === 6) { // King-side
                    const rook = board[startPos.row][7];
                    board[startPos.row][5] = rook;
                    board[startPos.row][7] = ' ';
                } else { // Queen-side
                    const rook = board[startPos.row][0];
                    board[startPos.row][3] = rook;
                    board[startPos.row][0] = ' ';
                }
            }

            // --- Update State --- 

            // Reset en passant target each turn
            enPassantTarget = null;
            // Set new en passant target if a pawn moved two squares
            if (pieceToMove.toLowerCase() === 'p' && Math.abs(startPos.row - endPos.row) === 2) {
                enPassantTarget = {row: (startPos.row + endPos.row) / 2, col: startPos.col};
            }

            // Update castling rights if a king or rook moves
            if (pieceToMove === 'K') {
                castlingRights.white.kingSide = false;
                castlingRights.white.queenSide = false;
            } else if (pieceToMove === 'k') {
                castlingRights.black.kingSide = false;
                castlingRights.black.queenSide = false;
            } else if (pieceToMove === 'R' && startPos.row === 7 && startPos.col === 7) {
                castlingRights.white.kingSide = false;
            } else if (pieceToMove === 'R' && startPos.row === 7 && startPos.col === 0) {
                castlingRights.white.queenSide = false;
            } else if (pieceToMove === 'r' && startPos.row === 0 && startPos.col === 7) {
                castlingRights.black.kingSide = false;
            } else if (pieceToMove === 'r' && startPos.row === 0 && startPos.col === 0) {
                castlingRights.black.queenSide = false;
            }

            // --- Make the Move & Continue Game --- 

            recordMove(startPos, endPos, pieceToMove);

            board[endPos.row][endPos.col] = pieceToMove;
            board[startPos.row][startPos.col] = ' ';

            const promoted = await handlePawnPromotion(endPos, currentPlayer);
            if (!promoted) {
                drawBoard();
            }

            selectedPiece = null;
            selectedPos = null;
            legalMovesForSelectedPiece = [];
            currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
            checkGameEnd();

            if (!gameOver && currentPlayer === 'black') {
                makeAIMove();
            }

        } else {
            console.log("Invalid move!");
            // If the click was on another of the player's own pieces, select that piece instead.
            if (clickedPiece !== ' ') {
                const isWhitePiece = clickedPiece === clickedPiece.toUpperCase();
                if ((currentPlayer === 'white' && isWhitePiece) || (currentPlayer === 'black' && !isWhitePiece)) {
                    selectedPiece = clickedPiece;
                    selectedPos = {row: clickedRow, col: clickedCol};
                    legalMovesForSelectedPiece = getLegalMoves(currentPlayer, board).filter(move => move.start.row === clickedRow && move.start.col === clickedCol);
                    drawBoard(); // Redraw to show the new selection
                }
            } else {
                // Otherwise, deselect the piece.
                selectedPiece = null;
                selectedPos = null;
                legalMovesForSelectedPiece = []; // Clear legal moves
                drawBoard();
            }
        }
    }
});


// --- Testing Function ---
window.setTestPosition = function(newBoard, newPlayer) {
    board = newBoard.map(row => [...row]); // Deep copy
    currentPlayer = newPlayer;
    gameOver = false;
    selectedPiece = null;
    selectedPos = null;
    
    // We need to re-evaluate the game state
    const inCheck = isInCheck(currentPlayer, board);
    const legalMoves = getLegalMoves(currentPlayer, board);

    console.log(`--- Test Position Set for ${newPlayer} ---`);
    console.log(`Is ${newPlayer} in check?`, inCheck);
    console.log(`Number of legal moves for ${newPlayer}:`, legalMoves.length);

    if (legalMoves.length === 0) {
        if (inCheck) {
            console.log("STATE: CHECKMATE");
        } else {
            console.log("STATE: STALEMATE");
        }
        gameOver = true;
    } else {
        console.log("STATE: Game on");
    }
    
    drawBoard();
}

function setVersion() {
    const versionSpan = document.getElementById('version-info');
    if (versionSpan) {
        versionSpan.textContent = `v${VERSION}`;
    }
}



loadImages(() => {
    drawBoard();
    setVersion();
    document.getElementById('new-game-btn').addEventListener('click', resetGame);
    document.getElementById('save-game-btn').addEventListener('click', saveGame);
    loadSavedGames();
});

function saveGame() {
    if (moveHistory.length === 0) {
        alert("Please make at least one move before saving the game.");
        return;
    }
    const savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];
    const gameData = {
        date: new Date().toLocaleString(),
        moveHistory: moveHistory,
        board: board,
        currentPlayer: currentPlayer,
        gameOver: gameOver,
        enPassantTarget: enPassantTarget,
        castlingRights: castlingRights
    };
    savedGames.push(gameData);
    localStorage.setItem('savedChessGames', JSON.stringify(savedGames));
    loadSavedGames(); // Refresh the list
}

function loadSavedGames() {
    const savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];
    const gamesList = document.getElementById('games-list');
    gamesList.innerHTML = '';

    savedGames.reverse().forEach((game, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Game from ${game.date}`;
        
        const loadGameBtn = document.createElement('button');
        loadGameBtn.textContent = 'Load Game';
        loadGameBtn.onclick = () => {
            board = game.board;
            moveHistory = game.moveHistory;
            currentPlayer = game.currentPlayer;
            gameOver = game.gameOver;
            enPassantTarget = game.enPassantTarget;
            castlingRights = game.castlingRights;
            updateMoveHistoryDisplay();
            drawBoard();
        };

        listItem.appendChild(loadGameBtn);
        gamesList.appendChild(listItem);
    });
}



