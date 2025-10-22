/**
 * New Leaderboard UI Component
 * Displays leaderboards from the new server-based system
 */
function CLeaderboardNew() {
  var _oContainer;
  var _oBackground;
  var _oCloseButton;
  var _oCategoryButtons = [];
  var _oContentContainer;
  var _oLoadingSpinner;
  var _bIsVisible = false;
  var _sCurrentCategory = "myStats";
  var _oData = null;

  var _aCategoryNames = {
    myStats: "My Stats",
    topEarners: "Top Earners",
  };

  this._init = function () {
    // Create main container
    _oContainer = new createjs.Container();
    _oContainer.alpha = 0;
    s_oStage.addChild(_oContainer);

    // Background - full screen click area that closes panel
    _oBackground = new createjs.Shape();
    _oBackground.graphics
      .beginFill("rgba(0,0,0,0.8)")
      .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Make entire background clickable
    _oBackground.cursor = "pointer";
    _oBackground.mouseEnabled = true;

    var self = this;
    _oBackground.addEventListener("click", function (e) {
      // Panel area boundaries - make panel area smaller to give more clickable area
      var panelMargin = 100; // Bigger margin = smaller clickable panel area
      var panelLeft = panelMargin;
      var panelTop = panelMargin;
      var panelRight = CANVAS_WIDTH - panelMargin;
      var panelBottom = CANVAS_HEIGHT - panelMargin;

      // Check if click is outside the panel area
      var clickX = e.stageX;
      var clickY = e.stageY;

      var isOutsidePanel =
        clickX < panelLeft ||
        clickX > panelRight ||
        clickY < panelTop ||
        clickY > panelBottom;

      console.log("🎯 Background clicked at:", clickX, clickY);
      console.log(
        "📦 Panel area:",
        panelLeft,
        panelTop,
        "to",
        panelRight,
        panelBottom
      );
      console.log("🔍 Outside panel:", isOutsidePanel);

      if (isOutsidePanel) {
        console.log("✅ Closing leaderboard - clicked outside panel");
        self.hide();
      } else {
        console.log("❌ Click inside panel area - not closing");
      }
    });

    _oContainer.addChild(_oBackground);

    // Leaderboard panel background - küçültülmüş ve ortalanmış
    var panel = this._getPanelDimensions();

    var panelBg = new createjs.Shape();
    panelBg.graphics
      .beginFill("rgba(26, 26, 46, 0.95)")
      .beginStroke("#FFD700")
      .setStrokeStyle(2)
      .drawRoundRect(panel.x, panel.y, panel.width, panel.height, 8);
    // Panel background - no need to stop propagation, background handler checks coordinates
    _oContainer.addChild(panelBg);

    // Title - Use optimized text rendering
    var titleText = new createjs.Text(
      "LEADERBOARDS",
      "bold 28px Orbitron, Arial, sans-serif",
      "#FFD700"
    );
    titleText.textAlign = "center";
    titleText.textBaseline = "middle";
    titleText.x = CANVAS_WIDTH / 2;
    titleText.y = panel.y + 30;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(titleText);
    }

    // Enhanced shadow for better readability
    titleText.shadow = new createjs.Shadow("#000000", 2, 2, 4);
    // Title - no need to stop propagation, background handler checks coordinates
    _oContainer.addChild(titleText);

    // Close button
    this._createCloseButton();

    // Category buttons
    this._createCategoryButtons();

    // Content container
    _oContentContainer = new createjs.Container();
    _oContentContainer.x = panel.x + 20;
    _oContentContainer.y = panel.y + 80;
    // Content container - no need to stop propagation, background handler checks coordinates
    _oContainer.addChild(_oContentContainer);

    // Loading spinner
    this._createLoadingSpinner();

    // Load initial data
    this._loadData();

    console.log("🏆 New Leaderboard UI initialized");
  };

  this._createCloseButton = function () {
    // Close button - panelin sağ üst köşesine yerleştir
    var panel = this._getPanelDimensions();

    var closeButtonX = panel.x + panel.width - 40; // Panel sağ kenarından 40px içerde
    var closeButtonY = panel.y + 20; // Panel üst kenarından 20px aşağıda

    var oSprite = s_oSpriteLibrary.getSprite("but_exit");
    _oCloseButton = new CGfxButton(
      closeButtonX,
      closeButtonY,
      oSprite,
      _oContainer
    );
    _oCloseButton.addEventListener(ON_MOUSE_UP, this.hide, this);
  };

  this._createCategoryButtons = function () {
    var categories = Object.keys(_aCategoryNames);
    var buttonWidth = 120; // Küçültülmüş buton genişliği
    var buttonHeight = 30; // Küçültülmüş buton yüksekliği
    var spacing = 20; // Butonlar arası 20px boşluk
    var totalWidth = (buttonWidth + spacing) * categories.length - spacing;

    // Panel boyutlarını hesapla
    var panel = this._getPanelDimensions();

    var startX = panel.x + (panel.width - totalWidth) / 2; // Panel içinde ortala

    for (var i = 0; i < categories.length; i++) {
      var category = categories[i];
      var x = startX + i * (buttonWidth + spacing);
      var y = panel.y + 60; // Panel içinde başlığın altında

      // Button background - bet UI stilinde
      var buttonBg = new createjs.Shape();
      buttonBg.graphics
        .beginFill(
          category === _sCurrentCategory ? "#28a745" : "rgba(52, 58, 64, 0.8)"
        )
        .beginStroke(category === _sCurrentCategory ? "#FFD700" : "#6c757d")
        .setStrokeStyle(2)
        .drawRoundRect(0, 0, buttonWidth, buttonHeight, 6);
      buttonBg.x = x;
      buttonBg.y = y;

      // Button text - Use optimized text rendering
      var buttonText = new createjs.Text(
        _aCategoryNames[category],
        "bold 13px Orbitron, Arial, sans-serif",
        "#ffffff"
      );
      buttonText.textAlign = "center";
      buttonText.textBaseline = "middle";
      buttonText.x = x + buttonWidth / 2;
      buttonText.y = y + buttonHeight / 2;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(buttonText);
      }

      // Enhanced shadow for better readability
      buttonText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContainer.addChild(buttonBg);
      _oContainer.addChild(buttonText);

      // Store references and add click handlers
      var buttonData = {
        bg: buttonBg,
        text: buttonText,
        category: category,
      };
      _oCategoryButtons.push(buttonData);

      // Add click event - no need to stop propagation, background handler checks coordinates
      buttonBg.addEventListener(
        "click",
        this._onCategoryClick.bind(this, category)
      );
      buttonText.addEventListener(
        "click",
        this._onCategoryClick.bind(this, category)
      );

      buttonBg.cursor = "pointer";
      buttonText.cursor = "pointer";
    }
  };

  // Panel boyutlarını hesaplayan yardımcı fonksiyon
  this._getPanelDimensions = function () {
    var panelWidth = CANVAS_WIDTH * 0.7; // %70 genişlik
    var panelHeight = CANVAS_HEIGHT * 0.6; // %60 yükseklik
    var panelX = (CANVAS_WIDTH - panelWidth) / 2; // Ortala X
    var panelY = (CANVAS_HEIGHT - panelHeight) / 2; // Ortala Y

    return {
      width: panelWidth,
      height: panelHeight,
      x: panelX,
      y: panelY,
    };
  };

  this._createLoadingSpinner = function () {
    var panel = this._getPanelDimensions();

    _oLoadingSpinner = new createjs.Shape();
    _oLoadingSpinner.graphics
      .beginStroke("#FFD700")
      .setStrokeStyle(3)
      .drawCircle(0, 0, 20);
    _oLoadingSpinner.x = panel.x + panel.width / 2; // Panel ortası
    _oLoadingSpinner.y = panel.y + panel.height / 2; // Panel ortası
    _oLoadingSpinner.alpha = 0;
    // Loading spinner - no need to stop propagation, background handler checks coordinates
    _oContainer.addChild(_oLoadingSpinner);
  };

  this._onCategoryClick = function (category) {
    if (category === _sCurrentCategory) return;

    console.log("📊 Switching to category:", category);
    _sCurrentCategory = category;
    this._updateCategoryButtons();
    this._displayLeaderboard();
  };

  this._updateCategoryButtons = function () {
    for (var i = 0; i < _oCategoryButtons.length; i++) {
      var button = _oCategoryButtons[i];
      var isActive = button.category === _sCurrentCategory;

      button.bg.graphics
        .clear()
        .beginFill(isActive ? "#28a745" : "rgba(52, 58, 64, 0.8)")
        .beginStroke(isActive ? "#FFD700" : "#6c757d")
        .setStrokeStyle(2)
        .drawRoundRect(0, 0, 150, 35, 6);
    }
  };

  this._loadData = function () {
    this._showLoading(true);

    if (s_oLeaderboardManager && s_oLeaderboardManager.loadLeaderboards) {
      s_oLeaderboardManager
        .loadLeaderboards()
        .then(
          function (data) {
            _oData = data;
            this._showLoading(false);
            this._displayLeaderboard();
          }.bind(this)
        )
        .catch(
          function (error) {
            console.error("❌ Failed to load leaderboard data:", error);
            this._showLoading(false);
            this._showError("Failed to load leaderboard data");
          }.bind(this)
        );
    } else {
      this._showLoading(false);
      this._showError("Leaderboard manager not available");
    }
  };

  this._displayLeaderboard = function () {
    // Clear previous content
    _oContentContainer.removeAllChildren();

    if (_sCurrentCategory === "myStats") {
      this._displayMyStats();
      return;
    }

    if (!_oData || !_oData.leaderboards) {
      this._showError("No leaderboard data available");
      return;
    }

    var leaderboardData = _oData.leaderboards[_sCurrentCategory] || [];

    if (leaderboardData.length === 0) {
      var noDataText = new createjs.Text(
        "No data available yet",
        "18px Orbitron, Arial, sans-serif",
        "#888888"
      );
      noDataText.textAlign = "center";
      noDataText.textBaseline = "middle";
      noDataText.x = (CANVAS_WIDTH - 140) / 2;
      noDataText.y = 100;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(noDataText);
      }

      // Enhanced shadow for better readability
      noDataText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(noDataText);
      return;
    }

    // Category title - Use optimized text rendering
    var categoryTitle = new createjs.Text(
      _aCategoryNames[_sCurrentCategory],
      "bold 24px Orbitron, Arial, sans-serif",
      "#FFD700"
    );
    categoryTitle.textAlign = "left";
    categoryTitle.textBaseline = "middle";
    categoryTitle.x = 20;
    categoryTitle.y = 20;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(categoryTitle);
    }

    // Enhanced shadow for better readability
    categoryTitle.shadow = new createjs.Shadow("#000000", 2, 2, 3);

    _oContentContainer.addChild(categoryTitle);

    // Headers
    this._createHeaders();

    // Leaderboard entries
    var startY = 80;
    var rowHeight = 40;

    for (var i = 0; i < Math.min(leaderboardData.length, 10); i++) {
      var entry = leaderboardData[i];
      var y = startY + i * rowHeight;

      this._createLeaderboardRow(entry, i + 1, y);
    }

    // Statistics panel
    this._createStatisticsPanel();
  };

  this._displayMyStats = function () {
    // Get player address from leaderboard manager
    var playerAddress = null;

    console.log("🔍 Checking player address sources...");
    console.log("s_oLeaderboardManager:", s_oLeaderboardManager);
    console.log("window.walletManager:", window.walletManager);

    if (s_oLeaderboardManager && s_oLeaderboardManager.getPlayerAddress) {
      playerAddress = s_oLeaderboardManager.getPlayerAddress();
      console.log("📊 Player address from LeaderboardManager:", playerAddress);
    }

    if (
      !playerAddress &&
      window.walletManager &&
      window.walletManager.getWalletAddress
    ) {
      playerAddress = window.walletManager.getWalletAddress();
      console.log("💰 Player address from WalletManager:", playerAddress);
    }

    console.log("👤 Final player address:", playerAddress);

    if (!playerAddress) {
      // Try to get wallet address from different sources
      if (
        window.walletManager &&
        window.walletManager.isConnected &&
        window.walletManager.isConnected()
      ) {
        playerAddress = window.walletManager.getWalletAddress();
        console.log(
          "🔄 Retrying wallet address from WalletManager:",
          playerAddress
        );
      }

      // Try Privy wallet
      if (
        !playerAddress &&
        window.privyWallet &&
        window.privyWallet.getAddress
      ) {
        try {
          playerAddress = window.privyWallet.getAddress();
          console.log("🔄 Retrying wallet address from Privy:", playerAddress);
        } catch (e) {
          console.log("⚠️ Privy wallet not available:", e);
        }
      }

      // Try window.ethereum
      if (
        !playerAddress &&
        window.ethereum &&
        window.ethereum.selectedAddress
      ) {
        playerAddress = window.ethereum.selectedAddress;
        console.log(
          "🔄 Retrying wallet address from window.ethereum:",
          playerAddress
        );
      }
    }

    if (!playerAddress) {
      var notConnectedText = new createjs.Text(
        "Connect your wallet to see your stats",
        "18px Orbitron, Arial, sans-serif",
        "#888888"
      );
      notConnectedText.textAlign = "center";
      notConnectedText.textBaseline = "middle";
      notConnectedText.x = (CANVAS_WIDTH - 140) / 2;
      notConnectedText.y = 80;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(notConnectedText);
      }

      // Enhanced shadow for better readability
      notConnectedText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(notConnectedText);

      // Create a clickable button to connect wallet
      var btnBg = new createjs.Shape();
      btnBg.graphics
        .beginFill("#676FFF")
        .beginStroke("#555555")
        .setStrokeStyle(2)
        .drawRoundRect(0, 0, 220, 40, 6);
      // Position relative to the content container (local coordinates)
      var panel = this._getPanelDimensions();
      // center inside content container width (panel.width - 40 padding)
      btnBg.x = (panel.width - 220) / 2; // local coords inside _oContentContainer
      btnBg.y = 40; // place a bit below the content top area
      btnBg.cursor = "pointer";
      btnBg.mouseEnabled = true;
      // Hover feedback
      btnBg.addEventListener("mouseover", function () {
        btnBg.alpha = 0.9;
      });
      btnBg.addEventListener("mouseout", function () {
        btnBg.alpha = 1;
      });

      var btnText = new createjs.Text(
        "Connect Wallet",
        "bold 16px Orbitron, Arial, sans-serif",
        "#ffffff"
      );
      btnText.textAlign = "center";
      btnText.textBaseline = "middle";
      btnText.x = btnBg.x + 110;
      btnText.y = btnBg.y + 20;

      // Add click behavior
      var self = this;
      var handleClick = function () {
        try {
          console.log("🔗 Leaderboard: Connect Wallet button clicked");
          self
            ._connectWallet()
            .then(function (success) {
              if (success) {
                console.log("🔁 Wallet connected, refreshing myStats view");
                self._displayMyStats();
              } else {
                console.log("⚠️ Wallet connect attempt did not succeed");
              }
            })
            .catch(function (e) {
              console.warn("Connect error:", e);
            });
        } catch (e) {
          console.error(e);
        }
      };

      btnBg.addEventListener("click", handleClick);
      btnText.addEventListener("click", handleClick);

      _oContentContainer.addChild(btnBg);
      _oContentContainer.addChild(btnText);

      return;
    }

    // Show loading while fetching player stats
    this._showLoading(true);

    // Get player stats from server
    if (s_oLeaderboardManager && s_oLeaderboardManager.getPlayerStats) {
      s_oLeaderboardManager
        .getPlayerStats(playerAddress)
        .then(
          function (playerData) {
            this._showLoading(false);
            this._displayPlayerStats(playerData, playerAddress);
          }.bind(this)
        )
        .catch(
          function (error) {
            this._showLoading(false);
            console.error("Failed to load player stats:", error);

            var errorText = new createjs.Text(
              "No games played yet",
              "18px Orbitron, Arial, sans-serif",
              "#888888"
            );
            errorText.textAlign = "center";
            errorText.textBaseline = "middle";
            errorText.x = (CANVAS_WIDTH - 140) / 2;
            errorText.y = 100;

            // Apply text optimizations - Safe check
            if (
              window.textRenderer &&
              typeof window.textRenderer.optimizeTextObject === "function"
            ) {
              window.textRenderer.optimizeTextObject(errorText);
            }

            // Enhanced shadow for better readability
            errorText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

            _oContentContainer.addChild(errorText);
          }.bind(this)
        );
    } else {
      this._showLoading(false);
      this._showError("Unable to load player stats");
    }
  };

  this._displayPlayerStats = function (playerData, playerAddress) {
    if (!playerData || !playerData.player) {
      var noStatsText = new createjs.Text(
        "No games played yet",
        "18px Orbitron, Arial, sans-serif",
        "#888888"
      );
      noStatsText.textAlign = "center";
      noStatsText.textBaseline = "middle";
      noStatsText.x = (CANVAS_WIDTH - 140) / 2;
      noStatsText.y = 100;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(noStatsText);
      }

      // Enhanced shadow for better readability
      noStatsText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(noStatsText);
      return;
    }

    var player = playerData.player;
    var games = playerData.games || [];

    // Player info header with styled address - Use optimized text rendering
    var playerLabel = new createjs.Text(
      "Player Statistics",
      "bold 24px Orbitron, Arial, sans-serif",
      "#FFD700"
    );
    playerLabel.textAlign = "left";
    playerLabel.textBaseline = "middle";
    playerLabel.x = 20;
    playerLabel.y = 20;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(playerLabel);
    }

    // Enhanced shadow for better readability
    playerLabel.shadow = new createjs.Shadow("#000000", 2, 2, 3);

    _oContentContainer.addChild(playerLabel);

    var addressText = new createjs.Text(
      "Wallet: " + this._formatAddress(playerAddress),
      "18px Orbitron, Arial, sans-serif",
      "#CCCCCC"
    );
    addressText.textAlign = "left";
    addressText.textBaseline = "middle";
    addressText.x = 20;
    addressText.y = 50;

    // Find player's rank in Top Earners
    var playerRank = "N/A";
    if (_oData && _oData.leaderboards && _oData.leaderboards.topEarners) {
      var rankIndex = _oData.leaderboards.topEarners.findIndex(function (
        entry
      ) {
        return entry.address.toLowerCase() === playerAddress.toLowerCase();
      });
      if (rankIndex !== -1) {
        playerRank = "#" + (rankIndex + 1);
      }
    }

    var rankText = new createjs.Text(
      "Rank: " + playerRank,
      "18px Orbitron, Arial, sans-serif",
      "#FFD700"
    );
    rankText.textAlign = "left";
    rankText.textBaseline = "middle";
    rankText.x = 20;
    rankText.y = 80;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(addressText);
      window.textRenderer.optimizeTextObject(rankText);
    }

    // Enhanced shadow for better readability
    addressText.shadow = new createjs.Shadow("#000000", 1, 1, 2);
    rankText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

    _oContentContainer.addChild(addressText);
    _oContentContainer.addChild(rankText);

    // Stats grid
    var statsY = 120;
    var statHeight = 35;
    var leftColumn = 20;
    var rightColumn = 400;

    // Calculate detailed stats
    var totalWins =
      player.totalWins ||
      games.filter(function (g) {
        return g.winnings > 0;
      }).length;
    var totalLosses =
      player.totalLosses ||
      games.filter(function (g) {
        return g.winnings === 0;
      }).length;
    var totalWinnings = player.totalWinnings || 0;
    var totalLosses_Amount =
      player.totalLossesAmount ||
      games
        .filter(function (g) {
          return g.winnings === 0;
        })
        .reduce(function (sum, g) {
          return sum + g.betAmount;
        }, 0);
    var netProfit = totalWinnings - totalLosses_Amount;

    // Left column stats
    var leftStats = [
      "Total Games: " + (player.totalGames || 0),
      "Wins: " + totalWins + " games",
      "Losses: " + totalLosses + " games",
      "Best Streak: " + (player.bestStreak || 0) + " platforms",
      "Highest Multiplier: " + (player.highestMultiplier || 0).toFixed(2) + "x",
    ];

    // Right column stats
    var rightStats = [
      "Total Winnings: " + totalWinnings.toFixed(2) + " MON",
      "Total Losses: " + totalLosses_Amount.toFixed(2) + " MON",
      "Net Profit: " +
        (netProfit >= 0 ? "+" : "") +
        netProfit.toFixed(2) +
        " MON",
      "Win Rate: " +
        (player.totalGames > 0
          ? ((totalWins / player.totalGames) * 100).toFixed(1)
          : "0.0") +
        "%",
      "Average Bet: " +
        (player.totalGames > 0
          ? ((totalWinnings + totalLosses_Amount) / player.totalGames).toFixed(
              2
            )
          : "0.00") +
        " MON",
    ];

    // Draw left column - Use optimized text rendering
    for (var i = 0; i < leftStats.length; i++) {
      var statText = new createjs.Text(
        leftStats[i],
        "16px Orbitron, Arial, sans-serif",
        "#ffffff"
      );
      statText.textAlign = "left";
      statText.textBaseline = "middle";
      statText.x = leftColumn;
      statText.y = statsY + i * statHeight;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(statText);
      }

      // Enhanced shadow for better readability
      statText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(statText);
    }

    // Draw right column - Use optimized text rendering
    for (var i = 0; i < rightStats.length; i++) {
      var statText = new createjs.Text(
        rightStats[i],
        "16px Orbitron, Arial, sans-serif",
        "#ffffff"
      );
      statText.textAlign = "left";
      statText.textBaseline = "middle";
      statText.x = rightColumn;
      statText.y = statsY + i * statHeight;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(statText);
      }

      // Enhanced shadow for better readability
      statText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(statText);
    }

    // Recent games section removed per user request
  };

  this._createHeaders = function () {
    var headers = this._getHeadersForCategory(_sCurrentCategory);
    var columnWidths = [60, 200, 150, 120, 150];
    var x = 0;

    for (var i = 0; i < headers.length; i++) {
      var headerText = new createjs.Text(
        headers[i],
        "bold 16px Orbitron, Arial, sans-serif",
        "#FFD700"
      );
      headerText.textAlign = "center";
      headerText.textBaseline = "middle";
      headerText.x = x + columnWidths[i] / 2;
      headerText.y = 50;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(headerText);
      }

      // Enhanced shadow for better readability
      headerText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(headerText);

      x += columnWidths[i];
    }

    // Header underline
    var line = new createjs.Shape();
    line.graphics
      .beginStroke("#555555")
      .setStrokeStyle(1)
      .moveTo(0, 40)
      .lineTo(x, 40);
    _oContentContainer.addChild(line);
  };

  this._getHeadersForCategory = function (category) {
    switch (category) {
      case "topEarners":
        return ["Rank", "Player", "Total Winnings", "Games Played", "Win Rate"];
      default:
        return ["Rank", "Player", "Value", "Extra"];
    }
  };

  this._createLeaderboardRow = function (entry, rank, y) {
    var columnWidths = [60, 200, 150, 120, 150];
    var x = 0;

    // Rank - Use optimized text rendering
    var rankText = new createjs.Text(
      "#" + rank,
      "16px Orbitron, Arial, sans-serif",
      rank <= 3 ? "#FFD700" : "#ffffff"
    );
    rankText.textAlign = "center";
    rankText.textBaseline = "middle";
    rankText.x = x + columnWidths[0] / 2;
    rankText.y = y;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(rankText);
    }

    // Enhanced shadow for better readability
    rankText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

    _oContentContainer.addChild(rankText);
    x += columnWidths[0];

    // Player name - always use formatted address - Use optimized text rendering
    var playerName = this._formatAddress(entry.address);
    var nameText = new createjs.Text(
      playerName,
      "16px Orbitron, Arial, sans-serif",
      "#ffffff"
    );
    nameText.textAlign = "left";
    nameText.textBaseline = "middle";
    nameText.x = x + 10;
    nameText.y = y;

    // Apply text optimizations - Safe check
    if (
      window.textRenderer &&
      typeof window.textRenderer.optimizeTextObject === "function"
    ) {
      window.textRenderer.optimizeTextObject(nameText);
    }

    // Enhanced shadow for better readability
    nameText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

    _oContentContainer.addChild(nameText);
    x += columnWidths[1];

    // Category-specific values - Use optimized text rendering
    var values = this._getValuesForCategory(_sCurrentCategory, entry);
    for (var i = 0; i < values.length; i++) {
      var valueText = new createjs.Text(
        values[i],
        "16px Orbitron, Arial, sans-serif",
        "#ffffff"
      );
      valueText.textAlign = "center";
      valueText.textBaseline = "middle";
      valueText.x = x + columnWidths[i + 2] / 2;
      valueText.y = y;

      // Apply text optimizations - Safe check
      if (
        window.textRenderer &&
        typeof window.textRenderer.optimizeTextObject === "function"
      ) {
        window.textRenderer.optimizeTextObject(valueText);
      }

      // Enhanced shadow for better readability
      valueText.shadow = new createjs.Shadow("#000000", 1, 1, 2);

      _oContentContainer.addChild(valueText);
      x += columnWidths[i + 2];
    }
  };

  this._getValuesForCategory = function (category, entry) {
    switch (category) {
      case "topEarners":
        var winRate =
          entry.totalGames > 0
            ? (((entry.totalWins || 0) / entry.totalGames) * 100).toFixed(1)
            : "0.0";
        return [
          entry.totalWinnings.toFixed(2) + " MON",
          entry.totalGames || 0,
          winRate + "%",
        ];
      default:
        return ["N/A", "N/A"];
    }
  };

  this._createStatisticsPanel = function () {
    if (!_oData || !_oData.statistics) return;

    var stats = _oData.statistics;
    var panel = new createjs.Container();
    panel.x = CANVAS_WIDTH - 350; // Moved 100px to the left
    panel.y = 0;

    // Panel background
    var bg = new createjs.Shape();
    bg.graphics
      .beginFill("rgba(255,255,255,0.1)")
      .beginStroke("#555555")
      .setStrokeStyle(1)
      .drawRoundRect(0, 0, 200, 150, 5);
    panel.addChild(bg);

    // Title
    var title = new createjs.Text("Statistics", "bold 16px Arial", "#FFD700");
    title.x = 100;
    title.y = 15;
    title.textAlign = "center";
    panel.addChild(title);

    // Stats
    var statsText = [
      "Total Games: " + stats.totalGames,
      "Total Players: " + stats.totalPlayers,
      "Total Winnings: " + stats.totalWinnings.toFixed(2) + " MON",
      "Avg Multiplier: " + stats.averageMultiplier.toFixed(2) + "x",
    ];

    for (var i = 0; i < statsText.length; i++) {
      var text = new createjs.Text(statsText[i], "12px Arial", "#ffffff");
      text.x = 10;
      text.y = 40 + i * 20;
      panel.addChild(text);
    }

    _oContentContainer.addChild(panel);
  };

  this._formatAddress = function (address) {
    if (!address) return "Unknown";
    return (
      address.substring(0, 6) + "..." + address.substring(address.length - 4)
    );
  };

  this._formatDate = function (dateString) {
    if (!dateString) return "N/A";
    var date = new Date(dateString);
    return date.toLocaleDateString();
  };

  /**
   * Try to connect a wallet using multiple fallbacks:
   * - Privy (window.privyWallet / window.login)
   * - Injected provider (window.ethereum / window.realPrivyProvider)
   * - walletManager.open()
   * Returns Promise<boolean>
   */
  this._connectWallet = function () {
    return new Promise(async function (resolve) {
      try {
        console.log("🔌 _connectWallet: start");

        // 1) Try Privy API if available
        if (window.privyWallet) {
          console.log(
            "🔍 _connectWallet: detected window.privyWallet, authenticated:",
            window.privyWallet.authenticated
          );
          try {
            if (!window.privyWallet.authenticated) {
              if (typeof window.login === "function") {
                console.log(
                  "🔐 _connectWallet: calling window.login() (Privy)"
                );
                await window.login({ loginMethods: ["email", "wallet"] });
                resolve(true);
                return;
              }
              // If privy exposes a direct login modal helper
              if (typeof window.PrivyOpenLogin === "function") {
                try {
                  window.PrivyOpenLogin();
                  // can't await modal result, resolve true so caller can re-check session
                  resolve(true);
                  return;
                } catch (e) {
                  console.warn("Privy modal open failed:", e);
                }
              }
            } else {
              // Already authenticated
              resolve(true);
              return;
            }
          } catch (e) {
            console.warn("Privy login attempt failed:", e);
          }
        }

        // Helper to try a provider with different methods
        var tryProvider = async function (prov) {
          if (!prov) return false;
          console.log("🔍 _connectWallet: trying provider:", prov);

          // If provider has providers array (multiple injected), try to find MetaMask first
          if (Array.isArray(prov.providers) && prov.providers.length > 0) {
            for (var i = 0; i < prov.providers.length; i++) {
              var p = prov.providers[i];
              if (p && p.isMetaMask) {
                console.log("🔎 _connectWallet: trying p.isMetaMask provider");
                prov = p;
                break;
              }
            }
          }

          try {
            if (typeof prov.request === "function") {
              console.log(
                "➡️ _connectWallet: calling provider.request('eth_requestAccounts')"
              );
              var accounts = await prov.request({
                method: "eth_requestAccounts",
              });
              console.log(
                "✅ _connectWallet: provider.request returned:",
                accounts
              );
              if (accounts && accounts.length > 0) return true;
            }
          } catch (e) {
            console.warn("⚠️ _connectWallet: provider.request failed:", e);
          }

          // Fallback to enable()
          try {
            if (typeof prov.enable === "function") {
              console.log("➡️ _connectWallet: calling provider.enable()");
              var enabled = await prov.enable();
              console.log(
                "✅ _connectWallet: provider.enable returned:",
                enabled
              );
              if (enabled && enabled.length > 0) return true;
            }
          } catch (e) {
            console.warn("⚠️ _connectWallet: provider.enable failed:", e);
          }

          // Fallback to send / sendAsync
          try {
            if (typeof prov.send === "function") {
              console.log(
                "➡️ _connectWallet: calling provider.send('eth_requestAccounts')"
              );
              var res = prov.send("eth_requestAccounts");
              console.log("✅ _connectWallet: provider.send returned:", res);
              // Some providers return an object or a Promise
              if (res && (res.then || res.result)) return true;
            }
            if (typeof prov.sendAsync === "function") {
              console.log(
                "➡️ _connectWallet: trying provider.sendAsync('eth_requestAccounts')"
              );
              prov.sendAsync(
                { method: "eth_requestAccounts", params: [] },
                function (err, result) {
                  console.log("sendAsync result", err, result);
                }
              );
            }
          } catch (e) {
            console.warn(
              "⚠️ _connectWallet: provider.send/sendAsync failed:",
              e
            );
          }

          return false;
        };

        // 2) Try injected provider candidates
        var candidates = [
          window.realPrivyProvider,
          window.ethereum,
          window._ethereumProvider,
        ];
        for (var i = 0; i < candidates.length; i++) {
          var cand = candidates[i];
          if (!cand) continue;
          try {
            var ok = await tryProvider(cand);
            if (ok) {
              resolve(true);
              return;
            }
          } catch (e) {
            console.warn("Candidate provider attempt failed", e);
          }
        }

        // 3) walletManager fallback
        if (
          window.walletManager &&
          typeof window.walletManager.open === "function"
        ) {
          try {
            console.log(
              "➡️ _connectWallet: calling window.walletManager.open() fallback"
            );
            window.walletManager.open();
            setTimeout(function () {
              resolve(true);
            }, 800);
            return;
          } catch (e) {
            console.warn("walletManager.open failed:", e);
          }
        }

        console.log("❌ _connectWallet: no provider succeeded");
        resolve(false);
      } catch (err) {
        console.error("Connect wallet error:", err);
        resolve(false);
      }
    });
  };

  this._showLoading = function (show) {
    if (show) {
      _oLoadingSpinner.alpha = 1;
      createjs.Tween.get(_oLoadingSpinner, { loop: true }).to(
        { rotation: 360 },
        1000,
        createjs.Ease.linear
      );
    } else {
      createjs.Tween.get(_oLoadingSpinner).to({ alpha: 0 }, 300);
    }
  };

  this._showError = function (message) {
    _oContentContainer.removeAllChildren();

    var errorText = new createjs.Text(
      "ERROR: " + message,
      "18px Arial",
      "#ff4444"
    );
    errorText.textAlign = "center";
    errorText.x = (CANVAS_WIDTH - 140) / 2;
    errorText.y = 100;
    _oContentContainer.addChild(errorText);
  };

  this.show = function () {
    if (!_oContainer || !s_oStage.contains(_oContainer)) {
      this._init();
    }

    _bIsVisible = true;

    // Ensure mouse events are enabled
    _oContainer.mouseEnabled = true;
    _oContainer.mouseChildren = true;

    // Add container-level click listener for debugging
    _oContainer.addEventListener("click", function (e) {
      console.log(
        "🔍 Container clicked at:",
        e.stageX,
        e.stageY,
        "Target:",
        e.target
      );
    });

    createjs.Tween.get(_oContainer).to(
      { alpha: 1 },
      500,
      createjs.Ease.quadOut
    );

    // Reload data when showing
    this._loadData();

    console.log("🏆 New Leaderboard shown");
  };

  this.hide = function () {
    _bIsVisible = false;

    createjs.Tween.get(_oContainer)
      .to({ alpha: 0 }, 300, createjs.Ease.quadIn)
      .call(function () {
        if (_oContainer && s_oStage.contains(_oContainer)) {
          s_oStage.removeChild(_oContainer);
        }
      });

    console.log("🏆 New Leaderboard hidden");
  };

  this.isVisible = function () {
    return _bIsVisible;
  };

  this.unload = function () {
    if (_oContainer && s_oStage.contains(_oContainer)) {
      s_oStage.removeChild(_oContainer);
    }
  };

  this._init();
}
