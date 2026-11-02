/**
 * WagerX Game Template
 * This is a generic game template that can be customized for different game types
 */

// Game state and variables
let gameState = {
    sessionId: null,
    playerId: null,
    gameConfig: null,
    players: {},
    currentTurn: null,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    wagerAmount: 0,
    totalPot: 0,
    moves: [],
    lastUpdated: Date.now(),
    lastFetchTime: Date.now() // Track last successful data fetch
  };
  
  // Configuration options
  const config = {
    pollingInterval: 3000, // Default polling interval in ms
    pollingBackoff: {
      // Exponential backoff for polling on error
      interval: 3000,
      multiplier: 2,
      maxInterval: 15000,
      currentInterval: 3000
    },
    pollAggressively: false, // Set to true during critical game moments
    autoReconnect: true,
    alertDuration: 5000
  };
  
  // Game initialization
  async function initializeGame() {
    try {
      console.log('Initializing game...');

      const urlParams = new URLSearchParams(window.location.search);
      
      // Get config from inline script if available
      if (window.gameConfig) {
        gameState.sessionId = window.gameConfig.sessionId;
        gameState.playerId = window.gameConfig.playerId;
        console.log("Window config");
        if (window.gameConfig.pollingInterval) {
          config.pollingInterval = window.gameConfig.pollingInterval;
          config.pollingBackoff.interval = window.gameConfig.pollingInterval;
          config.pollingBackoff.currentInterval = window.gameConfig.pollingInterval;
        }
      } else {
        // Fall back to URL parameters
        gameState.sessionId = urlParams.get('sessionId');
        gameState.playerId = urlParams.get('playerId');
      }
      
      // Validate required parameters
      if (!gameState.sessionId || !gameState.playerId) {
        showError('Missing required parameters. Cannot initialize game.');
        return;
      }
      
      // Get game-specific config from URL path
      const sessionId = urlParams.get('sessionId');
      console.log(sessionId);
      
      // Add game-specific initialization here
      await loadGameConfig(sessionId);
      
      // Start session polling
      await fetchSessionData();
      startPolling();
      
      // Add event listeners
      document.getElementById('leaveGameBtn').addEventListener('click', confirmLeaveGame);
      document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmDialog);
      document.getElementById('confirmActionBtn').addEventListener('click', handleConfirmedAction);
      document.getElementById('alertClose').addEventListener('click', closeAlert);
      
      // Set up notification listeners
      setupNotificationListeners();
      
      // Hide loading screen after initialization
      hideLoadingScreen();
    } catch (error) {
      console.error('Game initialization error:', error);
      showError('Failed to initialize game. Please try again.');
    }
  }
  
  // Set up listeners for notification buttons
  function setupNotificationListeners() {
    const primaryBtn = document.getElementById('notificationPrimaryBtn');
    const secondaryBtn = document.getElementById('notificationSecondaryBtn');
    
    primaryBtn.addEventListener('click', () => {
      // Reset button click handler (will be customized per notification)
      primaryBtn.onclick = null;
      closeNotification();
    });
    
    secondaryBtn.addEventListener('click', () => {
      // Reset button click handler
      secondaryBtn.onclick = null;
      closeNotification();
    });
  }
  
  // Load game configuration based on game slug
  async function loadGameConfig(gameSlug) {
    try {
      // This would normally fetch from your server
      // For now, we'll use the gameConfigs from URL
      const gameConfigUrl = `/api/game-session/${gameSlug}`;
      
      // Fallback to hardcoded config if fetch fails
      try {
        const response = await fetch(gameConfigUrl);
        if (response.ok) {
          gameState.gameConfig = await response.json();
        } else {
          throw new Error('Failed to fetch game config');
        }
      } catch (fetchError) {
        console.warn('Fetching game config failed, using fallback', fetchError);
        // Fallback: Extract game title from URL
        const gameName = gameSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        gameState.gameConfig = {
          title: gameName,
          slug: gameSlug,
          minWager: 100,
          maxWager: 10000,
          instructions: 'Game instructions not available.'
        };
      }
      
      // Update UI with game config
      document.getElementById('gameTitle').textContent = gameState.gameConfig.title;
      document.title = `WagerX - ${gameState.gameConfig.title}`;
    } catch (error) {
      console.error('Error loading game config:', error);
      gameState.gameConfig = {
        title: 'WagerX Game',
        slug: gameSlug,
        minWager: 100,
        maxWager: 10000
      };
    }
  }
  
  // Fetch session data from Firebase
  async function fetchSessionData() {
    try {
      const apiUrl = `/api/game-session/${gameState.sessionId}`;
      let sessionData;
      
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${getToken()}`, // Get auth token if available
            'X-Player-Id': gameState.playerId
          }
        });
        
        if (response.ok) {
          sessionData = await response.json();
          // Reset polling backoff on successful fetch
          resetPollingBackoff();
        } else if (response.status === 404) {
          showError('Game session has ended or does not exist.');
          stopPolling();
          return;
        } else if (response.status === 403) {
          showError('You are not authorized to access this game session.');
          stopPolling();
          return;
        } else {
          throw new Error(`Failed to fetch session data: ${response.status}`);
        }
      } catch (fetchError) {
        console.warn('Fetching session data failed, using fallback or previous data', fetchError);
        
        // Update polling interval using exponential backoff
        applyPollingBackoff();
        
        // If we have previous data, continue using it
        if (Object.keys(gameState.players).length > 0) {
          return;
        }
        
        // Otherwise create mock session data for demo/fallback
        const mockOpponentId = `player-${Math.floor(Math.random() * 1000)}`;
        sessionData = {
          id: gameState.sessionId,
          status: 'playing',
          wager: 200,
          players: {
            [gameState.playerId]: {
              id: gameState.playerId,
              nickname: localStorage.getItem('playerName') || 'You',
              avatarUrl: localStorage.getItem('playerAvatar') || '/images/avatars/default.png',
              status: 'active',
              isBot: false
            },
            [mockOpponentId]: {
              id: mockOpponentId,
              nickname: 'Opponent',
              avatarUrl: '/images/avatars/default.png',
              status: 'active',
              isBot: false
            }
          },
          currentTurn: gameState.playerId,
          gameState: {},
          moves: [],
          startTime: Date.now() - 60000, // Started 1 minute ago
          lastActivityTime: Date.now()
        };
      }
      
      // Check for important state changes before updating
      const prevStatus = gameState.status;
      const prevWinner = gameState.winner;
      
      // Update game state with session data
      updateGameState(sessionData);
      
      // Handle significant state changes
      if (sessionData.status !== prevStatus) {
        handleStatusChange(prevStatus, sessionData.status);
      }
      
      if (sessionData.winner && sessionData.winner !== prevWinner) {
        handleWinnerDeclared(sessionData.winner, sessionData.wager * 2);
      }
      
      // Track last successful fetch time
      gameState.lastFetchTime = Date.now();
      
      // Update UI
      updateUI();
    } catch (error) {
      console.error('Error fetching session data:', error);
      // Apply backoff but don't show error to user until multiple failures
      applyPollingBackoff();
      
      // Only show error if we haven't received data in a while
      const timeSinceLastFetch = Date.now() - gameState.lastFetchTime;
      if (timeSinceLastFetch > 10000) {
        showAlert('Connection issue. Attempting to reconnect...', 'warning');
      }
    }
  }
  
  // Update game state with session data
  function updateGameState(sessionData) {
    if (!sessionData) return;
    
    gameState.players = sessionData.players || {};
    gameState.currentTurn = sessionData.currentTurn;
    gameState.wagerAmount = sessionData.wager || 0;
    gameState.totalPot = (sessionData.wager || 0) * Object.keys(sessionData.players || {}).length;
    gameState.gameStarted = sessionData.status === 'playing';
    gameState.gameEnded = sessionData.status === 'finished' || sessionData.status === 'expired';
    gameState.winner = sessionData.winner;
    gameState.moves = sessionData.moves || [];
    gameState.lastUpdated = Date.now();
    gameState.status = sessionData.status;
    
    // Set game-specific state
    if (sessionData.gameState) {
      // Merge game-specific state
      Object.assign(gameState, sessionData.gameState);
    }
  }
  
  // Handle game status changes
  function handleStatusChange(oldStatus, newStatus) {
    console.log(`Game status changed: ${oldStatus} -> ${newStatus}`);
    
    // Handle specific status transitions
    if (newStatus === 'playing' && oldStatus === 'waiting') {
      showAlert('Game has started!', 'success');
      setPollFrequency(true); // Poll more aggressively at game start
      setTimeout(() => setPollFrequency(false), 30000); // Reset after 30 seconds
    }
    
    if (newStatus === 'finished') {
      if (!gameState.winner) {
        showAlert('Game has ended', 'info');
      }
      stopPolling();
    }
    
    if (newStatus === 'expired') {
      showAlert('This game session has expired', 'error');
      stopPolling();
    }
  }
  
  // Handle winner declaration
  function handleWinnerDeclared(winnerId, amount) {
        let resultType = '';
        let opponentName = '';
        
        const opponent = Object.values(gameState.players).find(p => p.id !== gameState.playerId);
        if (opponent) {
            opponentName = opponent.nickname;
        }
        
        if (winnerId === gameState.playerId) {
            resultType = 'win';
            showNotification('win', amount, null, opponentName);
        } else {
            const lastMove = gameState.moves[gameState.moves.length - 1];
            if (lastMove && lastMove.action === 'forfeit' && lastMove.playerId === gameState.playerId) {
                resultType = 'forfeit';
                showNotification('forfeit', amount, null, opponentName);
            } else if (lastMove && lastMove.action === 'forfeit' && lastMove.playerId !== gameState.playerId) {
                resultType = 'opponentForfeit';
                showNotification('opponentForfeit', amount, null, opponentName);
            } else {
                resultType = 'lose';
                showNotification('lose', amount, null, opponentName);
            }
        }
  }
  
  // Start polling for session updates
  function startPolling() {
        if (window.pollingInterval) {
            clearInterval(window.pollingInterval);
        }
        
        window.pollingInterval = setInterval(async () => {
            if (gameState.gameEnded) {
                clearInterval(window.pollingInterval);
                return;
            }
            await fetchSessionData();
        }, config.pollingBackoff.currentInterval);
        
        window.addEventListener('beforeunload', () => {
            clearInterval(window.pollingInterval);
        });
  }
  
// Stop polling
function stopPolling() {
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        window.pollingInterval = null;
    }
}

// Set polling frequency (normal/aggressive)
function setPollFrequency(aggressive) {
    config.pollAggressively = aggressive;
    if (aggressive) {
        config.pollingBackoff.currentInterval = 1000;
    } else {
        config.pollingBackoff.currentInterval = config.pollingBackoff.interval;
    }
    
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        startPolling();
    }
}

// Reset polling backoff
function resetPollingBackoff() {
    if (config.pollAggressively) return;
    config.pollingBackoff.currentInterval = config.pollingBackoff.interval;
}

// Apply exponential backoff for polling
function applyPollingBackoff() {
    if (config.pollAggressively) return;
    
    config.pollingBackoff.currentInterval = Math.min(
        config.pollingBackoff.currentInterval * config.pollingBackoff.multiplier,
        config.pollingBackoff.maxInterval
    );
    
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        startPolling();
    }
}

// Update UI based on current game state
function updateUI() {
    // Update wager amount
    document.getElementById('wagerAmount').textContent = `₦${gameState.totalPot.toLocaleString()}`;
    
    // Update player information
    const playerIds = Object.keys(gameState.players);
    if (playerIds.length > 0) {
        // Current player
        const currentPlayer = gameState.players[gameState.playerId];
        if (currentPlayer) {
            document.getElementById('player1Avatar').src = currentPlayer.avatarUrl || '/images/avatars/default.png';
            document.getElementById('player1Name').textContent = currentPlayer.nickname;
            document.getElementById('player1Status').textContent = currentPlayer.status === 'active' ? 'Connected' : 'Disconnected';
            document.getElementById('player1Status').className = `player-status ${currentPlayer.status !== 'active' ? 'disconnected' : ''}`;
        }
        
        // Opponent
        const opponentId = playerIds.find(id => id !== gameState.playerId);
        if (opponentId && gameState.players[opponentId]) {
            const opponent = gameState.players[opponentId];
            document.getElementById('player2Avatar').src = opponent.avatarUrl || '/images/avatars/default.png';
            document.getElementById('player2Name').textContent = opponent.nickname;
            document.getElementById('player2Status').textContent = opponent.status === 'active' ? 'Connected' : 'Disconnected';
            document.getElementById('player2Status').className = `player-status ${opponent.status !== 'active' ? 'disconnected' : ''}`;
            
            if (opponent.status === 'disconnected' && !gameState.opponentWasDisconnected) {
                showAlert(`${opponent.nickname} has disconnected`, 'warning');
                gameState.opponentWasDisconnected = true;
            } else if (opponent.status === 'active' && gameState.opponentWasDisconnected) {
                showAlert(`${opponent.nickname} has reconnected`, 'info');
                gameState.opponentWasDisconnected = false;
            }
        } else {
            document.getElementById('player2Name').textContent = 'Waiting for opponent...';
            document.getElementById('player2Status').textContent = '';
        }
    }
    
    // Update turn indicator
    updateTurnIndicator();
    
    // Update game message
    updateGameMessage();
    
    // Update game-specific UI
    updateGameSpecificUI();
  }
  
  // Update turn indicator
function updateTurnIndicator() {
    const turnIndicator = document.getElementById('turnIndicator');
    
    if (!gameState.gameStarted) {
        turnIndicator.textContent = 'Waiting for game to start...';
        return;
    }
    
    if (gameState.gameEnded) {
        turnIndicator.textContent = 'Game ended';
        return;
    }
    
    if (gameState.currentTurn === gameState.playerId) {
        turnIndicator.textContent = 'Your turn';
        turnIndicator.style.color = '#4ade80';
    } else {
        const opponent = Object.values(gameState.players).find(p => p.id !== gameState.playerId);
        turnIndicator.textContent = `${opponent?.nickname || 'Opponent'}'s turn`;
        turnIndicator.style.color = 'rgba(255, 255, 255, 0.7)';
    }
}
  
 // Update game message based on game state
function updateGameMessage() {
    const gameMessage = document.getElementById('gameMessage');
    
    if (!gameState.gameStarted && Object.keys(gameState.players).length < 2) {
        gameMessage.textContent = 'Waiting for opponent to join...';
        return;
    }
    
    if (!gameState.gameStarted) {
        gameMessage.textContent = 'Game is about to start...';
        return;
    }
    
    if (gameState.gameEnded) {
        if (gameState.winner === gameState.playerId) {
            gameMessage.textContent = '🎉 You won! 🎉';
            gameMessage.style.color = '#4ade80';
        } else if (gameState.winner) {
            const opponent = Object.values(gameState.players).find(p => p.id === gameState.winner);
            gameMessage.textContent = `${opponent?.nickname || 'Opponent'} won`;
            gameMessage.style.color = '#ef4444';
        } else {
            gameMessage.textContent = 'Game ended in a draw';
            gameMessage.style.color = '#f59e0b';
        }
        return;
    }
    
    gameMessage.textContent = 'Game in progress';
    gameMessage.style.color = 'white';
}
  
  // Game-specific UI updates - to be customized per game
  function updateGameSpecificUI() {
    const gameSpecificContent = document.getElementById('gameSpecificContent');
    const gameControls = document.getElementById('gameControls');
    
    // Clear previous content
    gameSpecificContent.innerHTML = '';
    gameControls.innerHTML = '';
    
    if (!gameState.gameStarted && Object.keys(gameState.players).length < 2) {
      gameSpecificContent.innerHTML = `
        <div style="text-align: center;">
          <p>Waiting for opponent to join...</p>
          <p style="font-size: 0.8rem; margin-top: 1rem;">Share the game link with a friend to start playing</p>
        </div>
      `;
      return;
    }
    
    if (!gameState.gameStarted) {
      gameSpecificContent.innerHTML = `
        <div style="text-align: center;">
          <p>Game starting soon...</p>
          <div class="loading-spinner" style="margin: 1rem auto; width: 24px; height: 24px; border-width: 3px;"></div>
        </div>
      `;
      return;
    }
    
    if (gameState.gameEnded) {
      gameSpecificContent.innerHTML = `
        <div style="text-align: center;">
          <p>Game has ended</p>
          ${gameState.winner ? `
            <p style="margin-top: 1rem; font-size: 1.5rem;">
              ${gameState.winner === gameState.playerId ? '🏆 You won ₦' + gameState.totalPot.toLocaleString() + '! 🏆' : 'Better luck next time!'}
            </p>
          ` : ''}
        </div>
      `;
      
      gameControls.innerHTML = `
        <button class="btn" onclick="window.location.href='/'">Browse Games</button>
        <button class="btn" onclick="window.location.href='/game/${gameState.gameConfig?.slug || ''}'">Play Again</button>
      `;
      return;
    }
    
    // Default game content - customize this for each game
    gameSpecificContent.innerHTML = `
      <div style="text-align: center;">
        <p>Game is active!</p>
        <p style="margin-top: 1rem; font-size: 0.9rem;">${gameState.gameConfig?.instructions || 'No instructions available.'}</p>
      </div>
    `;
    
    // Default game controls - customize this for each game
    if (gameState.currentTurn === gameState.playerId) {
      gameControls.innerHTML = `
        <button class="btn" onclick="makeDefaultMove('play')">Make Move</button>
      `;
    }
  }
  
  // Generic function to make a move - customize per game
  async function makeDefaultMove(moveType) {
    try {
      if (gameState.gameEnded || gameState.currentTurn !== gameState.playerId) {
        return;
      }
      
      // In a real implementation, this would call Firebase
      const apiUrl = `/api/sessions/${gameState.sessionId}/moves`;
      const moveData = {
        playerId: gameState.playerId,
        action: moveType,
        timestamp: Date.now()
      };
      
      // Optimistically update UI
      gameState.currentTurn = null; // Temporarily disable turns until server confirms
      updateTurnIndicator();
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
            'X-Player-Id': gameState.playerId
          },
          body: JSON.stringify(moveData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit move');
        }
        
        // Server confirmed move, fetch latest state
        await fetchSessionData();
      } catch (fetchError) {
        console.warn('Sending move failed, simulating response', fetchError);
        // Simulate response for demo
        const opponentId = Object.keys(gameState.players).find(id => id !== gameState.playerId);
        gameState.currentTurn = opponentId;
        gameState.moves.push(moveData);
        updateUI();
      }
    } catch (error) {
      console.error('Error making move:', error);
      // Restore previous state on error
      await fetchSessionData();
    }
  }
  
  // Confirm leaving the game
  function confirmLeaveGame() {
    // Store action to perform if confirmed
    window.pendingAction = {
      type: 'leave',
      data: {}
    };
    
    // Show confirm dialog
    const confirmDialog = document.getElementById('confirmDialog');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    
    confirmTitle.textContent = 'Leave Game?';
    
    // Get opponent name for more personalized message
    let opponentName = 'your opponent';
    const opponent = Object.values(gameState.players).find(p => p.id !== gameState.playerId);
    if (opponent) {
      opponentName = opponent.nickname;
    }
    
    // Check if game is in progress
    if (gameState.gameStarted && !gameState.gameEnded) {
      confirmMessage.textContent = `Are you sure you want to leave this game? You will forfeit your wager of ₦${gameState.wagerAmount.toLocaleString()} to ${opponentName}.`;
      confirmActionBtn.textContent = 'Leave & Forfeit';
    } else {
      confirmMessage.textContent = 'Are you sure you want to leave this game?';
      confirmActionBtn.textContent = 'Leave Game';
    }
    
    confirmDialog.classList.add('active');
  }
  
  // Close confirm dialog
  function closeConfirmDialog() {
    const confirmDialog = document.getElementById('confirmDialog');
    confirmDialog.classList.remove('active');
    window.pendingAction = null;
  }
  
  // Handle confirmed action
  function handleConfirmedAction() {
    if (!window.pendingAction) return;
    
    const { type, data } = window.pendingAction;
    
    if (type === 'leave') {
      leaveGame();
    }
    
    // Close dialog and reset pending action
    closeConfirmDialog();
  }
  
  // Leave the game
  async function leaveGame() {
    try {
      // In a real implementation, this would call Firebase
      const apiUrl = `/api/sessions/${gameState.sessionId}/leave`;
      
      try {
        showAlert('Leaving game...', 'info');
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
            'X-Player-Id': gameState.playerId
          },
          body: JSON.stringify({
            playerId: gameState.playerId,
            action: 'forfeit'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to leave game');
        }
        
        // Wait a moment to show the leave message
        setTimeout(() => {
          // Navigate back to games page
          window.location.href = '/';
        }, 1000);
      } catch (fetchError) {
        console.warn('API call to leave game failed', fetchError);
        // Continue with navigation anyway
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error leaving game:', error);
      // Navigate anyway as fallback
      window.location.href = '/';
    }
  }
  
  // Show notification modal
  function showNotification(type, amount, onPrimaryAction, opponentName = 'Opponent') {
    const container = document.getElementById('notificationContainer');
    const box = document.getElementById('notificationBox');
    const icon = document.getElementById('notificationIcon');
    const title = document.getElementById('notificationTitle');
    const message = document.getElementById('notificationMessage');
    const primaryBtn = document.getElementById('notificationPrimaryBtn');
    const secondaryBtn = document.getElementById('notificationSecondaryBtn');
    
    // Reset any previous classes
    box.className = 'notification-box';
    
    // Configure based on notification type
    switch (type) {
      case 'win':
        box.classList.add('notification-win');
        icon.innerHTML = '🏆';
        title.textContent = 'You won!';
        message.textContent = `Congratulations! You've won ₦${amount.toLocaleString()}.`;
        primaryBtn.textContent = 'Play Again';
        secondaryBtn.textContent = 'Browse Games';
        
        // Add confetti animation
        showConfetti();
        break;
        
      case 'opponentForfeit':
        box.classList.add('notification-win');
        icon.innerHTML = '🏆';
        title.textContent = 'Opponent Forfeited!';
        message.textContent = `${opponentName} forfeited the game. You've been awarded ₦${amount.toLocaleString()}.`;
        primaryBtn.textContent = 'Play Again';
        secondaryBtn.textContent = 'Browse Games';
        break;
        
      case 'lose':
        box.classList.add('notification-lose');
        icon.innerHTML = '😔';
        title.textContent = 'You lost';
        message.textContent = `Better luck next time. You've lost ₦${amount.toLocaleString()}.`;
        primaryBtn.textContent = 'Play Again';
        secondaryBtn.textContent = 'Browse Games';
        break;
        
      case 'forfeit':
        box.classList.add('notification-forfeit');
        icon.innerHTML = '🚫';
        title.textContent = 'You Forfeited';
        message.textContent = `You forfeited the game. ₦${amount.toLocaleString()} has been awarded to ${opponentName}.`;
        primaryBtn.textContent = 'Play Again';
        secondaryBtn.textContent = 'Browse Games';
        break;
    }
    
    // Set up action handlers
    primaryBtn.onclick = () => {
      closeNotification();
      // Play again action
      window.location.href = `/game/${gameState.gameConfig?.slug || ''}`;
    };
    
    secondaryBtn.onclick = () => {
      closeNotification();
      // Browse games action
      window.location.href = '/';
    };
    
    // Custom action if provided
    if (onPrimaryAction) {
      primaryBtn.onclick = () => {
        closeNotification();
        onPrimaryAction();
      };
    }
    
    // Show notification
    container.classList.add('active');
  }
  
  // Close notification modal
  function closeNotification() {
    const container = document.getElementById('notificationContainer');
    container.classList.remove('active');
  }
  
  // Show confetti animation for wins
  function showConfetti() {
    // Check if confetti library is available
    if (typeof confetti === 'function') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      
      (function frame() {
        confetti({
          particleCount: 2,
          angle: randomInRange(55, 125),
          spread: randomInRange(50, 70),
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#4338ca', '#6ee7b7', '#fcd34d'],
          zIndex: 9999,
        });
        
        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }
  
  // Show alert banner
function showAlert(message, type = 'info') {
    const banner = document.getElementById('alertBanner');
    const messageEl = document.getElementById('alertMessage');
    
    // Remove previous classes
    banner.className = 'alert-banner';
    
    // Add type-specific class
    banner.classList.add(type);
    messageEl.textContent = message;
    
    // Show the banner
    banner.classList.add('show');
    
    // Auto hide after duration
    if (window.alertTimeout) {
      clearTimeout(window.alertTimeout);
    }
    
    window.alertTimeout = setTimeout(() => {
      closeAlert();
    }, config.alertDuration);
  }
  
  // Close alert banner
  function closeAlert() {
    const banner = document.getElementById('alertBanner');
    banner.classList.remove('show');
    
    if (window.alertTimeout) {
      clearTimeout(window.alertTimeout);
    }
  }
  
  // Utility functions
  function showError(message) {
    const gameMessage = document.getElementById('gameMessage');
    gameMessage.textContent = message;
    gameMessage.style.color = '#ef4444'; // Red
    
    // Also show as alert
    showAlert(message, 'error');
    
    hideLoadingScreen();
  }
  
  function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
  }
  
  // Helper to get authentication token if available
  function getToken() {
    // Try to get token from localStorage or other storage mechanism
    return localStorage.getItem('authToken') || '';
  }
  
  // Helper to format time
  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Helper to generate a simple unique ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 12);
  }
  
  // Save game state to localStorage for potential recovery
  function saveGameStateLocally() {
    try {
      localStorage.setItem(`gameState_${gameState.sessionId}`, JSON.stringify({
        sessionId: gameState.sessionId,
        playerId: gameState.playerId,
        lastUpdated: gameState.lastUpdated
      }));
    } catch (error) {
      console.warn('Failed to save game state locally:', error);
    }
  }
  
  // Try to recover game state from localStorage
  function tryRecoverGameState() {
    try {
      const savedState = localStorage.getItem(`gameState_${gameState.sessionId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('Recovered previous game state from local storage:', parsedState);
        return true;
      }
    } catch (error) {
      console.warn('Failed to recover game state:', error);
    }
    return false;
  }
  
  // Check for connection issues
  function checkConnectionStatus() {
    if (!navigator.onLine) {
      showAlert('You are offline. Reconnecting when network is available...', 'error');
      
      // Listen for online event
      window.addEventListener('online', () => {
        showAlert('You are back online! Reconnecting...', 'success');
        fetchSessionData();
      }, { once: true });
    }
  } 
  
  // Set up reconnection listeners
  function setupReconnectionListeners() {
    if (config.autoReconnect) {
      window.addEventListener('online', () => {
        fetchSessionData();
      });
      
      // Visibility change for when tab becomes active again
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          fetchSessionData();
        }
      });
    }
  }
  
  // Initialize the game when the page loads
  window.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupReconnectionListeners();
    
    // Check connection
    checkConnectionStatus();
    
    // Add confetti script if not already loaded
    if (typeof confetti !== 'function') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
      document.head.appendChild(script);
    }
  });