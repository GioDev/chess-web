import * as C from './constants.js';
import { getLegalMoves, simulateMove, isInCheck } from './board.js';

function getPieceValue(piece, row, col) {
    if (!piece || piece === ' ') return 0;
    const pieceType = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    let positionalValue = 0;

    switch (pieceType) {
        case 'p':
            positionalValue = isWhite ? C.pawnEvalWhite[row][col] : C.pawnEvalBlack[row][col];
            return 10 + positionalValue;
        case 'n':
            positionalValue = C.knightEval[row][col];
            return 30 + positionalValue;
        case 'b':
            positionalValue = isWhite ? C.bishopEvalWhite[row][col] : C.bishopEvalBlack[row][col];
            return 30 + positionalValue;
        case 'r':
            positionalValue = isWhite ? C.rookEvalWhite[row][col] : C.rookEvalBlack[row][col];
            return 50 + positionalValue;
        case 'q':
            positionalValue = C.queenEval[row][col];
            return 90 + positionalValue;
        case 'k':
            positionalValue = isWhite ? C.kingEvalWhite[row][col] : C.kingEvalBlack[row][col];
            return 900 + positionalValue;
        default: return 0;
    }
}

function evaluateBoard(currentBoard) {
    let totalScore = 0;
    for (let row = 0; row < C.BOARD_SIZE; row++) {
        for (let col = 0; col < C.BOARD_SIZE; col++) {
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


function minimax(depth, currentBoard, castlingRights, enPassantTarget, alpha, beta, isMaximizingPlayer) {
    if (depth === 0) {
        return evaluateBoard(currentBoard);
    }

    const player = isMaximizingPlayer ? 'black' : 'white';
    const legalMoves = getLegalMoves(player, currentBoard, castlingRights, enPassantTarget);

    if (legalMoves.length === 0) {
        if (isInCheck(player, currentBoard, castlingRights, enPassantTarget)) {
            return isMaximizingPlayer ? -10000 : 10000; // Checkmate
        } else {
            return 0; // Stalemate
        }
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of legalMoves) {
            const simulatedBoard = simulateMove(currentBoard, move);
            const evalScore = minimax(depth - 1, simulatedBoard, castlingRights, enPassantTarget, alpha, beta, false);
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
            const evalScore = minimax(depth - 1, simulatedBoard, castlingRights, enPassantTarget, alpha, beta, true);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}

export function findBestMove(depth, currentBoard, player, castlingRights, enPassantTarget) {
    let bestMove = null;
    let bestScore = -Infinity;

    const legalMoves = getLegalMoves(player, currentBoard, castlingRights, enPassantTarget);
    // Shuffle moves to add some unpredictability
    legalMoves.sort(() => Math.random() - 0.5);

    for (const move of legalMoves) {
        const simulatedBoard = simulateMove(currentBoard, move);
        // The first call to minimax is for the opponent's turn (minimizing player)
        const score = minimax(depth - 1, simulatedBoard, castlingRights, enPassantTarget, -Infinity, Infinity, false);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}
