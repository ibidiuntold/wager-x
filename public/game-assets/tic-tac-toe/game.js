class TicTacToeGame {
  constructor(options = {}) {
    this.container = options.container || 'game-container';
    this.gameState = null;
    this.session = options.session || null;
    this.players = {};
    this.wager = 0;
    this.callbacks = {
      onStateChange: options.onStateChange || (() => {}),
      onEnd: options.onEnd || (() => {})
    };
    
    if (this.session) {
      this.init(null, this.session);
    }
  }

  init(config, session, callbacks = {}) {
    console.log('[TicTacToeGame] Initializing game with session:', session?.id);
    this.session = session;
    this.wager = session?.wager || 0;
    this.players = session?.players || {};
    this.gameState = session?.gameState || {};
    
    // Merge any passed callbacks
    if (callbacks.onStateChange) this.callbacks.onStateChange = callbacks.onStateChange;
    if (callbacks.onEnd) this.callbacks.onEnd = callbacks.onEnd;

    // Initialize game board if needed
    if (!this.gameState.board) {
      this.gameState.board = Array(9).fill(null);
    }

    // Render initial game state
    this.render();
    
    return this;
  }

  render() {
    console.log('[TicTacToeGame] Rendering game state:', {
      sessionId: this.session?.id,
      wagerPot: this.wager,
      playerCount: Object.keys(this.players).length,
      players: this.players,
      currentTurn: this.session?.currentTurn,
      board: this.gameState.board
    });
    
    // Get container element
    const container = document.getElementById(this.container);
    if (!container) {
      console.error(`[TicTacToeGame] Container element '${this.container}' not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create game UI
    const gameUI = document.createElement('div');
    gameUI.className = 'tic-tac-toe-game';
    gameUI.style.width = '100%';
    gameUI.style.height = '100%';
    gameUI.style.display = 'flex';
    gameUI.style.flexDirection = 'column';
    gameUI.style.alignItems = 'center';
    gameUI.style.justifyContent = 'center';
    gameUI.style.color = 'white';
    
    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Tic Tac Toe';
    title.style.marginBottom = '20px';
    gameUI.appendChild(title);
    
    // Create game board
    const board = document.createElement('div');
    board.className = 'game-board';
    board.style.display = 'grid';
    board.style.gridTemplateColumns = 'repeat(3, 1fr)';
    board.style.gridGap = '10px';
    board.style.width = '300px';
    board.style.height = '300px';
    
    // Create cells
    this.gameState.board.forEach((cell, index) => {
      const cellElement = document.createElement('div');
      cellElement.className = 'cell';
      cellElement.dataset.index = index;
      cellElement.textContent = cell || '';
      cellElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      cellElement.style.borderRadius = '5px';
      cellElement.style.display = 'flex';
      cellElement.style.alignItems = 'center';
      cellElement.style.justifyContent = 'center';
      cellElement.style.fontSize = '48px';
      cellElement.style.cursor = 'pointer';
      
      cellElement.addEventListener('click', () => {
        this.handleMove(index, this.session?.currentTurn);
      });
      
      board.appendChild(cellElement);
    });
    
    gameUI.appendChild(board);
    
    // Add wager info
    const wagerInfo = document.createElement('div');
    wagerInfo.textContent = `Wager Pot: ₦${this.wager * 2}`;
    wagerInfo.style.marginTop = '20px';
    gameUI.appendChild(wagerInfo);
    
    container.appendChild(gameUI);
  }

  handleMove(position, playerId) {
    console.log('[TicTacToeGame] Processing move at position:', position, 'by player:', playerId);
    
    // Validate move (cell is empty)
    if (this.gameState.board[position] !== null) {
      console.log('[TicTacToeGame] Invalid move: cell already occupied');
      return;
    }
    
    // Determine player mark (X or O)
    const playerIds = Object.keys(this.players);
    const mark = playerId === playerIds[0] ? 'X' : 'O';
    
    // Update board
    const newBoard = [...this.gameState.board];
    newBoard[position] = mark;
    
    // Update game state
    const newState = {
      ...this.gameState,
      board: newBoard,
      lastMove: position,
      lastMoveBy: playerId,
      timestamp: Date.now()
    };
    
    // Check for win or draw
    const result = this.checkGameResult(newBoard);
    if (result.status !== 'ongoing') {
      newState.result = result;
      // Notify about game end
      if (this.callbacks.onEnd) {
        this.callbacks.onEnd(result);
      }
    }
    
    // Update state and notify
    this.gameState = newState;
    
    // Notify about state change
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.gameState);
    }
    
    // Re-render
    this.render();
  }
  
  checkGameResult(board) {
    // Check rows, columns, and diagonals
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return {
          status: 'win',
          winner: board[a],
          pattern
        };
      }
    }
    
    // Check for draw (all cells filled)
    if (!board.includes(null)) {
      return {
        status: 'draw'
      };
    }
    
    // Game still ongoing
    return {
      status: 'ongoing'
    };
  }
  
  updateState(newState) {
    this.gameState = newState;
    this.render();
  }
  
  destroy() {
    console.log('[TicTacToeGame] Destroying game instance');
    const container = document.getElementById(this.container);
    if (container) {
      // Remove all event listeners by cloning and replacing
      const cells = container.querySelectorAll('.cell');
      cells.forEach(cell => {
        const clone = cell.cloneNode(true);
        cell.parentNode.replaceChild(clone, cell);
      });
      
      // Clear container after removing listeners
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
    
    // Reset game state
    this.gameState = null;
    this.session = null;
    this.players = {};
    this.wager = 0;
  }
}

// Only expose the instance
window.GameInstance = new TicTacToeGame();
