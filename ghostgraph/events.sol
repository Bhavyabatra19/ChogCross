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