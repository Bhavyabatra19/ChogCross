# 🎮 ChogCross Gambling Game



## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser
- Monad Testnet wallet  

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/zacnider/ChogCross
cd game

# Install leaderboard server dependencies
cd leaderboard-server
npm install
cd ..
```

### 2. Start Leaderboard Server

```bash
# Navigate to leaderboard server directory
cd leaderboard-server

# Start the server (runs on port 3001)
npm start
```

You should see:
```
🗄️ Database initialized
🚀 Leaderboard server running on port 3001
📊 API endpoints:
   GET  /api/leaderboards
   GET  /api/player/:address
   POST /api/game
   POST /api/player/displayName
   GET  /health
```

### 3. Start Game

```bash
# In a new terminal, navigate to game directory
cd /path/to/chogson-game

# Start a local web server (choose one method):

# Method 1: Using Python 3
python3 -m http.server 8000

# Method 2: Using Python 2
python -m SimpleHTTPServer 8000

# Method 3: Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Method 4: Using PHP
php -S localhost:8000
```

### 4. Play the Game

1. Open your browser and go to: `http://localhost:8000`
2. Click "Play" to start the game
3. Connect your wallet when prompted (Privy handles this automatically)
4. The game will automatically switch to Monad Testnet
5. Start playing!

## 🎯 Game Features

- **Blockchain Integration**: All bets and winnings are handled on Monad Testnet
- **Wallet Management**: Seamless wallet connection via Privy
- **Leaderboard System**: Track your stats and compete with others
- **Sound Effects**: Immersive audio experience
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

### Frontend
- **JavaScript/CreateJS**: Game engine and UI
- **Privy SDK**: Wallet integration
- **Ethers.js**: Blockchain interactions

### Backend
- **Node.js/Express**: Leaderboard API server
- **LowDB**: JSON-based database
- **CORS**: Cross-origin support

### Blockchain
- **Monad Testnet**: Primary network
- **Smart Contract**: Game logic and randomness via Pyth Entropy

## 📁 Project Structure

```
chogson-game/
├── js/                     # Game JavaScript files
│   ├── CGame.js           # Main game logic
│   ├── CCharacter.js      # Character controls
│   ├── WalletManager.js   # Blockchain integration
│   ├── LeaderboardManager.js # Leaderboard client
│   └── ...
├── wallet/                # Privy wallet UI (React)
├── leaderboard-server/    # Node.js leaderboard server
│   ├── server.js         # Express server
│   ├── database.json     # Game data storage
│   └── package.json      # Dependencies
├── sounds/               # Audio files
├── sprites/              # Game graphics
├── game.html            # Main game page
└── README.md            # This file
```

## 🔧 Configuration

### Leaderboard Server
- **Port**: 3001 (configurable in `leaderboard-server/server.js`)
- **Database**: `leaderboard-server/database.json`
- **CORS**: Enabled for all origins

### Game Settings
- **Network**: Monad Testnet (automatically configured)
- **Bet Amount**: 1-5 MON
- **Difficulty**: Easy (1.28x - 7.19x) / Hard (1.60x - 34.30x)

## 🎮 How to Play

1. **Connect Wallet**: Game automatically prompts for wallet connection
2. **Choose Bet**: Select 1-5 MON and difficulty (Easy/Hard)
3. **Start Game**: Click "Start Game" and wait for VRF to be ready
4. **Jump**: Click to jump between platforms
5. **Cash Out**: Click "Cash Out" at any time to secure winnings
6. **Avoid Sharks**: Some platforms have hidden sharks that end the game

## 🏆 Leaderboard

The leaderboard tracks:
- **Total Winnings**: Highest total earnings
- **Best Streak**: Most platforms reached in a single game
- **Highest Multiplier**: Best multiplier achieved
- **Fastest Time**: Quickest game completion
- **Most Risky**: Highest risk games

## 🔍 Troubleshooting

### Leaderboard Server Won't Start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Restart server
npm start
```

### Game Won't Load
- Ensure you're accessing via `http://localhost:8000` (not file://)
- Check browser console for errors
- Verify leaderboard server is running

### Wallet Connection Issues
- Try refreshing the page
- Clear browser cache and cookies
- Ensure you're on a supported browser (Chrome, Firefox, Safari)

### VRF Not Ready
- Wait a few seconds and try again
- Check your network connection
- Verify you have sufficient MON balance for gas fees

## 🔗 Useful Commands

```bash
# Check leaderboard server health
curl http://localhost:3001/health

# View current leaderboards
curl http://localhost:3001/api/leaderboards

# Check player stats (replace with actual address)
curl http://localhost:3001/api/player/0x...

# Stop leaderboard server
# Press Ctrl+C in the terminal running the server
```

## 📝 Development

### Adding New Features
1. Game logic: Modify files in `js/` directory
2. Leaderboard: Update `leaderboard-server/server.js`
3. UI: Edit HTML/CSS files
4. Wallet: Modify `wallet/App.jsx` (React component)

### Testing
- Use browser developer tools for debugging
- Check console logs for detailed game flow
- Monitor network requests for API calls

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all services are running correctly
4. Verify network connectivity

## 🎉 Enjoy the Game!

Jump carefully, cash out wisely, and climb the leaderboard! 🏆
