# Chess Web Game

A simple, interactive chess game implemented for the web using HTML5 Canvas and JavaScript.

## Table of Contents

- [About](#about)
- [Features](#features)
- [How to Run](#how-to-run)
- [Technologies Used](#technologies-used)
- [Future Enhancements](#future-enhancements)

## About

This project is a basic implementation of a chess game playable directly in a web browser. It provides a visual chessboard, loads chess piece images, and includes fundamental move validation rules for all pieces.

## Features

-   **Interactive Chessboard:** A visually rendered 8x8 chessboard.
-   **Chess Piece Display:** All standard chess pieces are loaded and displayed in their initial positions.
-   **Piece Selection:** Click on your own pieces to select them. Selected pieces are highlighted.
-   **Move Validation:** Implements core chess rules for piece movement (Pawn, Rook, Knight, Bishop, Queen, King). Invalid moves are rejected.
-   **Turn-Based Gameplay:** Supports local two-player gameplay, alternating turns between White and Black.

## How to Run

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GioDev/chess-web.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd chess-web
    ```
3.  **Open `index.html`:**
    Simply open the `index.html` file in your preferred web browser. No web server is required for basic functionality.

## Technologies Used

-   **HTML5:** For the basic structure of the web page and the `<canvas>` element.
-   **CSS3:** For styling the page and the chessboard.
-   **JavaScript (ES6+):** For all the game logic, canvas drawing, and user interaction.

## Future Enhancements

-   **Pawn Promotion:** Implement a UI and logic for pawn promotion when a pawn reaches the opposite side of the board.
-   **Check and Checkmate Detection:** Add full logic to detect when a King is in check, and determine checkmate or stalemate conditions to end the game.
-   **Game State Management:** More robust handling of game states (e.g., game over, draw conditions).
-   **AI Opponent:** Implement a basic AI for single-player mode.
-   **User Interface Improvements:** Enhance the UI with move history, score, and better visual feedback.
-   **Multiplayer:** Integrate WebSocket or other real-time communication for online multiplayer.
