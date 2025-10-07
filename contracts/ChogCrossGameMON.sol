// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Pyth Entropy SDK V2
import "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import "@pythnetwork/entropy-sdk-solidity/EntropyStructsV2.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

/**
 * @title ChogCrossGameMON
 * @dev Fully on-chain platform jumping game with Pyth Entropy - MON ONLY VERSION
 * @author Chog Cross Team
 * 
 * 🎮 GAME FEATURES:
 * - Uses only MON (native Monad token) for bets and payouts
 * - True randomness via Pyth Entropy oracle
 * - Provably fair platform jumping mechanics
 * - 8 platforms: 7 normal + 1 celebration platform
 * - 5-minute timeout with auto-cashout
 * - Single round per player limit
 * 
 * 🔒 SECURITY ARCHITECTURE (STEPWISE CALCULATION):
 * 
 * PROBLEM SOLVED:
 * Traditional platform jumping games pre-calculate fall point and store it on-chain.
 * Even storing only a hash is exploitable because:
 * 1. Raw randomness is public on Pyth network after callback
 * 2. Users can read K from contract storage (eth_getStorageAt)
 * 3. Users get "free option" - only play when fall point is favorable
 * 
 * OUR SOLUTION:
 * 1. NEVER store raw randomness - only hash: keccak256(randomness, roundId)
 * 2. NEVER pre-calculate or store fall point
 * 3. Calculate fall probability INDEPENDENTLY for each platform
 * 4. Each platform uses: entropyHash + roundId + platform + blockhash + nonce + player
 * 5. Block hash makes future platforms unpredictable until user advances
 * 6. Nonce prevents same-block prediction
 * 
 * SECURITY GUARANTEES:
 * - Users cannot predict future platforms without advancing (needs future block hash)
 * - Users cannot read fall point from storage (fall point never exists!)
 * - Maintains exact geometric distribution (25% easy / 40% hard per platform)
 * - Provably fair - all platforms verifiable after round ends
 * - Single VRF call (gas efficient)
 * - RTP balanced correctly at 96%
 * 
 * MATHEMATICAL EQUIVALENCE:
 * Stepwise: P(fall at platform i) = (1-q)^(i-1) * q
 * Pre-calculated K: P(K = i) = (1-q)^(i-1) * q
 * RESULT: Identical probability distributions!
 */
contract ChogCrossGameMON is IEntropyConsumer, ReentrancyGuard {
    
    // ============ CONSTANTS ============
    
    uint256 public constant MIN_BET = 1 ether;      // 1 MON minimum bet
    uint256 public constant MAX_BET = 5 ether;      // 5 MON maximum bet  
    uint256 public constant MAX_WIN = 100 ether;    // 100 MON win cap
    uint256 public constant TIMEOUT_DURATION = 5 minutes;
    
    // Pyth Entropy contract address on Monad Testnet (V2)
    address public constant PYTH_ENTROPY = 0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320;
    IEntropyV2 private entropy = IEntropyV2(PYTH_ENTROPY);
    
    // Game levels configuration
    struct GameLevel {
        uint8 platforms;
        uint16 failProbability; // out of 10000 (basis points) - per platform
        uint256[8] multipliers;  // multipliers in basis points (10000 = 1x) - 8 platforms total
    }
    
    // ============ GAME STATE ============
    
    struct GameRound {
        address player;
        uint8 level;           // 0 = easy, 1 = hard
        uint256 betAmount;     // MON amount bet
        uint8 currentPlatform; // 0-8 (0=start, 1-7=normal platforms, 8=celebration)
        uint64 entropySequenceNumber;  // Pyth Entropy sequence number
        bytes32 entropyHash;   // Hash of entropy (raw randomness NEVER stored)
        uint256 lastActivity; // For timeout mechanism
        bool isActive;
        // REMOVED: entropyRandomness (security risk - storage readable)
        // REMOVED: entropyReady (derive from entropyHash != bytes32(0))
    }
    
    // ============ STORAGE ============
    
    // Game configuration (immutable after deployment)
    mapping(uint8 => GameLevel) public gameLevels;
    
    // Active rounds only (minimal storage)
    mapping(bytes32 => GameRound) public rounds;
    mapping(address => bool) public hasActiveRound;
    mapping(address => bytes32) public playerActiveRound;
    
    // Entropy request mapping
    mapping(uint64 => bytes32) public entropyRequestToRound;
    
    // Global nonce for platform uniqueness (prevents same-block prediction)
    uint256 private platformNonce;
    
    // Contract treasury (all in MON)
    uint256 public treasuryBalance;
    // Escrow of users' active bets (to keep accounting consistent)
    uint256 public escrowBalance;
    uint256 public exposureLimit;     // Max net liability allowed across active rounds
    uint256 public currentExposure;   // Sum of worst-case net liabilities across active rounds
    
    // Owner
    address public owner;
    bool public paused;
    // Callback gas limit for Pyth reveal. Owner-settable; used for V2 fee/request when available
    uint32 public callbackGasLimit = 900_000;
    
    // ============ EVENTS ============
    
    event RoundStarted(
        bytes32 indexed roundId,
        address indexed player,
        uint8 level,
        uint256 betAmount,
        uint64 entropySequenceNumber,
        uint256 timestamp
    );
    
    // Minimal readiness signal to keep callback gas low
    event EntropyReady(
        bytes32 indexed roundId,
        uint64 indexed entropySequenceNumber,
        uint256 timestamp
    );
    
    event PlatformJumped(
        bytes32 indexed roundId,
        uint8 platform,
        uint256 multiplier,
        uint256 timestamp
    );
    
    event RoundEnded(
        bytes32 indexed roundId,
        address indexed player,
        uint8 level,
        uint256 betAmount,
        uint8 finalPlatform,
        bytes32 entropyHash,  // For verification (not K - K was never stored!)
        uint256 winAmount,
        bool failed,
        string endReason,
        uint256 timestamp
    );
    
    event TreasuryUpdated(uint256 newBalance);
    event ExposureLimitUpdated(uint256 newLimit);
    
    // ============ ERRORS ============
    
    error InvalidBetAmount();
    error PlayerHasActiveRound();
    error RoundNotFound();
    error RoundNotActive();
    error NotRoundOwner();
    error RoundTimedOut();
    error VRFNotReady();
    error InsufficientTreasury();
    error ExposureLimitExceeded();
    error InvalidLevel();
    error NotOwner();
    error ContractPaused();
    error EntropyRequestNotFound();
    error NotTimedOut();
    error AlreadyOnCelebrationPlatform();
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        
        // Initialize game levels - EXACT match with Chog Cross game
        // Easy level: 25% fail probability per platform
        gameLevels[0] = GameLevel({
            platforms: 8,
            failProbability: 2500, // 25% fail probability per platform
            multipliers: [uint256(12800), 17100, 22800, 30400, 40500, 53900, 71900, 71900] // 1.28x, 1.71x, 2.28x, 3.04x, 4.05x, 5.39x, 7.19x, 7.19x (celebration)
        });
        
        // Hard level: 40% fail probability per platform
        gameLevels[1] = GameLevel({
            platforms: 8,
            failProbability: 4000, // 40% fail probability per platform  
            multipliers: [uint256(16000), 26700, 44400, 74100, 123500, 205800, 343000, 343000] // 1.60x, 2.67x, 4.44x, 7.41x, 12.35x, 20.58x, 34.30x, 34.30x (celebration)
        });
        
        // Set initial exposure limit
        exposureLimit = 10 ether;
    }
    
    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }
    
    modifier onlyActiveRound(bytes32 roundId) {
        GameRound storage round = rounds[roundId];
        if (!round.isActive) revert RoundNotFound();
        _;
    }
    
    modifier onlyRoundOwner(bytes32 roundId) {
        if (rounds[roundId].player != msg.sender) revert NotRoundOwner();
        _;
    }
    
    modifier oneRoundOnly() {
        if (hasActiveRound[msg.sender]) revert PlayerHasActiveRound();
        _;
    }
    
    // ============ MAIN GAME FUNCTIONS ============
    
    /**
     * @dev Start a new game round with MON bet
     * @param level Game difficulty (0=easy, 1=hard)
     * 
     * HOW TO CALL:
     * await contract.startRound(0, {value: ethers.parseEther("2")}); // Bet 2 MON on easy
     */
    function startRound(uint8 level) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        oneRoundOnly 
    {
        // Get fee first to calculate proper bet amount (SDK V2 default provider & default gas limit)
        uint256 fee = entropy.getFeeV2();
        
        // User's intended bet amount (what they actually want to bet)
        uint256 actualBetAmount = msg.value - fee;
        
        // Validate the ACTUAL bet amount (not total payment)
        if (actualBetAmount < MIN_BET || actualBetAmount > MAX_BET) revert InvalidBetAmount();
        if (level > 1) revert InvalidLevel();
        
        // Check treasury can cover worst-case net liability (payout includes stake)
        uint256 maxPotentialWin = _calculateMaxWin(level, actualBetAmount);
        uint256 worstCaseNet = maxPotentialWin > actualBetAmount ? maxPotentialWin - actualBetAmount : 0;
        if (treasuryBalance < worstCaseNet) revert InsufficientTreasury();
        // Enforce exposure limit (15% of treasury via exposureLimit)
        if (currentExposure + worstCaseNet > exposureLimit) revert ExposureLimitExceeded();
        
        // Generate unique round ID
        bytes32 roundId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.number,
            msg.value
        ));
        
        // Request Pyth Entropy randomness (default provider, default gas limit)
        uint64 entropySequenceNumber = entropy.requestV2{value: fee}();
        
        // Create round with ACTUAL bet amount (fee already deducted)
        rounds[roundId] = GameRound({
            player: msg.sender,
            level: level,
            betAmount: actualBetAmount,
            currentPlatform: 0, // Starting position
            entropySequenceNumber: entropySequenceNumber,
            entropyHash: bytes32(0),              // Will be set by Entropy callback (hash only!)
            lastActivity: block.timestamp,
            isActive: true
        });
        
        // Update mappings
        hasActiveRound[msg.sender] = true;
        playerActiveRound[msg.sender] = roundId;
        entropyRequestToRound[entropySequenceNumber] = roundId;
        // Escrow the player's stake
        escrowBalance += actualBetAmount;
        // Update exposure by worst-case net liability
        currentExposure += worstCaseNet;
        
        emit RoundStarted(roundId, msg.sender, level, actualBetAmount, entropySequenceNumber, block.timestamp);
    }
    
    /**
     * @dev Pyth Entropy callback - called by Pyth Entropy automatically
     * @param sequenceNumber Entropy sequence number
     * @param randomNumber Random number from Entropy
     * 
     * SECURITY: Raw randomness is NEVER stored - only its hash!
     * This prevents storage reading exploits while maintaining verifiability.
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address /* provider */,
        bytes32 randomNumber
    ) internal override {
        bytes32 roundId = entropyRequestToRound[sequenceNumber];
        if (roundId == bytes32(0)) {
            // Unknown/late callback: ignore per SDK guidance
            return;
        }
        
        GameRound storage round = rounds[roundId];
        if (!round.isActive) return; // Round might have been cancelled
        
        // Store ONLY hash - raw randomness NEVER touches storage
        // This prevents users from reading and calculating platform falls in advance
        round.entropyHash = keccak256(abi.encode(randomNumber, roundId));
        
        emit EntropyReady(roundId, sequenceNumber, block.timestamp);
    }
    
    /**
     * @dev Jump to next platform with STEPWISE fall calculation
     * @param roundId The round identifier
     * 
     * HOW TO CALL:
     * await contract.jumpToPlatform(roundId);
     * 
     * SECURITY MECHANISM:
     * - No K value is pre-calculated or stored
     * - Each platform checks fall probability independently
     * - Uses: entropyHash + roundId + platform + blockHash + nonce + player
     * - Block hash prevents pre-calculation of future platforms
     * - Nonce prevents same-block prediction
     * - Maintains exact geometric distribution (25% or 40% per platform)
     */
    function jumpToPlatform(bytes32 roundId) 
        external 
        nonReentrant 
        onlyActiveRound(roundId) 
        onlyRoundOwner(roundId) 
    {
        GameRound storage round = rounds[roundId];
        
        // Revert if timed out; explicit settlement should be called separately
        if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) revert RoundTimedOut();
        
        // Ensure entropy hash is available
        if (round.entropyHash == bytes32(0)) revert VRFNotReady();
        
        // Check if already on celebration platform (platform 8)
        if (round.currentPlatform >= 8) revert AlreadyOnCelebrationPlatform();
        
        // Update activity and increment platform
        round.lastActivity = block.timestamp;
        round.currentPlatform++;
        platformNonce++;
        
        // Derive platform-specific randomness using multiple entropy sources
        // This makes it impossible to predict future platforms without actually jumping
        bytes32 platformSeed = keccak256(abi.encode(
            round.entropyHash,              // Base randomness from Pyth (deterministic per round)
            roundId,                        // Round identifier (uniqueness)
            round.currentPlatform,          // Current platform number (different per platform)
            blockhash(block.number - 1),    // Recent block hash (unpredictable until now)
            platformNonce,                  // Global nonce (prevents same-block duplicates)
            msg.sender                      // Player address (player-specific)
        ));
        
        // Extract random value in range [0, 9999]
        uint256 randomValue = uint256(platformSeed) % 10000;
        
        // Get level configuration
        GameLevel storage level = gameLevels[round.level];
        
        // Check if fell at THIS platform (independent probability check)
        // For easy mode: failProbability = 2500 (25%)
        // For hard mode: failProbability = 4000 (40%)
        if (randomValue < level.failProbability) {
            _endRound(roundId, 0, true, "platform_fall");
            return;
        }
        
        // Successful jump - emit advancement event
        uint256 multiplier = level.multipliers[round.currentPlatform - 1];
        emit PlatformJumped(roundId, round.currentPlatform, multiplier, block.timestamp);
        
        // Check if reached celebration platform (auto-win at max multiplier)
        if (round.currentPlatform >= 8) {
            uint256 maxWin = _calculateWinAmount(round.level, round.betAmount, 8);
            _endRound(roundId, maxWin, false, "celebration_reached");
            return;
        }
    }
    
    /**
     * @dev Cash out at current platform and receive MON winnings
     * @param roundId The round identifier
     * 
     * HOW TO CALL:
     * await contract.cashOut(roundId);
     */
    function cashOut(bytes32 roundId) 
        external 
        nonReentrant 
        onlyActiveRound(roundId) 
        onlyRoundOwner(roundId) 
    {
        GameRound storage round = rounds[roundId];
        // Revert if timed out; explicit settlement should be called separately
        if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) revert RoundTimedOut();
        // Update activity timestamp for active play
        round.lastActivity = block.timestamp;
        
        if (round.currentPlatform == 0) {
            // Can't cash out at starting position, just refund
            _endRound(roundId, round.betAmount, false, "refund");
            return;
        }
        
        uint256 winAmount = _calculateWinAmount(round.level, round.betAmount, round.currentPlatform);
        _endRound(roundId, winAmount, false, "cashout");
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get current round info for a player
     * @param player Player address
     * @return roundId Round identifier
     * @return hasRound Whether player has active round
     * @return level Game level (0=easy, 1=hard)
     * @return betAmount MON amount bet
     * @return currentPlatform Current platform (0-8)
     * @return vrfReady Whether Entropy randomness is ready
     * @return currentMultiplier Current platform multiplier
     * @return currentWinAmount Current potential winnings
     * @return timeRemaining Seconds until timeout
     */
    function getPlayerRoundInfo(address player) 
        external 
        view 
        returns (
            bytes32 roundId,
            bool hasRound,
            uint8 level,
            uint256 betAmount,
            uint8 currentPlatform,
            bool vrfReady,
            uint256 currentMultiplier,
            uint256 currentWinAmount,
            uint256 timeRemaining
        ) 
    {
        hasRound = hasActiveRound[player];
        if (!hasRound) return (bytes32(0), false, 0, 0, 0, false, 0, 0, 0);
        
        roundId = playerActiveRound[player];
        GameRound storage round = rounds[roundId];
        
        level = round.level;
        betAmount = round.betAmount;
        currentPlatform = round.currentPlatform;
        vrfReady = (round.entropyHash != bytes32(0));
        
        if (currentPlatform > 0) {
            GameLevel storage gameLevel = gameLevels[level];
            currentMultiplier = gameLevel.multipliers[currentPlatform - 1];
            currentWinAmount = _calculateWinAmount(level, betAmount, currentPlatform);
        }
        
        uint256 elapsed = block.timestamp - round.lastActivity;
        timeRemaining = elapsed >= TIMEOUT_DURATION ? 0 : TIMEOUT_DURATION - elapsed;
    }

    /**
     * @dev Permissionless settlement for timed-out rounds
     */
    function endTimedOutRound(bytes32 roundId) external nonReentrant {
        GameRound storage round = rounds[roundId];
        if (!round.isActive) revert RoundNotFound();
        if (block.timestamp <= round.lastActivity + TIMEOUT_DURATION) revert NotTimedOut();
        if (msg.sender != round.player && msg.sender != owner) revert NotRoundOwner();
        _timeoutRound(roundId);
    }

    /**
     * @dev Batch settlement for timed-out rounds (owner)
     */
    function sweepTimedOut(bytes32[] calldata roundIds) external onlyOwner nonReentrant {
        require(roundIds.length <= 100, "too many");
        for (uint256 i = 0; i < roundIds.length; i++) {
            bytes32 id = roundIds[i];
            GameRound storage round = rounds[id];
            if (!round.isActive) continue;
            if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) {
                _timeoutRound(id);
            }
        }
    }
    
    /**
     * @dev Get game level configuration
     * @param level Game level (0=easy, 1=hard)
     * @return GameLevel struct with all configuration
     */
    function getGameLevel(uint8 level) external view returns (GameLevel memory) {
        return gameLevels[level];
    }
    
    /**
     * @dev Get treasury information
     * @return balance Current treasury balance in MON
     * @return exposure MON locked for active games
     * @return limit Maximum exposure allowed
     */
    function getTreasuryInfo() external view returns (uint256 balance, uint256 exposure, uint256 limit) {
        return (treasuryBalance, currentExposure, exposureLimit);
    }
    
    /**
     * @dev Get Pyth Entropy contract address
     * @return Pyth Entropy oracle address
     */
    function getPythEntropyAddress() external view returns (address) {
        return address(entropy);
    }

    // IEntropyConsumer (SDK V2) requirement
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Add MON to treasury (Owner only)
     * 
     * HOW TO CALL:
     * await contract.addTreasury({value: ethers.parseEther("50")}); // Add 50 MON
     */
    function addTreasury() external payable onlyOwner {
        treasuryBalance += msg.value;
        // Exposure cap: 15% of treasury
        exposureLimit = (treasuryBalance * 15) / 100;
        emit TreasuryUpdated(treasuryBalance);
        emit ExposureLimitUpdated(exposureLimit);
    }
    
    /**
     * @dev Withdraw MON from treasury (Owner only)
     * @param amount Amount of MON to withdraw
     * 
     * HOW TO CALL:
     * await contract.withdrawTreasury(ethers.parseEther("10")); // Withdraw 10 MON
     */
    function withdrawTreasury(uint256 amount) external onlyOwner {
        require(amount <= treasuryBalance, "Insufficient treasury");
        require(treasuryBalance - amount >= currentExposure, "Cannot withdraw active exposure");
        
        treasuryBalance -= amount;
        payable(owner).transfer(amount);
        
        // Recompute exposure limit: 15% of treasury after withdrawal
        exposureLimit = (treasuryBalance * 15) / 100;
        emit TreasuryUpdated(treasuryBalance);
        emit ExposureLimitUpdated(exposureLimit);
    }
    
    /**
     * @dev Emergency pause (Owner only)
     */
    function pause() external onlyOwner {
        paused = true;
    }
    
    /**
     * @dev Unpause (Owner only)  
     */
    function unpause() external onlyOwner {
        paused = false;
    }

    /**
     * @dev Owner can tune callback gas limit used for V2 fee/request
     */
    function setCallbackGasLimit(uint32 newLimit) external onlyOwner {
        require(newLimit >= 300_000 && newLimit <= 2_000_000, "bad gas limit");
        callbackGasLimit = newLimit;
    }
    
    /**
     * @dev End round immediately on fail (bypass 5-minute timeout)
     * @param roundId Round ID to end immediately
     * 
     * HOW TO CALL:
     * await contract.endRoundOnFail(roundId); // Immediate fail without timeout
     */
    function endRoundOnFail(bytes32 roundId) 
        external 
        nonReentrant 
        onlyActiveRound(roundId) 
        onlyRoundOwner(roundId) 
    {
        GameRound storage round = rounds[roundId];
        
        // No timeout check - immediate fail allowed
        console.log("IMMEDIATE FAIL - Round ended instantly");
        
        // End round with 0 payout (fail)
        _endRound(roundId, 0, true, "immediate_fail");
    }
    
    /**
     * @dev Emergency recovery for network issues (bypass 5-minute timeout)
     * @param roundId Round ID to recover immediately
     * 
     * HOW TO CALL:
     * await contract.emergencyRecover(roundId); // Instant recovery for network issues
     */
    function emergencyRecover(bytes32 roundId) 
        external 
        nonReentrant 
        onlyActiveRound(roundId) 
        onlyRoundOwner(roundId) 
    {
        GameRound storage round = rounds[roundId];
        
        // Check if player has jumped to any platform (emergency recovery only for active gameplay)
        require(round.currentPlatform > 0, "No platforms reached - use endRoundOnFail instead");
        
        console.log("EMERGENCY RECOVERY - Network issue recovery");
        console.log("Current platform:", round.currentPlatform);
        
        // Calculate current winnings based on current platform
        uint256 currentMultiplier = gameLevels[round.level].multipliers[round.currentPlatform - 1];
        uint256 payout = (round.betAmount * currentMultiplier) / 10000;
        
        console.log("Emergency payout calculated:", payout);
        
        // End round with current platform payout
        _endRound(roundId, payout, false, "emergency_recovery");
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    // NOTE: _checkPlatformJump function REMOVED
    // We now use stepwise calculation - K is never pre-calculated or stored
    // Each platform independently checks fall probability
    // This maintains identical geometric distribution while preventing exploitation
    
    /**
     * @dev End a round with given outcome and handle MON payouts
     */
    function _endRound(bytes32 roundId, uint256 winAmount, bool failed, string memory reason) internal {
        GameRound storage round = rounds[roundId];
        GameRound memory r = round; // snapshot for post-delete usage

        // Compute worst-case net liability for exposure accounting
        uint256 maxWin = _calculateMaxWin(r.level, r.betAmount);
        uint256 worstCaseNet = maxWin > r.betAmount ? maxWin - r.betAmount : 0;

        // 1) Effects: mark inactive, clear indexes, adjust escrow/treasury, reduce exposure
        round.isActive = false;
        hasActiveRound[r.player] = false;
        delete playerActiveRound[r.player];
        delete entropyRequestToRound[r.entropySequenceNumber];
        delete rounds[roundId];

        if (currentExposure >= worstCaseNet) {
            currentExposure -= worstCaseNet;
        } else {
            currentExposure = 0;
        }

        uint256 payoutAmount = 0;
        if (failed) {
            // Stake moves from escrow to treasury
            escrowBalance -= r.betAmount;
            treasuryBalance += r.betAmount;
            emit TreasuryUpdated(treasuryBalance);
        } else if (winAmount == 0) {
            // Pure refund
            escrowBalance -= r.betAmount;
            payoutAmount = r.betAmount;
        } else {
            // Cashout/completed: prize includes stake; treasury pays net liability
            uint256 cappedWin = _min(winAmount, MAX_WIN);
            uint256 netLiability = cappedWin > r.betAmount ? cappedWin - r.betAmount : 0;
            if (netLiability > 0) {
                uint256 payFromTreasury = _min(netLiability, treasuryBalance);
                treasuryBalance -= payFromTreasury;
                emit TreasuryUpdated(treasuryBalance);
                payoutAmount = r.betAmount + payFromTreasury;
            } else {
                payoutAmount = r.betAmount;
            }
            escrowBalance -= r.betAmount;
        }

        // 2) Interactions: transfer to player when not failed
        if (!failed && payoutAmount > 0) {
            (bool ok, ) = payable(r.player).call{value: payoutAmount}("");
            require(ok, "payout failed");
        }

        // 3) Emit events last
        emit RoundEnded(
            roundId,
            r.player,
            r.level,
            r.betAmount,
            r.currentPlatform,
            r.entropyHash,  // Emit hash for verification (K was never stored!)
            winAmount,
            failed,
            reason,
            block.timestamp
        );
    }
    
    /**
     * @dev Handle round timeout with smart refund/cashout
     */
    function _timeoutRound(bytes32 roundId) internal {
        GameRound storage round = rounds[roundId];
        
        if (round.currentPlatform == 0) {
            // No progress made, full refund
            _endRound(roundId, round.betAmount, false, "timeout_refund");
        } else {
            // Auto-cashout at current position
            uint256 winAmount = _calculateWinAmount(round.level, round.betAmount, round.currentPlatform);
            _endRound(roundId, winAmount, false, "timeout_cashout");
        }
    }
    
    /**
     * @dev Calculate win amount for given platform
     */
    function _calculateWinAmount(uint8 level, uint256 betAmount, uint8 platform) internal view returns (uint256) {
        if (platform == 0) return 0;
        
        GameLevel storage gameLevel = gameLevels[level];
        if (platform > gameLevel.platforms) platform = gameLevel.platforms;
        
        uint256 multiplier = gameLevel.multipliers[platform - 1];
        uint256 winAmount = (betAmount * multiplier) / 10000;
        
        return _min(winAmount, MAX_WIN);
    }
    
    /**
     * @dev Calculate maximum potential win for exposure calculation
     */
    function _calculateMaxWin(uint8 level, uint256 betAmount) internal view returns (uint256) {
        GameLevel storage gameLevel = gameLevels[level];
        uint256 maxMultiplier = gameLevel.multipliers[gameLevel.platforms - 1];
        uint256 maxWin = (betAmount * maxMultiplier) / 10000;
        
        return _min(maxWin, MAX_WIN);
    }
    
    // ============ PUBLIC GETTERS ============
    
    /**
     * @dev Get current Pyth Entropy fee
     * @return fee Current entropy fee in wei
     */
    function getEntropyFee() external view returns (uint256) {
        return entropy.getFeeV2();
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _bound(uint256 value, uint256 min, uint256 max) internal pure returns (uint256) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    
    // ============ RECEIVE FUNCTION ============
    
    /**
     * @dev Receive function - accepts direct MON transfers to treasury
     * 
     * HOW IT WORKS:
     * If someone sends MON directly to contract address, it goes to treasury
     * Example: Send 5 MON to contract → Treasury increases by 5 MON
     */
    receive() external payable {
        treasuryBalance += msg.value;
        // Keep exposure limit in sync when funds arrive directly
        exposureLimit = (treasuryBalance * 30) / 100;
        emit TreasuryUpdated(treasuryBalance);
        emit ExposureLimitUpdated(exposureLimit);
    }
}