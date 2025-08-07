import * as C from './constants.js';

export function isPathClear(startPos, endPos, currentBoard) {
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

export function findKing(player, currentBoard) {
    const kingPiece = (player === 'white') ? 'K' : 'k';
    for (let r = 0; r < C.BOARD_SIZE; r++) {
        for (let c = 0; c < C.BOARD_SIZE; c++) {
            if (currentBoard[r][c] === kingPiece) {
                return {row: r, col: c};
            }
        }
    }
    return null;
}

// Pass castlingRights and enPassantTarget to avoid circular dependencies
export function isSquareAttacked(pos, attackerPlayer, currentBoard, castlingRights, enPassantTarget) {
    for (let r = 0; r < C.BOARD_SIZE; r++) {
        for (let c = 0; c < C.BOARD_SIZE; c++) {
            const piece = currentBoard[r][c];
            if (piece !== ' ') {
                const isAttackerPiece = (attackerPlayer === 'white' && piece === piece.toUpperCase()) ||
                                      (attackerPlayer === 'black' && piece === piece.toLowerCase());
                if (isAttackerPiece) {
                    if (isValidMove({row: r, col: c}, pos, attackerPlayer, currentBoard, castlingRights, enPassantTarget, false)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

export function isInCheck(player, currentBoard, castlingRights, enPassantTarget) {
    const kingPos = findKing(player, currentBoard);
    if (!kingPos) return false;

    const opponentPlayer = (player === 'white') ? 'black' : 'white';
    return isSquareAttacked(kingPos, opponentPlayer, currentBoard, castlingRights, enPassantTarget);
}

export function isValidMove(startPos, endPos, player, currentBoard, castlingRights, enPassantTarget, checkSelfCheck = true) {
    const startRow = startPos.row;
    const startCol = startPos.col;
    const endRow = endPos.row;
    const endCol = endPos.col;

    const piece = currentBoard[startRow][startCol];
    const targetPiece = currentBoard[endRow][endCol];

    if (startRow === endRow && startCol === endCol) return false;
    if (endRow < 0 || endRow >= C.BOARD_SIZE || endCol < 0 || endCol >= C.BOARD_SIZE) return false;

    const isWhitePiece = piece === piece.toUpperCase();
    const isTargetWhitePiece = targetPiece === targetPiece.toUpperCase();

    if ((player === 'white' && !isWhitePiece) || (player === 'black' && isWhitePiece)) return false;
    if (targetPiece !== ' ' && ((player === 'white' && isTargetWhitePiece) || (player === 'black' && !isTargetWhitePiece))) return false;

    let isPseudoLegal = false;
    const pieceType = piece.toLowerCase();

    switch (pieceType) {
        case 'p':
            if (player === 'white') {
                if (endCol === startCol && endRow === startRow - 1 && targetPiece === ' ') isPseudoLegal = true;
                else if (startRow === 6 && endCol === startCol && endRow === startRow - 2 && targetPiece === ' ' && currentBoard[startRow - 1][startCol] === ' ') isPseudoLegal = true;
                else if (Math.abs(endCol - startCol) === 1 && endRow === startRow - 1 && targetPiece !== ' ' && !isTargetWhitePiece) isPseudoLegal = true;
                else if (enPassantTarget && endRow === enPassantTarget.row && endCol === enPassantTarget.col && Math.abs(startCol - endCol) === 1 && endRow === startRow - 1) isPseudoLegal = true;
            } else {
                if (endCol === startCol && endRow === startRow + 1 && targetPiece === ' ') isPseudoLegal = true;
                else if (startRow === 1 && endCol === startCol && endRow === startRow + 2 && targetPiece === ' ' && currentBoard[startRow + 1][startCol] === ' ') isPseudoLegal = true;
                else if (Math.abs(endCol - startCol) === 1 && endRow === startRow + 1 && targetPiece !== ' ' && isTargetWhitePiece) isPseudoLegal = true;
                else if (enPassantTarget && endRow === enPassantTarget.row && endCol === enPassantTarget.col && Math.abs(startCol - endCol) === 1 && endRow === startRow + 1) isPseudoLegal = true;
            }
            break;
        case 'r':
            if ((startRow === endRow || startCol === endCol) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'n':
            const drKnight = Math.abs(startRow - endRow);
            const dcKnight = Math.abs(startCol - endCol);
            if ((drKnight === 1 && dcKnight === 2) || (drKnight === 2 && dcKnight === 1)) isPseudoLegal = true;
            break;
        case 'b':
            if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'q':
            if (((startRow === endRow || startCol === endCol) || (Math.abs(startRow - endRow) === Math.abs(startCol - endCol))) && isPathClear(startPos, endPos, currentBoard)) isPseudoLegal = true;
            break;
        case 'k':
            const drKing = Math.abs(startRow - endRow);
            const dcKing = Math.abs(startCol - endCol);
            if (drKing <= 1 && dcKing <= 1) {
                isPseudoLegal = true;
            } else if (dcKing === 2 && drKing === 0) { // Castling
                if (isInCheck(player, currentBoard, castlingRights, enPassantTarget)) break;

                const rights = (player === 'white') ? castlingRights.white : castlingRights.black;
                const kingSide = (endCol === 6);
                const queenSide = (endCol === 2);
                const opponent = player === 'white' ? 'black' : 'white';

                if (kingSide && rights.kingSide && currentBoard[startRow][5] === ' ' && currentBoard[startRow][6] === ' ' &&
                    !isSquareAttacked({row: startRow, col: 5}, opponent, currentBoard, castlingRights, enPassantTarget) &&
                    !isSquareAttacked({row: startRow, col: 6}, opponent, currentBoard, castlingRights, enPassantTarget)) {
                    isPseudoLegal = true;
                } else if (queenSide && rights.queenSide && currentBoard[startRow][1] === ' ' && currentBoard[startRow][2] === ' ' && currentBoard[startRow][3] === ' ' &&
                    !isSquareAttacked({row: startRow, col: 2}, opponent, currentBoard, castlingRights, enPassantTarget) &&
                    !isSquareAttacked({row: startRow, col: 3}, opponent, currentBoard, castlingRights, enPassantTarget)) {
                    isPseudoLegal = true;
                }
            }
            break;
    }

    if (!isPseudoLegal) return false;

    if (checkSelfCheck) {
        const simulatedBoard = simulateMove(currentBoard, {start: startPos, end: endPos});
        // For the self-check, the future castling rights don't matter, so we can pass the current ones.
        if (isInCheck(player, simulatedBoard, castlingRights, enPassantTarget)) {
            return false;
        }
    }

    return true;
}

export function simulateMove(board, move) {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.start.row][move.start.col];
    newBoard[move.end.row][move.end.col] = piece;
    newBoard[move.start.row][move.start.col] = ' ';
    return newBoard;
}

export function getLegalMoves(player, currentBoard, castlingRights, enPassantTarget) {
    const legalMoves = [];
    for (let r = 0; r < C.BOARD_SIZE; r++) {
        for (let c = 0; c < C.BOARD_SIZE; c++) {
            const piece = currentBoard[r][c];
            if (piece !== ' ') {
                const isWhitePiece = piece === piece.toUpperCase();
                if ((player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece)) {
                    for (let endR = 0; endR < C.BOARD_SIZE; endR++) {
                        for (let endC = 0; endC < C.BOARD_SIZE; endC++) {
                            if (isValidMove({row: r, col: c}, {row: endR, col: endC}, player, currentBoard, castlingRights, enPassantTarget, true)) {
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
