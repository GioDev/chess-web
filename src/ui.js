import * as C from './constants.js';
import { gameState, handleSquareClick, resetGame, saveGame, loadGame, deleteGame } from './game.js';

const canvas = document.getElementById('chessCanvas');
const ctx = canvas.getContext('2d');
const newGameBtn = document.getElementById('new-game-btn');
const saveGameBtn = document.getElementById('save-game-btn');
const gamesList = document.getElementById('games-list');
const versionSpan = document.getElementById('version-info');
const thinkingIndicator = document.getElementById('thinking-indicator');
const difficultySelector = document.getElementById('difficulty-selector');

export function initUI() {
    canvas.width = C.BOARD_SIZE * C.SQUARE_SIZE;
    canvas.height = C.BOARD_SIZE * C.SQUARE_SIZE;

    canvas.addEventListener('click', (event) => {
        if (gameState.gameOver || gameState.isAIThinking) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const clickedCol = Math.floor(mouseX / C.SQUARE_SIZE);
        const clickedRow = Math.floor(mouseY / C.SQUARE_SIZE);

        handleSquareClick({ row: clickedRow, col: clickedCol });
    });

    newGameBtn.addEventListener('click', resetGame);
    saveGameBtn.addEventListener('click', saveGame);
    difficultySelector.addEventListener('change', (e) => {
        gameState.aiDepth = parseInt(e.target.value, 10);
    });

    setVersion();
    loadSavedGames();
}

export function drawBoard() {
    for (let row = 0; row < C.BOARD_SIZE; row++) {
        for (let col = 0; col < C.BOARD_SIZE; col++) {
            const color = (row + col) % 2 === 0 ? C.LIGHT_BROWN : C.DARK_BROWN;
            ctx.fillStyle = color;
            ctx.fillRect(col * C.SQUARE_SIZE, row * C.SQUARE_SIZE, C.SQUARE_SIZE, C.SQUARE_SIZE);

            // Highlight selected square
            if (gameState.selectedPos && gameState.selectedPos.row === row && gameState.selectedPos.col === col) {
                ctx.fillStyle = C.HIGHLIGHT_COLOR;
                ctx.fillRect(col * C.SQUARE_SIZE, row * C.SQUARE_SIZE, C.SQUARE_SIZE, C.SQUARE_SIZE);
            }

            // Highlight legal moves
            if (gameState.legalMovesForSelectedPiece.some(move => move.end.row === row && move.end.col === col)) {
                ctx.fillStyle = C.MOVE_HIGHLIGHT_COLOR;
                ctx.beginPath();
                ctx.arc(col * C.SQUARE_SIZE + C.SQUARE_SIZE / 2, row * C.SQUARE_SIZE + C.SQUARE_SIZE / 2, C.SQUARE_SIZE / 5, 0, 2 * Math.PI);
                ctx.fill();
            }

            const piece = gameState.board[row][col];
            if (piece !== ' ') {
                let imageKey = (piece === piece.toUpperCase() ? 'w' : 'b') + piece.toLowerCase();
                if (C.PIECE_IMAGES[imageKey]) {
                    ctx.drawImage(C.PIECE_IMAGES[imageKey], col * C.SQUARE_SIZE, row * C.SQUARE_SIZE, C.SQUARE_SIZE, C.SQUARE_SIZE);
                }
            }
        }
    }
}

export function displayPromotionChoice(player) {
    return new Promise(resolve => {
        drawBoard();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const promotionOptions = ['Q', 'R', 'B', 'N'];
        const displayPieces = (player === 'white') ? promotionOptions : promotionOptions.map(p => p.toLowerCase());

        const boxWidth = C.SQUARE_SIZE * promotionOptions.length;
        const boxHeight = C.SQUARE_SIZE;
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
            const img = C.PIECE_IMAGES[imageKey];
            const x = boxX + i * C.SQUARE_SIZE;
            const y = boxY;
            ctx.drawImage(img, x, y, C.SQUARE_SIZE, C.SQUARE_SIZE);
            optionRects.push({piece: pieceChar, rect: {x: x, y: y, width: C.SQUARE_SIZE, height: C.SQUARE_SIZE}});
        });

        const clickHandler = (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            for (const option of optionRects) {
                if (mouseX >= option.rect.x && mouseX <= (option.rect.x + option.rect.width) &&
                    mouseY >= option.rect.y && mouseY <= (option.rect.y + option.rect.height)) {
                    canvas.removeEventListener('click', clickHandler);
                    initUI(); // Re-attach the main game click listener
                    resolve(option.piece);
                    return;
                }
            }
        };
        // Temporarily remove the main click listener
        canvas.replaceWith(canvas.cloneNode(true));
        canvas.getContext('2d').drawImage(ctx.canvas, 0, 0); // Restore canvas content
        document.getElementById('chessCanvas').addEventListener('click', clickHandler);
    });
}

export function updateMoveHistoryDisplay() {
    const historyContainer = document.getElementById('move-history');
    if (!historyContainer) return;
    historyContainer.innerHTML = '';
    gameState.moveHistory.forEach(move => {
        const moveElement = document.createElement('p');
        moveElement.textContent = move;
        historyContainer.appendChild(moveElement);
    });
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

export function displayMessage(message) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function setVersion() {
    if (versionSpan) {
        versionSpan.textContent = `v${C.VERSION}`;
    }
}

export function loadSavedGames() {
    const savedGames = JSON.parse(localStorage.getItem('savedChessGames')) || [];
    gamesList.innerHTML = '';

    // Reverse the array to show the most recent games first
    const reversedGames = [...savedGames].reverse();

    reversedGames.forEach((game, reversedIndex) => {
        // The actual index in the original savedGames array
        const originalIndex = savedGames.length - 1 - reversedIndex;

        const listItem = document.createElement('li');

        const gameInfo = document.createElement('span');
        gameInfo.textContent = `Game from ${game.date}`;
        listItem.appendChild(gameInfo);

        const btnContainer = document.createElement('div');

        const loadGameBtn = document.createElement('button');
        loadGameBtn.textContent = 'Load';
        loadGameBtn.className = 'btn';
        loadGameBtn.onclick = () => loadGame(originalIndex);
        btnContainer.appendChild(loadGameBtn);

        const deleteGameBtn = document.createElement('button');
        deleteGameBtn.textContent = 'Delete';
        deleteGameBtn.className = 'btn delete-btn';
        deleteGameBtn.onclick = () => deleteGame(originalIndex);
        btnContainer.appendChild(deleteGameBtn);

        listItem.appendChild(btnContainer);
        gamesList.appendChild(listItem);
    });
}

export function showThinkingIndicator(isThinking) {
    thinkingIndicator.style.display = isThinking ? 'block' : 'none';
}
