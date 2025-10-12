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

    // Add your own contract address here!
    address constant CHOG_CROSS_CONTRACT = 0xe8a83303Ba69b4f15Bb3D939952CDb6aaAA4b988;

    function registerHandles() external {
        graph.registerHandle(CHOG_CROSS_CONTRACT);
    }

    function onRoundEnded(EventDetails memory details, RoundEndedEvent memory ev) external {
        Player memory player = graph.getPlayer(ev.player);

        // Win/Loss ve toplam kazanç
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

        // Fastest time (opsiyonel, duration varsa)
        // if (duration > 0 && (player.fastestTime == 0 || duration < player.fastestTime)) {
        //     player.fastestTime = duration;
        // }

        graph.savePlayer(player);

        // Her round sonucu kaydı
        GameResult memory result = graph.getGameResult(details.uniqueId());
        result.player = ev.player;
        result.level = ev.level;
        result.betAmount = ev.betAmount;
        result.finalPlatform = ev.finalPlatform;
        result.winAmount = ev.winAmount;
        result.failed = ev.failed;
        result.endReason = ev.endReason;
        result.timestamp = ev.timestamp;
        // result.duration = duration; // (opsiyonel)
        graph.saveGameResult(result);
    }
}
