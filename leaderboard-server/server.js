const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Default data structure
const defaultData = {
  players: {},
  games: [],
  leaderboards: {
    totalWinnings: [],
    bestStreak: [],
    highestMultiplier: [],
    fastestTime: [],
    mostRisky: []
  },
  statistics: {
    totalGames: 0,
    totalPlayers: 0,
    totalWinnings: 0,
    lastUpdated: new Date().toISOString()
  }
};

// Database setup
const adapter = new JSONFile(path.join(__dirname, 'database.json'));
const db = new Low(adapter, defaultData);

// Initialize database
async function initDatabase() {
  await db.read();
  db.data = db.data || defaultData;
  await db.write();
  console.log('🗄️ Database initialized');
}

// Utility functions
function isValidEthereumAddress(address) {
  try {
    return ethers.utils.isAddress(address);
  } catch (error) {
    return false;
  }
}

function updateLeaderboards() {
  const players = Object.values(db.data.players);
  
  // Total Winnings Leaderboard
  db.data.leaderboards.totalWinnings = players
    .sort((a, b) => b.totalWinnings - a.totalWinnings)
    .slice(0, 10);
  
  // Best Streak Leaderboard
  db.data.leaderboards.bestStreak = players
    .filter(p => p.bestStreak > 0)
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 10);
  
  // Highest Multiplier Leaderboard
  db.data.leaderboards.highestMultiplier = players
    .filter(p => p.highestMultiplier > 0)
    .sort((a, b) => b.highestMultiplier - a.highestMultiplier)
    .slice(0, 10);
  
  // Fastest Time Leaderboard
  db.data.leaderboards.fastestTime = players
    .filter(p => p.fastestTime > 0)
    .sort((a, b) => a.fastestTime - b.fastestTime)
    .slice(0, 10);
  
  // Most Risky Leaderboard (highest bet amounts)
  db.data.leaderboards.mostRisky = players
    .filter(p => p.highestBet > 0)
    .sort((a, b) => b.highestBet - a.highestBet)
    .slice(0, 10);
}

function updateStatistics() {
  const players = Object.values(db.data.players);
  
  db.data.statistics = {
    totalGames: db.data.games.length,
    totalPlayers: players.length,
    totalWinnings: players.reduce((sum, p) => sum + p.totalWinnings, 0),
    averageMultiplier: db.data.games.length > 0 
      ? db.data.games.reduce((sum, g) => sum + g.multiplier, 0) / db.data.games.length 
      : 0,
    lastUpdated: new Date().toISOString()
  };
}

// API Routes

// GET /api/leaderboards - Get all leaderboards
app.get('/api/leaderboards', async (req, res) => {
  try {
    await db.read();
    res.json({
      success: true,
      data: {
        leaderboards: db.data.leaderboards,
        statistics: db.data.statistics
      }
    });
  } catch (error) {
    console.error('❌ Error fetching leaderboards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboards'
    });
  }
});

// GET /api/player/:address - Get player stats
app.get('/api/player/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    await db.read();
    const player = db.data.players[address];
    
    if (!player) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    // Get player's games
    const playerGames = db.data.games.filter(game => game.playerAddress === address);
    
    res.json({
      success: true,
      data: {
        player,
        games: playerGames
      }
    });
  } catch (error) {
    console.error('❌ Error fetching player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player data'
    });
  }
});

// POST /api/game - Submit new game result
app.post('/api/game', async (req, res) => {
  try {
    const {
      playerAddress,
      betAmount,
      difficulty,
      platforms,
      multiplier,
      winnings,
      gameTime,
      txHash,
      displayName
    } = req.body;
    
    console.log(`📥 Received game submission:`, {
      playerAddress,
      betAmount,
      difficulty,
      platforms,
      multiplier,
      winnings,
      gameTime,
      txHash
    });
    
    // Validate required fields
    if (!playerAddress || !isValidEthereumAddress(playerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing player address'
      });
    }
    
    // Detailed validation with specific error messages
    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid betAmount: ' + betAmount
      });
    }
    
    if (!multiplier || multiplier <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid multiplier: ' + multiplier
      });
    }
    
    if (platforms === undefined || platforms === null || platforms < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platforms: ' + platforms
      });
    }
    
    if (!gameTime || gameTime <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gameTime: ' + gameTime
      });
    }
    
    console.log(`🔍 Validation passed - betAmount: ${betAmount}, multiplier: ${multiplier}, platforms: ${platforms}, gameTime: ${gameTime}`);
    
    await db.read();
    
    // Create or update player
    if (!db.data.players[playerAddress]) {
      db.data.players[playerAddress] = {
        address: playerAddress,
        displayName: displayName || `Player${Math.random().toString(36).substring(2, 8)}`,
        totalGames: 0,
        totalWinnings: 0,
        bestStreak: 0,
        highestMultiplier: 0,
        fastestTime: 0,
        highestBet: 0,
        createdAt: new Date().toISOString(),
        lastPlayed: new Date().toISOString()
      };
    }
    
    const player = db.data.players[playerAddress];
    
    // Update player stats
    player.totalGames += 1;
    
    // Add net winnings (profit only) to total winnings
    // winnings field now contains net profit (total payout - bet amount)
    const netWinnings = parseFloat(winnings || 0);
    player.totalWinnings += netWinnings;
    
    console.log(`💰 Player ${playerAddress}: Adding ${netWinnings} MON net profit to total winnings`);
    
    player.lastPlayed = new Date().toISOString();
    
    if (platforms > player.bestStreak) {
      player.bestStreak = platforms;
    }
    
    if (multiplier > player.highestMultiplier) {
      player.highestMultiplier = multiplier;
    }
    
    if (betAmount > player.highestBet) {
      player.highestBet = betAmount;
    }
    
    if (player.fastestTime === 0 || gameTime < player.fastestTime) {
      player.fastestTime = gameTime;
    }
    
    // Create game record
    const gameRecord = {
      id: `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      playerAddress,
      betAmount: parseFloat(betAmount),
      difficulty: difficulty || 'easy',
      platforms: parseInt(platforms),
      multiplier: parseFloat(multiplier),
      winnings: netWinnings, // Store net winnings (profit only)
      totalPayout: parseFloat(betAmount) * parseFloat(multiplier), // Store total payout for reference
      gameTime: parseInt(gameTime),
      txHash: txHash || null,
      timestamp: new Date().toISOString()
    };
    
    // Add game to database
    db.data.games.push(gameRecord);
    
    // Update leaderboards and statistics
    updateLeaderboards();
    updateStatistics();
    
    // Save to file
    await db.write();
    
    console.log(`🎮 New game recorded for ${playerAddress}: ${platforms} platforms, ${multiplier}x multiplier, ${netWinnings} MON net profit`);
    
    res.json({
      success: true,
      message: 'Game result saved successfully',
      data: {
        gameId: gameRecord.id,
        player: player,
        winnings: netWinnings,
        playerAddress: playerAddress,
        totalWinnings: player.totalWinnings
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save game result'
    });
  }
});

// POST /api/player/displayName - Update player display name
app.post('/api/player/displayName', async (req, res) => {
  try {
    const { playerAddress, displayName } = req.body;
    
    if (!playerAddress || !isValidEthereumAddress(playerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address'
      });
    }
    
    if (!displayName || displayName.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Display name must be 1-20 characters'
      });
    }
    
    await db.read();
    
    if (!db.data.players[playerAddress]) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    db.data.players[playerAddress].displayName = displayName;
    await db.write();
    
    res.json({
      success: true,
      message: 'Display name updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating display name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update display name'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Leaderboard server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Leaderboard server running on port ${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /api/leaderboards`);
    console.log(`   GET  /api/player/:address`);
    console.log(`   POST /api/game`);
    console.log(`   POST /api/player/displayName`);
    console.log(`   GET  /health`);
  });
}

startServer().catch(console.error);
