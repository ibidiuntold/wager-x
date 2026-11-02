export const gameConfigs = {
  'abuja-hand': {
    id: 'abuja-hand',
    title: 'Abuja Hand',
    slug: 'abuja-hand',
    description: 'Nigerian style BlackJack - get as close to 21 as you can!',
    instructions: 'Beat the dealer\'s hand without going over 21. Blackjacks pays 3:2.',
    image: '/images/games/blackjack.jpg',
    link: '/game/abuja-hand',
    gameDirectory: '/public/game-assets/abuja-hand',
    activeStatus: true,
    minWager: 200,
    maxWager: 10000,
    monthPlayers: 0,
    keywords: ['all', 'cards', 'wagerx', 'top'],
    houseEdge: 3.5,
    gameSettings: {
      maxPlayers: 1,
      timeLimit: 30,
      minBalance: 200,
      turnDuration: 30
    }
  },
  'kalo-kalo': {
    id: 'kalo-kalo',
    title: 'Naija Roulette (Kalo Kalo)',
    slug: 'kalo-kalo',
    description: 'Nigerian style roulette with unique betting options!',
    instructions: 'Place your bets on numbers, colors, or special combinations. Watch the ball land for instant results.',
    image: '/images/games/kalo-kalo.jpg',
    link: '/game/kalo-kalo',
    gameDirectory: '/public/game-assets/kalo-kalo',
    activeStatus: true,
    minWager: 100,
    maxWager: 10000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'table', 'wagerx'],
    houseEdge: 4.5,
    gameSettings: {
      maxPlayers: 8,
      timeLimit: 45,
      minBalance: 100,
      turnDuration: 45
    }
  },
  'last-man-standing': {
    id: 'last-man-standing',
    title: 'Last Man Standing',
    slug: 'last-man-standing',
    description: 'Test your nerves in this intense multiplayer game!',
    instructions: 'Watch the multiplier grow but cash out before the crash. Last player to cash out loses!',
    image: '/images/games/last-man-standing.jpg',
    link: '/game/last-man-standing',
    gameDirectory: '/public/game-assets/last-man-standing',
    activeStatus: true,
    minWager: 200,
    maxWager: 10000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'multiplayer', 'wagerx'],
    houseEdge: 5,
    gameSettings: {
      maxPlayers: 10,
      timeLimit: 180,
      minBalance: 200
    }
  },
  'naija-trivia': {
    id: 'naija-trivia',
    title: 'Naija Trivia',
    slug: 'naija-trivia',
    description: 'Test your knowledge of Nigerian culture, history, and current events!',
    instructions: 'Answer questions correctly to win. Faster answers get higher rewards.',
    image: '/images/games/naija-trivia.jpg',
    link: '/game/naija-trivia',
    gameDirectory: '/public/game-assets/naija-trivia',
    activeStatus: true,
    minWager: 50,
    maxWager: 1000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'knowledge', 'wagerx', 'top'],
    houseEdge: 2,
    gameSettings: {
      maxPlayers: 4,
      timeLimit: 15,
      minBalance: 50,
      turnDuration: 15
    }
  },
  'okada-rush': {
    id: 'okada-rush',
    title: 'Okada Rush',
    slug: 'okada-rush',
    description: 'Navigate through Lagos traffic and collect points while avoiding risks!',
    instructions: 'Click tiles to reveal rewards. Avoid accidents to cash out with bigger rewards.',
    image: '/images/games/okada-rush.jpg',
    link: '/game/okada-rush',
    gameDirectory: '/public/game-assets/okada-rush',
    activeStatus: true,
    minWager: 100,
    maxWager: 5000,
    monthPlayers: 0,
    keywords: ['all', 'mines', 'wagerx', 'top'],
    houseEdge: 4,
    gameSettings: {
      maxPlayers: 1,
      timeLimit: 300,
      minBalance: 100
    }
  },
  'rock-paper-scissors': {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    slug: 'rock-paper-scissors',
    description: 'Quick five rounds of the classic hand game with a Nigerian twist!',
    instructions: 'Choose your move and beat your opponent. Best of three rounds wins.',
    image: '/images/games/rps.jpg',
    link: '/game/rock-paper-scissors',
    gameDirectory: '/public/game-assets/rock-paper-scissors',
    activeStatus: true,
    minWager: 50,
    maxWager: 2000,
    monthPlayers: 0,
    keywords: ['all', 'quick', 'wagerx'],
    houseEdge: 2,
    gameSettings: {
      maxPlayers: 2,
      timeLimit: 10,
      minBalance: 50,
      turnDuration: 10
    }
  },
  'rolling-dice': {
    id: 'rolling-dice',
    title: 'Rolling Dice',
    slug: 'rolling-dice',
    description: 'Lagos style dice rolling game with exciting multipliers!',
    instructions: 'Roll the dice and match numbers to win. Higher combinations give better payouts.',
    image: '/images/games/rolling-dice.jpg',
    link: '/game/rolling-dice',
    gameDirectory: '/public/game-assets/rolling-dice',
    activeStatus: true,
    minWager: 100,
    maxWager: 5000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'dice', 'wagerx', 'top'],
    houseEdge: 3,
    gameSettings: {
      maxPlayers: 2,
      timeLimit: 20,
      minBalance: 100,
      turnDuration: 20
    }
  },
  'spin-wheel': {
    id: 'spin-wheel',
    title: 'Spin Wheel',
    slug: 'spin-wheel',
    description: 'Spin the wheel of fortune for instant wins and multipliers!',
    instructions: 'Place your bet and spin the wheel. Land on multipliers to increase your winnings.',
    image: '/images/games/spinwheel.jpg',
    link: '/game/spin-wheel',
    gameDirectory: '/public/game-assets/spin-wheel',
    activeStatus: true,
    minWager: 100,
    maxWager: 5000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'instant', 'wagerx'],
    houseEdge: 3.5,
    gameSettings: {
      maxPlayers: 1,
      timeLimit: 5,
      minBalance: 100,
      turnDuration: 5
    }
  },
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    slug: 'tic-tac-toe',
    description: 'Classic game of X\'s and O\'s with a wagering twist!',
    instructions: 'Get three in a row to win. Play against friends or try your luck against the house.',
    image: '/images/games/tic-tac-toe.jpg',
    link: '/game/tic-tac-toe',
    gameDirectory: '/public/game-assets/tic-tac-toe',
    activeStatus: true,
    minWager: 100,
    maxWager: 3000,
    monthPlayers: 0,
    keywords: ['all', 'new', 'classic', 'wagerx'],
    houseEdge: 2.5,
    gameSettings: {
      maxPlayers: 2,
      timeLimit: 30,
      minBalance: 100,
      turnDuration: 30
    }
  }
} as const;

export type GameId = keyof typeof gameConfigs;
export type GameConfig = typeof gameConfigs[GameId];
