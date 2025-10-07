// ChogCross Game MON Contract ABI
// Contract Address: 0x897F3870734fCb9b5889cF2D679893cd443D38d0
// Monad Testnet

const CHOG_CROSS_CONTRACT = {
    address: "0xe8a83303Ba69b4f15Bb3D939952CDb6aaAA4b988", // NEW SECURED CONTRACT
    chainId: 10143, // Monad Testnet
    rpc: "https://monad-testnet.drpc.org",
    abi: [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "AlreadyOnCelebrationPlatform",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ContractPaused",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "EntropyRequestNotFound",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ExposureLimitExceeded",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InsufficientTreasury",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InvalidBetAmount",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InvalidLevel",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotOwner",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotRoundOwner",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "NotTimedOut",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "PlayerHasActiveRound",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "RoundNotActive",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "RoundNotFound",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "RoundTimedOut",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "VRFNotReady",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "uint64",
                    "name": "entropySequenceNumber",
                    "type": "uint64"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "EntropyReady",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newLimit",
                    "type": "uint256"
                }
            ],
            "name": "ExposureLimitUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "platform",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "multiplier",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "PlatformJumped",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "finalPlatform",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "winAmount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "failed",
                    "type": "bool"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "endReason",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "RoundEnded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint64",
                    "name": "entropySequenceNumber",
                    "type": "uint64"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "RoundStarted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newBalance",
                    "type": "uint256"
                }
            ],
            "name": "TreasuryUpdated",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "MAX_BET",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "MAX_WIN",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "MIN_BET",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "PYTH_ENTROPY",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "TIMEOUT_DURATION",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint64",
                    "name": "sequence",
                    "type": "uint64"
                },
                {
                    "internalType": "address",
                    "name": "provider",
                    "type": "address"
                },
                {
                    "internalType": "bytes32",
                    "name": "randomNumber",
                    "type": "bytes32"
                }
            ],
            "name": "_entropyCallback",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "addTreasury",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "callbackGasLimit",
            "outputs": [
                {
                    "internalType": "uint32",
                    "name": "",
                    "type": "uint32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                }
            ],
            "name": "cashOut",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "currentExposure",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                }
            ],
            "name": "endTimedOutRound",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint64",
                    "name": "",
                    "type": "uint64"
                }
            ],
            "name": "entropyRequestToRound",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "escrowBalance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "exposureLimit",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getEntropyFee",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint8",
                    "name": "",
                    "type": "uint8"
                }
            ],
            "name": "gameLevels",
            "outputs": [
                {
                    "internalType": "uint8",
                    "name": "platforms",
                    "type": "uint8"
                },
                {
                    "internalType": "uint16",
                    "name": "failProbability",
                    "type": "uint16"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                }
            ],
            "name": "getGameLevel",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint8",
                            "name": "platforms",
                            "type": "uint8"
                        },
                        {
                            "internalType": "uint16",
                            "name": "failProbability",
                            "type": "uint16"
                        },
                        {
                            "internalType": "uint256[8]",
                            "name": "multipliers",
                            "type": "uint256[8]"
                        }
                    ],
                    "internalType": "struct ChogCrossGameMON.GameLevel",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                }
            ],
            "name": "getPlayerRoundInfo",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                },
                {
                    "internalType": "bool",
                    "name": "hasRound",
                    "type": "bool"
                },
                {
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "currentPlatform",
                    "type": "uint8"
                },
                {
                    "internalType": "bool",
                    "name": "vrfReady",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "currentMultiplier",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "currentWinAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "timeRemaining",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getPythEntropyAddress",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTreasuryInfo",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "balance",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "exposure",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "limit",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "hasActiveRound",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "roundId",
                    "type": "bytes32"
                }
            ],
            "name": "jumpToPlatform",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "pause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "paused",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "playerActiveRound",
            "outputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32",
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "name": "rounds",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "currentPlatform",
                    "type": "uint8"
                },
                {
                    "internalType": "uint64",
                    "name": "entropySequenceNumber",
                    "type": "uint64"
                },
                {
                    "internalType": "bytes32",
                    "name": "entropyRandomness",
                    "type": "bytes32"
                },
                {
                    "internalType": "bool",
                    "name": "entropyReady",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "lastActivity",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "isActive",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint32",
                    "name": "newLimit",
                    "type": "uint32"
                }
            ],
            "name": "setCallbackGasLimit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint8",
                    "name": "level",
                    "type": "uint8"
                }
            ],
            "name": "startRound",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes32[]",
                    "name": "roundIds",
                    "type": "bytes32[]"
                }
            ],
            "name": "sweepTimedOut",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "treasuryBalance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "unpause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "withdrawTreasury",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "stateMutability": "payable",
            "type": "receive"
        }
    ]
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHOG_CROSS_CONTRACT;
}

// Global assignment for browser usage
if (typeof window !== 'undefined') {
    window.CHOG_CROSS_CONTRACT = CHOG_CROSS_CONTRACT;
}