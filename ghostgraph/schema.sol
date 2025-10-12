struct Player {
    address id;
    uint256 totalWins;
    uint256 totalLosses;
    uint256 totalWinnings;
    uint256 bestStreak;
    uint256 currentStreak;
    uint256 highestMultiplier;
    uint256 fastestTime; // (opsiyonel, round süresi için)
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
    uint256 duration; // (opsiyonel, round süresi için)
}