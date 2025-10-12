#  ChogCross Gambling Game



## Quick Start

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

```

### 2. Start Game

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

### 3. Play the Game

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
- **GhostGraph**: Decentralized indexing service
- **Blockchain Events**: Real-time data from smart contracts

### Blockchain
- **Monad Testnet**: Primary network
- **Smart Contract**: Game logic and randomness via Pyth Entropy

### GhostGraph Integration
- **GhostGraph**: Decentralized indexing service for leaderboard data
- **Indexer Contract**: Processes game events and updates player stats
- **Schema**: Defines player and game result data structures

## 📁 Project Structure

```
chogson-game/
├── js/                     # Game JavaScript files
│   ├── CGame.js           # Main game logic
│   ├── CCharacter.js      # Character controls
│   ├── WalletManager.js   # Blockchain integration
│   ├── LeaderboardManager.js # Leaderboard client
│   ├── GhostGraphService.js # GhostGraph integration
│   └── ...
├── wallet/                # Privy wallet UI (React)
├── ghostgraph/            # GhostGraph indexer files
│   ├── events.sol        # Event definitions
│   ├── indexer.sol       # Indexer contract
│   └── schema.sol        # Data schema
├── sounds/               # Audio files
├── sprites/              # Game graphics
├── game.html            # Main game page
└── README.md            # This file
```

## 🔧 Configuration

### Game Settings
- **Network**: Monad Testnet (automatically configured)
- **Bet Amount**: 1-5 MON
- **Difficulty**: Easy (1.28x - 7.19x) / Hard (1.60x - 34.30x)

### GhostGraph Setup
- **Contract Address**: `0xe8a83303Ba69b4f15Bb3D939952CDb6aaAA4b988` (Monad Testnet)
- **Events**: `RoundEnded` event tracks game results
- **Schema**: Player stats and game results indexed automatically

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

## 🔮 GhostGraph Setup

GhostGraph is a decentralized service that automatically indexes game data from the blockchain. We'll use the GhostGraph web interface to set up our indexer.

### 1. Create GhostGraph Account

1. Go to [GhostGraph Dashboard](https://dashboard.ghostlogs.xyz)
2. Sign up for a new account
3. Log in to your dashboard

### 2. Create New Graph

1. Navigate to the **Library** tab
2. Click **"Create New Graph"** or fork an existing template
3. Enter graph name (e.g., "ChogCross-Leaderboard")
4. Select **"Monad Testnet"** as network
5. Save the Graph ID after creation

### 3. Define Events

1. Go to the **Events** tab in your graph
2. Click on the code editor box
3. Add the following event definition:

```solidity
interface Events {
    event RoundEnded(
        bytes32 indexed roundId,
        address indexed player,
        uint8 level,
        uint256 betAmount,
        uint8 finalPlatform,
        bytes32 entropyHash,
        uint256 winAmount,
        bool failed,
        string endReason,
        uint256 timestamp
    );
}
```

### 4. Define Schema

1. Go to the **Schema** tab
2. Add the following structs:

```solidity
struct Player {
    address id;
    uint256 totalWins;
    uint256 totalLosses;
    uint256 totalWinnings;
    uint256 bestStreak;
    uint256 currentStreak;
    uint256 highestMultiplier;
    uint256 fastestTime;
    uint256 biggestBet;
}

struct GameResult {
    string id;
    address player;
    uint8 level;
    uint256 betAmount;
    uint8 finalPlatform;
    uint256 winAmount;
    bool failed;
    string endReason;
    uint256 timestamp;
    uint256 duration;
}
```

### 5. Create Indexer

1. Go to the **Indexer** tab
2. Add the following indexer code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./gen_schema.sol";
import "./gen_events.sol";
import "./gen_base.sol";
import "./gen_helpers.sol";

contract MyIndex is GhostGraph {
    using StringHelpers for EventDetails;
    using StringHelpers for uint256;
    using StringHelpers for address;

    // Add your contract address here!
    address constant CHOG_CROSS_CONTRACT = 0xe8a83303Ba69b4f15Bb3D939952CDb6aaAA4b988;

    function registerHandles() external {
        graph.registerHandle(CHOG_CROSS_CONTRACT);
    }

    function onRoundEnded(EventDetails memory details, RoundEndedEvent memory ev) external {
        Player memory player = graph.getPlayer(ev.player);

        // Win/Loss and total winnings
        if (!ev.failed) {
            player.totalWins += 1;
            player.totalWinnings += ev.winAmount;
            player.currentStreak += 1;
            if (player.currentStreak > player.bestStreak) {
                player.bestStreak = player.currentStreak;
            }
            // Highest multiplier
            if (ev.finalPlatform > player.highestMultiplier) {
                player.highestMultiplier = ev.finalPlatform;
            }
            // Biggest bet
            if (ev.betAmount > player.biggestBet) {
                player.biggestBet = ev.betAmount;
            }
        } else {
            player.totalLosses += 1;
            player.currentStreak = 0;
        }

        graph.savePlayer(player);

        // Game result record
        GameResult memory result = graph.getGameResult(details.uniqueId());
        result.player = ev.player;
        result.level = ev.level;
        result.betAmount = ev.betAmount;
        result.finalPlatform = ev.finalPlatform;
        result.winAmount = ev.winAmount;
        result.failed = ev.failed;
        result.endReason = ev.endReason;
        result.timestamp = ev.timestamp;
        graph.saveGameResult(result);
    }
}
```

### 6. Compile and Deploy

1. Click **"Compile"** to check for syntax errors
2. Click **"Deploy"** to deploy your indexer
3. Wait for deployment to complete and sync with the chain
4. Save the deployed contract address

### 7. Register Contract Handle

1. After deployment, click **"Register Handles"** button
2. This will automatically call the `registerHandles()` function
3. Verify the contract is registered successfully

### 8. Get Query URL

1. Click the **"Query"** button to get your GraphQL endpoint
2. Copy the query URL (it will look like: `https://api.ghostlogs.xyz/gg/pub/<graph-id>/ghostgraph`)
3. Save this URL for frontend integration

### 9. Frontend Integration

Update the GraphQL endpoint in `js/GhostGraphService.js`:

```javascript
// Update the GraphQL endpoint
const GRAPHQL_ENDPOINT = "https://api.ghostlogs.xyz/gg/pub/<your-graph-id>/ghostgraph";
```

### 10. Test Your Setup

1. Go to the **Playground** tab in GhostGraph dashboard
2. Test your GraphQL queries:

```graphql
query GetAllPlayers {
  players(
    orderBy: "totalWinnings",
    orderDirection: "desc",
    limit: 100
  ) {
    items {
      id
      totalWins
      totalLosses
      totalWinnings
      bestStreak
      highestMultiplier
      biggestBet
    }
  }
}
```

3. Start the game and play a round
4. Check if data appears in the GraphQL playground
5. Verify data appears in your game's leaderboard

### 11. Troubleshooting

**No data coming:**
- Check if contract address is correct in indexer
- Verify events are being emitted from your game contract
- Check if indexer contract is active and synced

**GraphQL errors:**
- Verify the query URL is correct
- Check if the graph is properly deployed and synced
- Ensure the network is Monad Testnet

**Deployment issues:**
- Check for syntax errors in your code
- Verify all required imports are available
- Ensure you have sufficient permissions to deploy

## 🔍 Troubleshooting

### Game Won't Load
- Ensure you're accessing via `http://localhost:8000` (not file://)
- Check browser console for errors
- Verify GhostGraph indexer is properly configured

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
# Check GhostGraph GraphQL endpoint
curl -X POST https://api.ghostlogs.xyz/gg/pub/<GRAPH_ID>/ghostgraph \
  -H "Content-Type: application/json" \
  -d '{"query": "query { players { id totalWinnings } }"}'

# View GhostGraph dashboard
# Visit https://dashboard.ghostlogs.xyz
```

## 📝 Development

### Adding New Features
1. Game logic: Modify files in `js/` directory
2. Leaderboard: Update GhostGraph indexer and schema
3. UI: Edit HTML/CSS files
4. Wallet: Modify `wallet/App.jsx` (React component)

### Testing
- Use browser developer tools for debugging
- Check console logs for detailed game flow
- Monitor network requests for API calls


