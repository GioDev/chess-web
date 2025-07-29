# Chess Web Game

A simple, interactive chess game implemented for the web using HTML5 Canvas and JavaScript, featuring a progressively improved AI opponent.

## Table of Contents

- [About](#about)
- [Features](#features)
- [How to Run](#how-to-run)
- [Technologies Used](#technologies-used)
- [Future Enhancements](#future-enhancements)
- [Version History](#version-history)

## About

This project is a basic implementation of a chess game playable directly in a web browser. It provides a visual chessboard, loads chess piece images, and includes fundamental move validation rules for all pieces. It now includes an AI opponent of increasing difficulty.

## Features

-   **Interactive Chessboard:** A visually rendered 8x8 chessboard.
-   **Chess Piece Display:** All standard chess pieces are loaded and displayed in their initial positions.
-   **Piece Selection:** Click on your own pieces to select them. Selected pieces are highlighted.
-   **Move Validation:** Implements core chess rules for piece movement (Pawn, Rook, Knight, Bishop, Queen, King), including castling and en passant.
-   **Turn-Based Gameplay:** Supports local two-player gameplay, alternating turns between White and Black.
-   **AI Opponent:** Play against a JavaScript-based AI.
    -   **Version 1.2.0:** Simple 1-ply search AI.
    -   **Version 1.3.0:** Advanced AI using a minimax algorithm with alpha-beta pruning and a sophisticated board evaluation function.
-   **Pawn Promotion:** UI and logic for pawn promotion.
-   **Check and Checkmate Detection:** Full logic to detect when a King is in check, and determine checkmate or stalemate conditions.

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

-   **Game State Management:** More robust handling of game states (e.g., draw conditions).
-   **User Interface Improvements:** Enhance the UI with move history, score, and better visual feedback.
-   **Multiplayer:** Integrate WebSocket or other real-time communication for online multiplayer.
-   **Opening Book:** Add a small opening book to the AI to improve its opening play.
-   **Transposition Tables:** Implement transposition tables to further optimize the minimax search.

## Version History

-   **v1.3.0 (Current):**
    -   Implemented a more advanced AI using a minimax algorithm with alpha-beta pruning.
    -   Added a sophisticated board evaluation function that considers piece positions.
-   **v1.2.0:**
    -   Initial release with a simple 1-ply search AI.
-   **v1.0.0 - v1.1.0:**
    -   Basic chess game with move validation, pawn promotion, and check/checkmate detection.