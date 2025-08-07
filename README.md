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
-   **AI Opponent:** Play against a JavaScript-based AI with selectable difficulty.
    -   Advanced AI using a minimax algorithm with alpha-beta pruning.
    -   Selectable difficulty (Easy, Medium, Hard) that adjusts the AI's search depth.
-   **Pawn Promotion:** UI and logic for pawn promotion.
-   **Check and Checkmate Detection:** Full logic to detect when a King is in check, and determine checkmate or stalemate conditions.
-   **Save/Load Games:** Save the current game state to your browser's local storage and load it later.
-   **UI/UX Improvements:**
    -   Includes a move history panel.
    -   Visual indicator displays when the AI is "thinking".

## How to Run

This project uses modern JavaScript (ES6 Modules), which requires the files to be served by a web server to function correctly due to browser security policies (CORS).

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GioDev/chess-web.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd chess-web
    ```
3.  **Start a local web server:**
    The simplest way is to use Python's built-in server. Open your terminal in the project directory and run one of the following commands:

    -   If you have Python 3:
        ```bash
        python -m http.server
        ```
    -   If you have Python 2:
        ```bash
        python -m SimpleHTTPServer
        ```
4.  **Open the game in your browser:**
    Navigate to `http://localhost:8000` in your web browser.

## Technologies Used

-   **HTML5:** For the basic structure of the web page and the `<canvas>` element.
-   **CSS3:** For styling the page and the chessboard.
-   **JavaScript (ES6+ Modules):** For all the game logic, canvas drawing, and user interaction, organized into modules for better maintainability.

## Future Enhancements

-   **Draw Conditions:** More robust handling of draw conditions like threefold repetition and the 50-move rule.
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