import * as C from './constants.js';
import * as Board from './board.js';
import * as UI from './ui.js';
import { findBestMove } from './ai.js';

export let gameState = {};

function createInitialState() {
    return {
        board: C.initialBoard.map(row => [...row]),
        selectedPiece: null,
        selectedPos: null,
        legalMovesForSelectedPiece: [],
        moveHistory: [],
        currentPlayer: 'white',
        gameOver: false,
        enPassantTarget: null,
        castlingRights: {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        },
        isAIThinking: false,
        aiDepth: 3 // Default AI depth
    };
}

export function resetGame() {
    Object.assign(gameState, createInitialState());
    UI.updateMoveHistoryDisplay();
    UI.drawBoard();
}

function checkGameEnd() {
    const legalMoves = Board.getLegalMoves(gameState.currentPlayer, gameState.board, gameState.castlingRights, gameState.enPassantTarget);
    if (legalMoves.length === 0) {
        const inCheck = Board.isInCheck(gameState.currentPlayer, gameState.board, gameState.castlingRights, gameState.enPassantTarget);
        if (inCheck) {
            UI.displayMessage(`${gameState.currentPlayer.toUpperCase()} is in Checkmate!`);
        } else {
            UI.displayMessage("Stalemate! It's a draw!");
        }
        gameState.gameOver = true;
    }
}

async function makeAIMove() {
    gameState.isAIThinking = true;
    UI.showThinkingIndicator(true);

    // Use a timeout to allow the UI to update before the AI calculation starts
    setTimeout(async () => {
        const bestMove = findBestMove(gameState.aiDepth, gameState.board, 'black', gameState.castlingRights, gameState.enPassantTarget);

        if (bestMove) {
            await makeMove(bestMove.start, bestMove.end);
        } else {
            checkGameEnd();
        }

        gameState.isAIThinking = false;
        UI.showThinkingIndicator(false);
    }, 100); // A short delay
}

function updateCastlingRights(piece, startPos) {
    if (piece === 'K') {
        gameState.castlingRights.white.kingSide = false;
        gameState.castlingRights.white.queenSide = false;
    } else if (piece === 'k') {
        gameState.castlingRights.black.kingSide = false;
        gameState.castlingRights.black.queenSide = false;
    } else if (piece === 'R' && startPos.row === 7) {
        if (startPos.col === 0) gameState.castlingRights.white.queenSide = false;
        if (startPos.col === 7) gameState.castlingRights.white.kingSide = false;
    } else if (piece === 'r' && startPos.row === 0) {
        if (startPos.col === 0) gameState.castlingRights.black.queenSide = false;
        if (startPos.col === 7) gameState.castlingRights.black.kingSide = false;
    }
}

function toChessNotation(pos) {
    const col = String.fromCharCode('a'.charCodeAt(0) + pos.col);
    const row = 8 - pos.row;
    return `${col}${row}`;
}

function recordMove(startPos, endPos, piece) {
    const moveNumber = Math.floor(gameState.moveHistory.length / 2) + 1;
    const playerColor = (piece === piece.toUpperCase()) ? 'White' : 'Black';
    const moveString = `${toChessNotation(startPos)} to ${toChessNotation(endPos)}`;

    if (playerColor === 'White') {
        gameState.moveHistory.push(`${moveNumber}. ${moveString}`);
    } else {
        if (gameState.moveHistory.length > 0 && !gameState.moveHistory[gameState.moveHistory.length - 1].includes('...')) {
            gameState.moveHistory[gameState.moveHistory.length - 1] += ` ... ${moveString}`;
        } else {
            gameState.moveHistory.push(`${moveNumber}. ... ${moveString}`);
        }
    }
    UI.updateMoveHistoryDisplay();
}

async function handlePawnPromotion(endPos, player) {
    const piece = gameState.board[endPos.row][endPos.col];
    if (piece.toLowerCase() === 'p') {
        if ((player === 'white' && endPos.row === 0) || (player === 'black' && endPos.row === 7)) {
            const chosenPiece = await UI.displayPromotionChoice(player);
            gameState.board[endPos.row][endPos.col] = chosenPiece;
            UI.drawBoard();
            return true;
        }
    }
    return false;
}


async function makeMove(startPos, endPos) {
    const pieceToMove = gameState.board[startPos.row][startPos.col];

    // Handle En Passant
    if (pieceToMove.toLowerCase() === 'p' && gameState.enPassantTarget && endPos.row === gameState.enPassantTarget.row && endPos.col === gameState.enPassantTarget.col) {
        const capturedPawnRow = (gameState.currentPlayer === 'white') ? endPos.row + 1 : endPos.row - 1;
        gameState.board[capturedPawnRow][endPos.col] = ' ';
    }

    // Handle Castling
    if (pieceToMove.toLowerCase() === 'k' && Math.abs(startPos.col - endPos.col) === 2) {
        const rookCol = endPos.col === 6 ? 7 : 0;
        const newRookCol = endPos.col === 6 ? 5 : 3;
        const rook = gameState.board[startPos.row][rookCol];
        gameState.board[startPos.row][newRookCol] = rook;
        gameState.board[startPos.row][rookCol] = ' ';
    }

    // Make the move on the board
    gameState.board[endPos.row][endPos.col] = pieceToMove;
    gameState.board[startPos.row][startPos.col] = ' ';

    recordMove(startPos, endPos, pieceToMove);

    // Update state
    updateCastlingRights(pieceToMove, startPos);
    gameState.enPassantTarget = (pieceToMove.toLowerCase() === 'p' && Math.abs(startPos.row - endPos.row) === 2)
        ? { row: (startPos.row + endPos.row) / 2, col: startPos.col }
        : null;

    // Handle promotion
    await handlePawnPromotion(endPos, gameState.currentPlayer);

    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

    // Reset selection
    gameState.selectedPiece = null;
    gameState.selectedPos = null;
    gameState.legalMovesForSelectedPiece = [];

    UI.drawBoard();
    checkGameEnd();

    if (!gameState.gameOver && gameState.currentPlayer === 'black') {
        await makeAIMove();
    }
}

export function handleSquareClick(pos) {
    const { row, col } = pos;
    const clickedPiece = gameState.board[row][col];

    if (gameState.selectedPiece === null) {
        if (clickedPiece !== ' ') {
            const isWhitePiece = clickedPiece === clickedPiece.toUpperCase();
            if ((gameState.currentPlayer === 'white' && isWhitePiece) || (gameState.currentPlayer === 'black' && !isWhitePiece)) {
                gameState.selectedPiece = clickedPiece;
                gameState.selectedPos = { row, col };
                gameState.legalMovesForSelectedPiece = Board.getLegalMoves(gameState.currentPlayer, gameState.board, gameState.castlingRights, gameState.enPassantTarget)
                    .filter(move => move.start.row === row && move.start.col === col);
                UI.drawBoard();
            }
        }
    } else {
        const isValid = Board.isValidMove(gameState.selectedPos, { row, col }, gameState.currentPlayer, gameState.board, gameState.castlingRights, gameState.enPassantTarget);
        if (isValid) {
            makeMove(gameState.selectedPos, { row, col });
        } else {
            gameState.selectedPiece = null;
            gameState.selectedPos = null;
            gameState.legalMovesForSelectedPiece = [];
            UI.drawBoard();
            // Allow re-selecting another piece
            if (clickedPiece !== ' ' && ((gameState.currentPlayer === 'white' && clickedPiece === clickedPiece.toUpperCase()) || (gameState.currentPlayer === 'black' && clickedPiece === clickedPiece.toLowerCase()))) {
                handleSquareClick(pos);
            }
        }
    }
}

export function saveGame() {
    if (gameState.moveHistory.length === 0) {
        alert("Please make at least one move before saving the game.");
        return;
    }
    const savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];

    // Create a deep copy of the gameState to prevent reference issues
    const gameData = JSON.parse(JSON.stringify({
        date: new Date().toLocaleString(),
        ...gameState
    }));

    savedGames.push(gameData);
    localStorage.setItem('savedChessGames', JSON.stringify(savedGames));
    UI.loadSavedGames();
}

export function loadGame(index) {
    const savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];
    if (savedGames[index]) {
        // Create a deep copy to avoid mutation issues
        const loadedState = JSON.parse(JSON.stringify(savedGames[index]));
        Object.assign(gameState, loadedState);

        UI.updateMoveHistoryDisplay();
        UI.drawBoard();
    }
}

export function deleteGame(index) {
    let savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];
    savedGames.splice(index, 1);
    localStorage.setItem('savedChessGames', JSON.stringify(savedGames));
    UI.loadSavedGames();
}
