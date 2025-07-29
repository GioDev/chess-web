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
let gameOver = false;

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
            } else { // Black pawn
                if (endCol === startCol && endRow === startRow + 1 && targetPiece === ' ') isPseudoLegal = true;
                else if (startRow === 1 && endCol === startCol && endRow === startRow + 2 && targetPiece === ' ' && currentBoard[startRow + 1][startCol] === ' ') isPseudoLegal = true;
                else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + 1 && targetPiece !== ' ' && isTargetWhitePiece) isPseudoLegal = true;
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
            if (drKing <= 1 && dcKing <= 1) isPseudoLegal = true;
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

// --- AI Logic ---
async function makeAIMove() {
    // Small delay for human readability
    await new Promise(resolve => setTimeout(resolve, 500));

    const legalMoves = getLegalMoves(currentPlayer, board);

    if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const startPos = randomMove.start;
        const endPos = randomMove.end;

        const pieceToMove = board[startPos.row][startPos.col];
        const originalTargetPiece = board[endPos.row][endPos.col];

        // Perform the move
        board[endPos.row][endPos.col] = pieceToMove;
        board[startPos.row][startPos.col] = ' ';

        const promoted = await handlePawnPromotion(endPos, currentPlayer);
        if (!promoted) {
            drawBoard(); // Redraw if not promoted (promotion redraws itself)
        }

        currentPlayer = (currentPlayer === 'white') ? 'black' : 'white'; // Switch turns
        checkGameEnd();

        // If it's still the AI's turn (e.g., after promotion), make another move
        if (!gameOver && currentPlayer === 'black') {
            makeAIMove();
        }

    } else {
        checkGameEnd(); // No legal moves, check for checkmate/stalemate
    }
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
            // Simulate the move to check for self-check before actually moving
            const originalPieceAtTarget = board[clickedRow][clickedCol];
            const originalPieceAtStart = board[selectedPos.row][selectedPos.col];

            board[clickedRow][clickedCol] = selectedPiece;
            board[selectedPos.row][selectedPos.col] = ' ';

            if (isInCheck(currentPlayer, board)) {
                // Undo the move if it results in self-check
                board[selectedPos.row][selectedPos.col] = originalPieceAtStart;
                board[clickedRow][clickedCol] = originalPieceAtTarget;
                console.log("Invalid move: King would be in check!");
            } else {
                // Move is valid and does not result in self-check
                const promoted = await handlePawnPromotion({row: clickedRow, col: clickedCol}, currentPlayer);
                if (!promoted) {
                    drawBoard(); // Redraw if not promoted (promotion redraws itself)
                }
                selectedPiece = null;
                selectedPos = null;
                currentPlayer = (currentPlayer === 'white') ? 'black' : 'white'; // Switch turns
                checkGameEnd(); // Check for game end after every move

                if (!gameOver && currentPlayer === 'black') {
                    makeAIMove(); // Trigger AI move if game not over and it's AI's turn
                }
            }
        } else {
            console.log("Invalid move!");
            // If invalid move, deselect the piece or allow re-selection
            if (clickedRow === selectedPos.row && clickedCol === selectedPos.col) {
                selectedPiece = null;
                selectedPos = null;
                drawBoard(); // Deselect
            } else {
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

loadImages(drawBoard);
