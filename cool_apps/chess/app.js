const boardSize = 8;
const boardWidth = 600;
const boardHeight = 600;
const tileSize = boardWidth / boardSize;

class Piece {
	constructor(x, y, color, type, board) {
		this.x = x;
		this.y = y;
		this.color = color;
		this.type = type;
		this.piece = document.createElement("div");
		this.piece.classList.add("piece");
		this.piece.style.background = `url("assets/${this.color}-${this.type}.png") center`;
		this.piece.style.backgroundSize = "cover";
		this.alreadyMoved = false;
		this.board = board.board;
		this.game = board;

		this.piece.addEventListener("click", () => {
			if (board.turn !== this.color) return;
			board.highlightMoves(this.getValidMoves(), this);
			this.highlighting = true;
		});
	}

	pieceThere(x, y) {
		if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return false;
		return this.board[y][x].tile.currentPiece;
	}

	sameColorPiece(x, y) {
		return this.board[y][x].tile.currentPiece.color === this.color;
	}

	// For heavy pieces and bishops
	getPiecesAttackedSquares(filterPieces = true) {
		let enemyPieces =
			this.game.turn === "white"
				? this.game.blackPieces
				: this.game.whitePieces;

		if (filterPieces) {
			enemyPieces = enemyPieces.filter((piece) => {
				return (
					piece.type !== "pawn" &&
					piece.type !== "king" &&
					piece.type !== "knight"
				);
			});
		}

		let attackedSquares = [];

		enemyPieces.forEach((piece) => {
			attackedSquares = attackedSquares.concat(piece.getAttackMoves());
		});

		return attackedSquares;
	}

	kingInList(king, moves) {
		let index = moves.findIndex(
			(move) => move[0] === king.x && move[1] === king.y
		);
		return index !== -1;
	}

	horizontalPin(piece) {
		let pieceBetween = false;
		let horizontal = false;

		if (piece.x !== this.x) return horizontal;

		// Check if there is a piece between the king and the piece
		if (piece.x > this.x) {
			for (let i = this.x + 1; i < piece.x; i++) {
				if (this.pieceThere(i, this.y)) {
					pieceBetween = true;
					break;
				}
			}
		} else {
			for (let i = this.x - 1; i > piece.x; i--) {
				if (this.pieceThere(i, this.y)) {
					pieceBetween = true;
					break;
				}
			}
		}

		if (!pieceBetween) horizontal = true;

		return horizontal;
	}

	verticalPin(piece) {
		let pieceBetween = false;
		let vertical = false;

		if (piece.y !== this.y) return vertical;

		// Check if there is a piece between the king and the piece
		if (piece.y > this.y) {
			for (let i = this.y + 1; i < piece.y; i++) {
				if (this.pieceThere(this.x, i)) {
					pieceBetween = true;
					break;
				}
			}
		} else {
			for (let i = this.y - 1; i > piece.y; i--) {
				if (this.pieceThere(this.x, i)) {
					pieceBetween = true;
					break;
				}
			}
		}

		if (!pieceBetween) vertical = true;

		return vertical;
	}

	diagonalPin(piece) {
		let pieceBetween = false;
		let diagonal = false;

		if (Math.abs(piece.x - this.x) !== Math.abs(piece.y - this.y))
			return diagonal;

		// Check if there is a piece between the king and the piece
		if (piece.x > this.x) {
			if (piece.y > this.y) {
				for (let i = 1; i < piece.x - this.x; i++) {
					if (this.pieceThere(this.x + i, this.y + i)) {
						pieceBetween = true;
						break;
					}
				}
			} else {
				for (let i = 1; i < piece.x - this.x; i++) {
					if (this.pieceThere(this.x + i, this.y - i)) {
						pieceBetween = true;
						break;
					}
				}
			}
		} else {
			if (piece.y > this.y) {
				for (let i = 1; i < this.x - piece.x; i++) {
					if (this.pieceThere(this.x - i, this.y + i)) {
						pieceBetween = true;
						break;
					}
				}
			} else {
				for (let i = 1; i < this.x - piece.x; i++) {
					if (this.pieceThere(this.x - i, this.y - i)) {
						pieceBetween = true;
						break;
					}
				}
			}
		}

		if (!pieceBetween) diagonal = true;

		return diagonal;
	}

	filterLegalMoves(moves) {
		const legalMoves = [];
		let enemyPieces =
			this.color === "white" ? this.game.blackPieces : this.game.whitePieces;
		const king =
			this.color === "white" ? this.game.whiteKing : this.game.blackKing;

		if (moves.length === 0) return moves;

		// Filter enemy pieces that are not pawns or kings or knights
		enemyPieces = enemyPieces.filter((piece) => {
			return (
				piece.type !== "pawn" &&
				piece.type !== "king" &&
				piece.type !== "knight"
			);
		});

		let vertical = false;
		let horizontal = false;
		let diagonal = false;

		if (this.x === king.x) {
			enemyPieces.forEach((piece) => {
				if (horizontal) return;
				if (piece.type === "rook" || piece.type === "queen") {
					horizontal = this.horizontalPin(piece);
				}
			});
		}

		if (this.y === king.y) {
			enemyPieces.forEach((piece) => {
				if (vertical) return;
				if (piece.type === "rook" || piece.type === "queen") {
					vertical = this.verticalPin(piece);
				}
			});
		}

		if (Math.abs(this.x - king.x) === Math.abs(this.y - king.y)) {
			enemyPieces.forEach((piece) => {
				if (diagonal) return;
				if (piece.type === "bishop" || piece.type === "queen") {
					diagonal = this.diagonalPin(piece);
				}
			});
		}

		moves.forEach((move) => {
			// Determine direction of the move
			let xDir = move[0] - this.x;
			let yDir = move[1] - this.y;
			if (xDir !== 0) xDir /= Math.abs(xDir);
			if (yDir !== 0) yDir /= Math.abs(yDir);

			// Check if the move is horizontal
			if (move[0] !== this.x && move[1] === this.y) {
				if (!horizontal && !diagonal) legalMoves.push(move);
			}
			// Check if the move is vertical
			else if (move[0] === this.x && move[1] !== this.y) {
				if (!vertical && !diagonal) legalMoves.push(move);
			} else {
				// Check if the move is diagonal
				if (!horizontal && !vertical && !diagonal) legalMoves.push(move);
			}
		});

		return legalMoves;
	}
}

class Pawn extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
	}

	getValidMoves() {
		let validMoves = [];
		const movement = this.color === "white" ? 1 : -1;

		let n = 2;
		if (!this.alreadyMoved) n = 3;

		for (let i = 1; i < n; i++) {
			if (this.pieceThere(this.x, this.y + i * movement)) break;
			validMoves.push([this.x, this.y + i * movement]);
		}

		validMoves = validMoves.concat(this.getAttackMoves());

		return this.filterLegalMoves(validMoves);
	}

	getAttackMoves() {
		let validMoves = [];

		const movement = this.color === "white" ? 1 : -1;
		// Right attack
		if (this.pieceThere(this.x + 1, this.y + movement)) {
			if (!this.sameColorPiece(this.x + 1, this.y + movement))
				validMoves.push([this.x + 1, this.y + movement]);
		}
		// Left attack
		if (this.pieceThere(this.x - 1, this.y + movement)) {
			if (!this.sameColorPiece(this.x - 1, this.y + movement))
				validMoves.push([this.x - 1, this.y + movement]);
		}

		return this.filterLegalMoves(validMoves);
	}
}

class Knight extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
	}

	getValidMoves() {
		let validMoves = [];
		let moves = [
			[this.x + 2, this.y + 1], // 2 right 1 up
			[this.x + 2, this.y - 1], // 2 right 1 down
			[this.x - 2, this.y + 1], // 2 left 1 up
			[this.x - 2, this.y - 1], // 2 left 1 down
			[this.x + 1, this.y + 2], // 2 up 1 right
			[this.x + 1, this.y - 2], // 2 up 1 left
			[this.x - 1, this.y + 2], // 2 down 1 right
			[this.x - 1, this.y - 2], // 2 down 1 left
		];
		// Now filter if the move is inside the board
		moves.forEach((move) => {
			if (
				move[0] >= 0 &&
				move[0] < boardSize &&
				move[1] >= 0 &&
				move[1] < boardSize
			) {
				validMoves.push(move);
			}
		});
		// Filter out moves if there is a piece of the same color
		validMoves = validMoves.filter((move) => {
			if (this.pieceThere(move[0], move[1])) {
				return !this.sameColorPiece(move[0], move[1]);
			}
			return true;
		});
		return this.filterLegalMoves(validMoves);
	}

	getAttackMoves() {
		return this.getValidMoves();
	}
}

class Bishop extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
	}

	getValidMoves() {
		let validMoves = [];

		// Up Right
		for (
			let i = this.x + 1, j = this.y - 1;
			i < boardSize && j >= 0;
			i++, j--
		) {
			if (this.pieceThere(i, j)) {
				if (this.sameColorPiece(i, j)) break;
				validMoves.push([i, j]);
				break;
			}
			validMoves.push([i, j]);
		}
		// Up Left
		for (let i = this.x - 1, j = this.y - 1; i >= 0 && j >= 0; i--, j--) {
			if (this.pieceThere(i, j)) {
				if (this.sameColorPiece(i, j)) break;
				validMoves.push([i, j]);
				break;
			}
			validMoves.push([i, j]);
		}
		// Down Right
		for (
			let i = this.x + 1, j = this.y + 1;
			i < boardSize && j < boardSize;
			i++, j++
		) {
			if (this.pieceThere(i, j)) {
				if (this.sameColorPiece(i, j)) break;
				validMoves.push([i, j]);
				break;
			}
			validMoves.push([i, j]);
		}
		// Down Left
		for (
			let i = this.x - 1, j = this.y + 1;
			i >= 0 && j < boardSize;
			i--, j++
		) {
			if (this.pieceThere(i, j)) {
				if (this.sameColorPiece(i, j)) break;
				validMoves.push([i, j]);
				break;
			}
			validMoves.push([i, j]);
		}

		return this.filterLegalMoves(validMoves);
	}

	getAttackMoves() {
		return this.getValidMoves();
	}
}

class Rook extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
	}

	getValidMoves() {
		let validMoves = [];

		// Up
		for (let i = this.y - 1; i >= 0; i--) {
			if (this.pieceThere(this.x, i)) {
				if (!this.sameColorPiece(this.x, i)) validMoves.push([this.x, i]);
				break;
			}
			validMoves.push([this.x, i]);
		}
		// Down
		for (let i = this.y + 1; i < boardSize; i++) {
			if (this.pieceThere(this.x, i)) {
				if (!this.sameColorPiece(this.x, i)) validMoves.push([this.x, i]);
				break;
			}
			validMoves.push([this.x, i]);
		}
		// Left
		for (let i = this.x - 1; i >= 0; i--) {
			if (this.pieceThere(i, this.y)) {
				if (!this.sameColorPiece(i, this.y)) validMoves.push([i, this.y]);
				break;
			}
			validMoves.push([i, this.y]);
		}
		// Right
		for (let i = this.x + 1; i < boardSize; i++) {
			if (this.pieceThere(i, this.y)) {
				if (!this.sameColorPiece(i, this.y)) validMoves.push([i, this.y]);
				break;
			}
			validMoves.push([i, this.y]);
		}

		return this.filterLegalMoves(validMoves);
	}

	getAttackMoves() {
		return this.getValidMoves();
	}
}

class Queen extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
	}

	getValidMoves() {
		let validMoves = Rook.prototype.getValidMoves.call(this);
		validMoves = validMoves.concat(Bishop.prototype.getValidMoves.call(this));
		return validMoves;
	}

	getAttackMoves() {
		return this.getValidMoves();
	}
}

class King extends Piece {
	constructor(x, y, color, type, board) {
		super(x, y, color, type, board);
		this.underCheck = false;
	}

	getValidMoves() {
		let validMoves = [];
		if (!this.alreadyMoved && !this.underCheck) {
			// TODO: Castling short and long
			if (this.color === "white") {
				if (
					this.pieceThere(0, 0) &&
					this.board[0][0].tile.currentPiece.type === "rook"
				)
					if (!this.board[0][0].tile.currentPiece.alreadyMoved)
						if (!this.pieceThere(1, 0) && !this.pieceThere(2, 0))
							validMoves.push([1, 0]);
				if (
					this.pieceThere(0, 7) &&
					this.board[0][7].tile.currentPiece.type === "rook"
				)
					if (!this.board[0][7].tile.currentPiece.alreadyMoved)
						if (
							!this.pieceThere(5, 0) &&
							!this.pieceThere(6, 0) &&
							!this.pieceThere(4, 0)
						)
							validMoves.push([5, 0]);
			} else {
				if (
					this.pieceThere(7, 0) &&
					this.board[7][0].tile.currentPiece.type === "rook"
				)
					if (!this.board[7][0].tile.currentPiece.alreadyMoved)
						if (!this.pieceThere(1, 7) && !this.pieceThere(2, 7))
							validMoves.push([1, 7]);
				if (
					this.pieceThere(7, 7) &&
					this.board[7][7].tile.currentPiece.type === "rook"
				)
					if (!this.board[7][7].tile.currentPiece.alreadyMoved)
						if (
							!this.pieceThere(5, 7) &&
							!this.pieceThere(6, 7) &&
							!this.pieceThere(4, 7)
						)
							validMoves.push([5, 7]);
			}
		}
		let moves = [
			[this.x + 1, this.y + 1], // Right Up
			[this.x + 1, this.y - 1], // Right Down
			[this.x - 1, this.y + 1], // Left Up
			[this.x - 1, this.y - 1], // Left Down
			[this.x + 1, this.y], // Right
			[this.x - 1, this.y], // Left
			[this.x, this.y + 1], // Up
			[this.x, this.y - 1], // Down
		];

		// Now filter if the move is inside the board
		moves.forEach((move) => {
			if (
				move[0] >= 0 &&
				move[0] < boardSize &&
				move[1] >= 0 &&
				move[1] < boardSize
			) {
				validMoves.push(move);
			}
		});

		// Filter out moves if there is a piece of the same color
		validMoves = validMoves.filter((move) => {
			if (this.pieceThere(move[0], move[1])) {
				return !this.sameColorPiece(move[0], move[1]);
			}
			return true;
		});

		let attackedSquares = this.getPiecesAttackedSquares();

		// Filter out moves if the king is going to be in check
		validMoves = validMoves.filter((move) => {
			let index = attackedSquares.findIndex(
				(square) => square[0] === move[0] && square[1] === move[1]
			);
			return index === -1;
		});

		return validMoves;
	}

	getAttackMoves() {
		let validMoves = [];
		let moves = [
			[this.x + 1, this.y + 1], // Right Up
			[this.x + 1, this.y - 1], // Right Down
			[this.x - 1, this.y + 1], // Left Up
			[this.x - 1, this.y - 1], // Left Down
			[this.x + 1, this.y], // Right
			[this.x - 1, this.y], // Left
			[this.x, this.y + 1], // Up
			[this.x, this.y - 1], // Down
		];

		// Now filter if the move is inside the board
		moves.forEach((move) => {
			if (
				move[0] >= 0 &&
				move[0] < boardSize &&
				move[1] >= 0 &&
				move[1] < boardSize
			) {
				validMoves.push(move);
			}
		});

		// Filter out moves if there is a piece of the same color
		validMoves = validMoves.filter((move) => {
			if (this.pieceThere(move[0], move[1])) {
				return !this.sameColorPiece(move[0], move[1]);
			}
			return true;
		});

		return validMoves;
	}
}

class Tile {
	constructor(x, y, board) {
		this.x = x;
		this.y = y;
		this.tile = document.createElement("div");
		this.tile.classList.add("tile");
		this.tile.classList.add(x % 2 === y % 2 ? "white" : "black");

		this.tile.currentPiece = null;
		this.tile.board = board;
	}
}

class Board {
	constructor() {
		this.board = [];
		this.whitePieces = [];
		this.blackPieces = [];
		this.boardSize = boardSize;
		this.boardWidth = boardWidth;
		this.boardHeight = boardHeight;
		this.rotate = true;
		this.tileSize = tileSize;
		this.turn = "white";
		this.root = document.getElementById("root");
		this.root.classList.toggle("rotate");

		this.whiteKing = null;
		this.blackKing = null;

		this.blackAttackedSquares = {};
		this.whiteAttackedSquares = {};

		this.moveCount = 0;
		this.moveHistory = [];

		this.highlighting = false;
		this.activePiece = null;

		this.createBoard();
	}

	createBoard() {
		if (!this.root) return;

		this.root.classList.add("board");

		this.root.style.width = this.boardWidth + "px";
		this.root.style.height = this.boardHeight + "px";

		for (let i = 0; i < this.boardSize; i++) {
			this.board[i] = [];
			for (let j = 0; j < this.boardSize; j++) {
				this.board[i][j] = new Tile(i, j, this);
				this.root.appendChild(this.board[i][j].tile);
			}
		}
		this.createPieces();
	}

	createPieces() {
		// Pawns
		for (let i = 0; i < this.boardSize; i++) {
			this.whitePieces.push(new Pawn(i, 1, "white", "pawn", this));
			this.blackPieces.push(new Pawn(i, 6, "black", "pawn", this));
		}

		// Rooks
		this.whitePieces.push(new Rook(0, 0, "white", "rook", this));
		this.whitePieces.push(new Rook(7, 0, "white", "rook", this));
		this.blackPieces.push(new Rook(0, 7, "black", "rook", this));
		this.blackPieces.push(new Rook(7, 7, "black", "rook", this));

		// Knights
		this.whitePieces.push(new Knight(1, 0, "white", "knight", this));
		this.whitePieces.push(new Knight(6, 0, "white", "knight", this));
		this.blackPieces.push(new Knight(1, 7, "black", "knight", this));
		this.blackPieces.push(new Knight(6, 7, "black", "knight", this));

		// Bishops
		this.whitePieces.push(new Bishop(2, 0, "white", "bishop", this));
		this.whitePieces.push(new Bishop(5, 0, "white", "bishop", this));
		this.blackPieces.push(new Bishop(2, 7, "black", "bishop", this));
		this.blackPieces.push(new Bishop(5, 7, "black", "bishop", this));

		// Queens
		this.whitePieces.push(new Queen(4, 0, "white", "queen", this));
		this.blackPieces.push(new Queen(4, 7, "black", "queen", this));

		// Kings
		this.whitePieces.push(new King(3, 0, "white", "king", this));
		this.whiteKing = this.whitePieces[this.whitePieces.length - 1];
		this.blackPieces.push(new King(3, 7, "black", "king", this));
		this.blackKing = this.blackPieces[this.blackPieces.length - 1];

		this.updateBoard();
	}

	updateBoard() {
		// Set all tiles to null, then set tiles with pieces to the cuurent piece
		this.board.forEach((row) => {
			row.forEach((tile) => {
				tile.tile.innerHTML = "";
			});
		});

		this.whitePieces.forEach((piece) => {
			this.board[piece.y][piece.x].tile.currentPiece = piece;
		});
		this.blackPieces.forEach((piece) => {
			this.board[piece.y][piece.x].tile.currentPiece = piece;
		});

		this.renderPieces();
	}

	renderPieces() {
		this.whitePieces.forEach((piece) => {
			this.board[piece.y][piece.x].tile.appendChild(piece.piece);
			if (this.rotate) piece.piece.style.transform = "rotate(180deg)";
			else piece.piece.style.transform = "rotate(0deg)";
		});
		this.blackPieces.forEach((piece) => {
			this.board[piece.y][piece.x].tile.appendChild(piece.piece);
			if (this.rotate) piece.piece.style.transform = "rotate(180deg)";
			else piece.piece.style.transform = "rotate(0deg)";
		});
	}

	rotateBoard() {
		this.root.classList.toggle("rotate");
		this.rotate = !this.rotate;
		this.updateBoard();
	}

	highlightMoves(moves, piece) {
		if (this.highlighting) {
			this.clearHighlights();
			if (this.activePiece === piece) {
				this.highlighting = false;
				this.activePiece = null;
				return;
			}
		}

		moves.forEach((move) => {
			this.board[move[1]][move[0]].tile.classList.add("highlight");
			this.board[move[1]][move[0]].tile.onclick = (e) => {
				this.move(move[0], move[1]);
			};
		});
		this.activePiece = piece;
		this.highlighting = true;
	}

	clearHighlights() {
		this.board.forEach((row) => {
			row.forEach((tile) => {
				tile.tile.classList.remove("highlight");
				tile.tile.onclick = null;
			});
		});
	}

	prettifyCoords({ x, y, oldX, oldY, piece, capture, check }) {
		let letters = ["h", "g", "f", "e", "d", "c", "b", "a"];

		if (!piece) {
			console.log(`${letters[x]}${y + 1}}`);
			return;
		}

		let move = "";

		if (piece.type !== "pawn") {
			move += piece.type[0].toUpperCase();
		}
		if (capture) {
			if (piece.type === "pawn") {
				move += letters[oldX];
			}
			move += "x";
		}
		move += letters[x];
		move += y + 1;
		if (check) move += "+";
		console.log(move);
	}

	printMoveHistory() {
		this.moveHistory.forEach((move) => {
			this.prettifyCoords(move);
		});
	}

	kingInList(king, moves) {
		let index = moves.findIndex(
			(move) => move[0] === king.x && move[1] === king.y
		);
		return index !== -1;
	}

	isCheck(piece) {
		// Determine enemy king color
		let king = piece.color === "white" ? this.blackKing : this.whiteKing;

		// Get all possible moves of the piece
		let moves = piece.getValidMoves();
		// Check if the enemy king is in the list of attacked squares
		if (this.kingInList(king, moves)) {
			king.piece.classList.add("check");
			king.underCheck = true;
			return true;
		}
		king.piece.classList.remove("check");
		king.underCheck = false;
		return false;
	}

	// This function should be on each Class that extends Piece
	leavesKingInCheck(piece, toX, toY) {
		let king = piece.color === "white" ? this.blackKing : this.whiteKing;

		let originalX = piece.x;
		let originalY = piece.y;
		piece.x = toX;
		piece.y = toY;
		let oldPiece = this.board[toY][toX].tile.currentPiece;
		this.board[toY][toX].tile.currentPiece = piece;
		this.board[originalY][originalX].tile.currentPiece = null;
		// Get all enemy pieces that can attack the king
		let enemyPieces =
			piece.color === "white" ? this.blackPieces : this.whitePieces;
		// Filter out the king, pawns, and knights because they are special
		// and the old piece because it is no longer there because was captured
		let filteredPieces = enemyPieces.filter(
			(piece) =>
				piece.type !== "king" &&
				piece.type !== "pawn" &&
				piece.type !== "knight" &&
				piece !== oldPiece
		);
		let enemyMoves = [];
		filteredPieces.forEach((piece) => {
			let moves = piece.getAttackMoves();
			// if (moves.length !== 0) {
			// 	console.log({ piece });
			// 	for (let i = 0; i < moves.length; i++) {
			// 		this.prettifyCoords(moves[i][0], moves[i][1]);
			// 	}
			// }
			enemyMoves = enemyMoves.concat(moves);
		});
		piece.x = originalX;
		piece.y = originalY;
		this.board[toY][toX].tile.currentPiece = oldPiece;
		this.board[originalY][originalX].tile.currentPiece = piece;

		// Check if the move leaves the king in check
		return this.kingInList(king, enemyMoves);
	}

	isCheckmate(piece) {
		let king = piece.color === "white" ? this.blackKing : this.whiteKing;

		let moves = piece.getValidMoves();
		// TODO: Check if the king can move out of check or if a piece can block the check
	}

	move(x, y) {
		let piece = this.activePiece;

		let king = board.turn === "white" ? board.whiteKing : board.blackKing;
		if (king.underCheck) {
			king.piece.classList.remove("check");
			king.underCheck = false;
		}

		// TODO: Implement special moves like castling and en passant

		let oldX = piece.x;
		let oldY = piece.y;
		// If there is a piece at the destination, remove it from the array
		// or in chess terms, capture it
		let capture = false;
		if (this.board[y][x].tile.currentPiece) {
			let index = this.whitePieces.indexOf(this.board[y][x].tile.currentPiece);
			if (index !== -1) {
				this.whitePieces.splice(index, 1);
			} else {
				index = this.blackPieces.indexOf(this.board[y][x].tile.currentPiece);
				this.blackPieces.splice(index, 1);
			}
			capture = true;
		}
		this.board[piece.y][piece.x].tile.currentPiece = null;
		this.board[y][x].tile.currentPiece = piece;
		piece.x = x;
		piece.y = y;
		piece.alreadyMoved = true;
		this.updateBoard();
		this.clearHighlights();

		let check = this.isCheck(piece); // Check if the move puts the enemy king in check

		// TODO: After rendering the pieces, check if the king is in checkmate

		if (check) {
			if (this.isCheckmate(piece))
				console.log(`${piece.color} wins by checkmate!`);
			else console.log(`${piece.color} puts the enemy king in check!`);
		}

		this.highlighting = false;
		this.activePiece = null;
		if (this.turn === "white") this.moveCount++;
		this.moveHistory.push({ oldX, oldY, x, y, piece, capture, check });
		this.turn = this.turn === "white" ? "black" : "white";
	}
}

let board = new Board();
