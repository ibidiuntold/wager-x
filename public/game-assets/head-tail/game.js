class HeadTailGame {
    constructor() {
      this.gameState = null;
      this.session = null;
      this.players = {};
      this.wager = 0;
      this.callbacks = {};
    }
  
    init(config, session, callbacks = {}) {
      console.log('[HeadTailGame] Initializing game with session:', session?.id);
      this.session = session;
      this.wager = session?.wager || 0;
      this.players = session?.players || {};
      this.gameState = session?.gameState || {};
      this.callbacks = callbacks;
  
      // Render initial game state
      this.render();
      
      return this;
    }
  
    render() {
      console.log('[HeadTailGame] Rendering game state:', {
        sessionId: this.session?.id,
        wagerPot: this.wager,
        playerCount: Object.keys(this.players).length,
        players: this.players,
        currentTurn: this.session?.currentTurn,
        gameState: this.gameState
      });
      
      // Game-specific rendering would happen here
    }
  
    handleMove(move, playerId) {
      console.log('[HeadTailGame] Processing move:', move, 'by player:', playerId);
      // Game-specific move logic would go here
      
      // If move is valid, call updateCallback
      if (this.callbacks.onUpdateGameState) {
        this.callbacks.onUpdateGameState({
          ...this.gameState,
          lastMove: move,
          lastMoveBy: playerId,
          timestamp: Date.now()
        });
      }
    }
    
    updateState(newState) {
      this.gameState = newState;
      this.render();
    }
  }
  
  // Create and export instance
  const game = new HeadTailGame();
  window.GameInstance = game;