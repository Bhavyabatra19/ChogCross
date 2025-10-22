function CGame(oData, iLevel) {
  var _bUpdate;
  var _bJumping;
  var _bCelebrationTestMode = false; // TEST MODE: Set to true to test celebration platform
  var _bTestModeAlwaysSucceed = false; // TEST MODE: Flag to force successful landings in test mode
  var _oInterface;
  var _oObstacleManager;
  var _oCharacterManager;
  var _bTapping;
  var _iTappingTime;
  var _iScore;
  var _bCollision;
  var _oCollision;
  var _bUpdateObst;
  var _iBestScore;
  var _iWorld;
  var _bGameOver;
  var _iJumpsLeft; // Kalan atlama sayısı
  var _iCurrentMultiplier; // Mevcut multiplier

  // Gambling system variables
  var _fBetAmount = 1.0; // Default bet amount (now supports decimals)
  var _iCurrentLevel = iLevel || 1;
  var _fCurrentWinnings = 0;
  var _bShowingBetUI = true; // Show bet UI at start
  var _sDifficulty = "easy"; // Default difficulty
  var _fCurrentMultiplier = 1.0; // Current multiplier
  var _bGameStarted = false; // Game started flag
  var _contractJumpResult = null; // Store contract jump result
  var _bWaitingForJumpResult = false; // Track if we're waiting for jump transaction
  var _iSuccessfulJumps = 0; // Count of successful jumps
  var _iGameStartTime = 0; // Game start timestamp
  var _bCashoutInProgress = false; // Cashout işlemi devam ediyor mu
  var _bFirstJumpCompleted = false; // İlk jump kontrolü - cashout için gerekli

  // Parallax layers
  var _oSky, _oBGDecor, _oMiddleDecor, _oForeground, _oGround;
  var _parallaxMeta = null; // stores baseX and adjustedWidth per layer to avoid drift
  var _parallaxOffset = 0;
  var _lastParallaxX = 0;
  var _parallaxSpeeds = {
    ground_01: 0.3, // En önde (karaktere en yakın) - yavaş
    foreground: 0.15, // Orta-ön katman - çok yavaş
    middle_decor: 0.08, // Orta katman - minimal
    bg_decor: 0.03, // Arka-plan katmanı - çok minimal
    sky: 0.01, // En arkada (en uzak) - en minimal
  };

  // Public getter for starting platform
  this.getStartingPlatform = function () {
    return _oStartingPlatform;
  };

  this._init = function () {
    s_oStage.removeAllChildren(); // Oyun başlarken sahneyi tamamen temizle
    try {
      _bTapping = false;
      _bJumping = false;
      _iJumpsLeft = MAX_JUMPS;
      _iCurrentMultiplier = 1;
      if (window.errorLogger) {
        window.errorLogger.info("Game initialization started", {
          jumpsLeft: _iJumpsLeft,
          currentMultiplier: _iCurrentMultiplier,
          betAmount: _fBetAmount,
          difficulty: _sDifficulty,
        });
      }
      // --- ESKİ ARKA PLAN KODLARI TAMAMEN KALDIRILDI ---
      // Parallax katmanlarını oluştur ve sahneye ekle
      _oSky = createBitmap(s_oSpriteLibrary.getSprite("sky"));
      _oBGDecor = createBitmap(s_oSpriteLibrary.getSprite("bg_decor"));
      _oMiddleDecor = createBitmap(s_oSpriteLibrary.getSprite("middle_decor"));
      _oForeground = createBitmap(s_oSpriteLibrary.getSprite("foreground"));
      // _oGround kaldırıldı - denizin arkasında kalıyordu
      var layers = [_oSky, _oBGDecor, _oMiddleDecor, _oForeground];
      for (var i = layers.length - 1; i >= 0; i--) {
        s_oStage.addChildAt(layers[i], 0);
      }
      // Build parallax meta with real scaled widths and base positions
      _parallaxMeta = {
        sky: null,
        bg_decor: null,
        middle_decor: null,
        foreground: null,
      };

      for (var i = 0; i < layers.length; i++) {
        var bmp = layers[i];

        // Katmanları canvas'a normal sığdır
        var scaleX = CANVAS_WIDTH / bmp.getBounds().width;
        var scaleY = CANVAS_HEIGHT / bmp.getBounds().height;
        var maxScale = Math.max(scaleX, scaleY) * 1.2; // %20 daha büyük olsun (ekran dolu görünsün)

        bmp.scaleX = maxScale;
        bmp.scaleY = maxScale;

        // Katmanı ortala
        var adjustedWidth = bmp.getBounds().width * maxScale;
        var adjustedHeight = bmp.getBounds().height * maxScale;
        bmp.x = (CANVAS_WIDTH - adjustedWidth) / 2;
        bmp.y = (CANVAS_HEIGHT - adjustedHeight) / 2;

        // Store meta for stable parallax computation
        if (bmp === _oSky) {
          _parallaxMeta.sky = {
            bmp: bmp,
            baseX: bmp.x,
            width: adjustedWidth,
            speed: _parallaxSpeeds.sky,
          };
        } else if (bmp === _oBGDecor) {
          _parallaxMeta.bg_decor = {
            bmp: bmp,
            baseX: bmp.x,
            width: adjustedWidth,
            speed: _parallaxSpeeds.bg_decor,
          };
        } else if (bmp === _oMiddleDecor) {
          _parallaxMeta.middle_decor = {
            bmp: bmp,
            baseX: bmp.x,
            width: adjustedWidth,
            speed: _parallaxSpeeds.middle_decor,
          };
        } else if (bmp === _oForeground) {
          _parallaxMeta.foreground = {
            bmp: bmp,
            baseX: bmp.x,
            width: adjustedWidth,
            speed: _parallaxSpeeds.foreground,
          };
        }
      }
      // ... diğer oyun başlatma kodları ...

      setVolume("soundtrack", 0.4);
      _bGameOver = false; // Oyun başladığında false olmalı

      if (getItem(SCORE_ITEM_NAME) !== null) {
        _iBestScore = getItem(SCORE_ITEM_NAME);
      } else {
        _iBestScore = 0;
      }
      _iScore = 0;
      _oObstacleManager = new CObstacle(
        s_oSpriteLibrary.getSprite("platform_spritesheet")
      );
      _oCharacterManager = new CCharacter(
        STARTX,
        STARTY,
        s_oSpriteLibrary.getSprite("hero_idle")
      );
      // Create starting platform where character begins - smaller and higher
      _oStartingPlatform = createBitmap(
        s_oSpriteLibrary.getSprite("first_platform")
      );
      _oStartingPlatform.x = STARTX;
      _oStartingPlatform.y = FIRST_PLATFORM_Y; // Responsive pozisyon
      _oStartingPlatform.regX = _oStartingPlatform.getBounds().width / 2;
      _oStartingPlatform.regY = _oStartingPlatform.getBounds().height / 2;
      _oStartingPlatform.scaleX = 1.0; // 50% smaller
      _oStartingPlatform.scaleY = 1.0; // 50% smaller
      s_oStage.addChild(_oStartingPlatform);

      // Nehir animasyonunu başlat
      _oRiverAnimation = new CRiverAnimation();

      // Shark animasyonunu başlat
      _oSharkAnimation = new CSharkAnimation();

      // Shark attack animasyonunu başlat
      _oSharkAttackAnimation = new CSharkAttackAnimation();

      _oInterface = new CInterface(_iBestScore);

      // Z ekseni sıralamasını ayarla
      this.setupZOrder();

      // Show betting UI after help panel is created (delay to ensure it's on top)
      var self = this;
      setTimeout(function () {
        _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
      }, 100);

      _oObstacleManager.update(0);

      _iTappingTime = 0;
      _bCollision = false;
      _oCollision = null;

      // Space tuşu event listener'ı ekle
      this._initKeyboardEvents();

      // Register with GameManager
      if (window.gameManager) {
        window.gameManager.setGame(this);

        // Log game creation
        if (window.errorLogger) {
          window.errorLogger.info("Game instance registered with GameManager", {
            betAmount: _fBetAmount,
            difficulty: _sDifficulty,
            level: _iCurrentLevel,
          });
        }
      }

      _bUpdate = true;
      _bUpdateObst = true;

      console.log(
        "Game initialized - character should be on first log waiting for input"
      ); // Debug
      console.log("Initial jumps left:", _iJumpsLeft); // Debug
      console.log("Initial game over:", _bGameOver); // Debug
    } catch (error) {
      if (window.errorLogger) {
        window.errorLogger.error("Game initialization failed", {
          error: error.message,
          stack: error.stack,
          jumpsLeft: _iJumpsLeft,
          betAmount: _fBetAmount,
          difficulty: _sDifficulty,
        });
      }

      // Show user-friendly error
      if (window.errorLogger) {
        window.errorLogger.showErrorToUser(
          "Game could not be started. Please refresh the page."
        );
      }

      throw error; // Re-throw to maintain original behavior
    }
  };

  // Space tuşu desteği
  this._initKeyboardEvents = function () {
    var self = this;
    $(document).keydown(function (e) {
      if (e.keyCode === 32) {
        // Space tuşu
        e.preventDefault();
        if (!_bJumping && _iJumpsLeft > 0) {
          self.tapScreen();
        }
      }
    });
  };

  this.unload = function () {
    _oInterface.unload();
    if (_oStartingPlatform) {
      s_oStage.removeChild(_oStartingPlatform);
      _oStartingPlatform = null;
    }
    s_oStage.removeAllChildren();

    s_oGame = null;
  };
  this.restart = function () {
    _oInterface.unload();
    s_oStage.removeAllChildren();
    this._init();
  };
  this.gameOver = function () {
    if (_bGameOver) {
      console.log("Game over already triggered, skipping duplicate call.");
      return;
    }
    _bGameOver = true;

    // Clear wallet manager game state when game ends
    if (window.walletManager && window.walletManager.clearGameState) {
      window.walletManager.clearGameState();
      console.log("🧹 Game state cleared in wallet manager on game over");
    }

    // Notify LeaderboardManager that game has ended
    if (
      window.s_oLeaderboardManager &&
      window.s_oLeaderboardManager.setGameActive
    ) {
      window.s_oLeaderboardManager.setGameActive(false);
    }

    // Contract game over processing - the round will end automatically on contract side
    // Contract round'u otomatik olarak bitecek, sadece UI'ı handle edelim
    console.log("💀 Game Over - Contract round will end automatically");

    // Auto mode game over event
    if (window.autoModeManager) {
      window.dispatchEvent(
        new CustomEvent("gameOver", {
          detail: {
            finalMultiplier: _fCurrentMultiplier,
            finalWinnings: _fCurrentWinnings,
            successfulJumps: _iSuccessfulJumps,
          },
        })
      );
    }

    // Disable cashout button when game is over
    if (_oInterface && _oInterface.disableCashoutButton) {
      _oInterface.disableCashoutButton();
    }

    // Stop background music when game is over
    console.log("🎵 Stopping background music on Game Over...");
    if (typeof stopSound === "function") {
      stopSound("soundtrack");
    } else {
      console.log("⚠️ stopSound function not available");
    }

    // Schedule music restart after game over screen
    setTimeout(function () {
      if (s_oMain && s_oMain.restartBackgroundMusic) {
        console.log(
          "🎵 Scheduling background music restart after game over..."
        );
        s_oMain.restartBackgroundMusic();
      }
    }, 3000); // 3 saniye sonra müziği yeniden başlat

    // Hide multiplier texts when game is over
    if (_oObstacleManager && _oObstacleManager.removeMultiplierTextsFromStage) {
      _oObstacleManager.removeMultiplierTextsFromStage();
      console.log("🎯 Platform multipliers hidden when game over");
    }

    // Submit failed game to leaderboard server
    console.log("🎯 GameOver: About to call _submitToLeaderboard function...");
    console.log(
      "🎯 GameOver: this._submitToLeaderboard exists:",
      typeof this._submitToLeaderboard
    );
    console.log(
      "🔥 GameOver DIRECT TEST - window.s_oLeaderboardManager:",
      typeof window.s_oLeaderboardManager
    );

    try {
      // Calculate game time, ensure it's at least 1 second
      var gameTime = Math.max(
        1,
        Math.floor((new Date().getTime() - _iGameStartTime) / 1000)
      );

      var gameData = {
        betAmount: _fBetAmount,
        difficulty: _sDifficulty,
        platforms: _iSuccessfulJumps,
        multiplier: _fCurrentMultiplier,
        winnings: 0, // Failed game, no winnings
        gameTime: gameTime,
        txHash: null, // Game over doesn't have txHash usually
      };
      console.log(
        "🔥 GameOver: About to call _submitToLeaderboard with:",
        gameData
      );
      console.log("🔥 GameOver: Game time calculated:", gameTime, "seconds");
      this._submitToLeaderboard(gameData);
    } catch (submitError) {
      console.error(
        "❌ GameOver: Error calling _submitToLeaderboard:",
        submitError
      );
      console.error("❌ GameOver: Error stack:", submitError.stack);
    }

    // Parallax sistemi sıfırla (fail durumunda)
    this.resetParallax();

    // Shark attack animasyonunu başlat (fail durumunda)
    this.startSharkAttack();

    if (_bGameOver) {
      // Sadece splash sesi çal (fail durumunda)
      playSound("splash", 1, false);
      _bUpdateObst = false;

      // During fail, keep game UI visible until shark attack ends and game over screen appears
      if (_bGameStarted) {
        console.log(
          "Game Over! Waiting for shark attack to finish, then showing game over screen..."
        );

        // Process loss in wallet manager (UI side only - contract handles the actual loss)
        if (window.walletManager) {
          console.log("🧹 Processing loss and clearing game state...");
          window.walletManager.processLoss(_fBetAmount);
          window.walletManager.clearGameState();
        }

        // Do NOT show betting UI after game over in menu path; only via explicit restart
        // setTimeout removed to prevent canvas UI appearing on menu

        // Achievement checking removed

        // Game over ekranı shark attack animasyonu bittikten sonra gösterilecek
      } else {
        // Original game over behavior for non-gambling mode
        _oInterface.gameOver();
        if (_iScore > getItem(SCORE_ITEM_NAME)) {
          saveItem(SCORE_ITEM_NAME, _iScore);
        }
        // Non-gambling mode'da game over flag'ini sıfırla
        _bGameOver = false;
      }
    }
  };

  // TEST MODE FUNCTIONS REMOVED FOR PRODUCTION

  this.increaseScore = function () {
    _iScore += _iCurrentMultiplier;
    _oInterface.refreshScore(_iScore);
    _bJumping = false;
  };
  this.getScore = function () {
    return _iScore;
  };

  // Achievement checking methods removed

  this.getJumpsLeft = function () {
    return _iJumpsLeft;
  };

  // getCurrentMultiplier moved to line 480 with correct variable _fCurrentMultiplier
  this.onExit = function () {
    setVolume("soundtrack", 1);

    s_oGame.unload();
    s_oMain.gotoMenu();

    $(s_oMain).trigger("end_session");
    $(s_oMain).trigger("save_score", _iScore);

    $(s_oMain).trigger("show_interlevel_ad");
  };
  this.getNextXPos = function () {
    return _oObstacleManager.getNextXPos();
  };

  this.updateCollidables = function () {
    return _oObstacleManager.getArray();
  };

  // Kamera takip sistemi için sadece arka plan kaydırma fonksiyonu (UI elementleri hariç)
  // Arka plan ve oyun elementleri SABİT KALACAK - kamera takip sistemi kaldırıldı
  // Karakter platformlara zıplayarak ilerleyecek
  this.getCharacterManager = function () {
    return _oCharacterManager;
  };

  this.setupZOrder = function () {
    console.log("Setting up Z order...");
    console.log("Total children on stage:", s_oStage.numChildren);
    // Parallax katmanlarını en arkaya sırala
    if (_oSky && _oBGDecor && _oMiddleDecor && _oForeground && _oGround) {
      s_oStage.setChildIndex(_oSky, 0);
      s_oStage.setChildIndex(_oBGDecor, 1);
      s_oStage.setChildIndex(_oMiddleDecor, 2);
      s_oStage.setChildIndex(_oForeground, 3);
      s_oStage.setChildIndex(_oGround, 4);
      console.log("Parallax layers moved to indices 0-4 (back)");
    }
    // 2. First platform (arka)
    if (_oStartingPlatform) {
      s_oStage.setChildIndex(_oStartingPlatform, 5);
      console.log("First platform moved to index 5");
    }
    // 3. Diğer platformlar (nehirden önce)
    if (_oObstacleManager) {
      var obstacles = _oObstacleManager.getArray();
      for (var i = 0; i < obstacles.length; i++) {
        s_oStage.setChildIndex(obstacles[i], 6 + i);
      }
      console.log("Platforms moved to indices 6+");
    }
    // 4. Nehir animasyonu (platformlardan sonra)
    if (_oRiverAnimation && _oRiverAnimation.getContainer) {
      var riverContainer = _oRiverAnimation.getContainer();
      if (riverContainer) {
        s_oStage.setChildIndex(riverContainer, 6 + obstacles.length);
        console.log("River animation moved to index", 6 + obstacles.length);
      }
    }
    // 5. Köpek balığı animasyonu (nehirden sonra)
    if (_oSharkAnimation && _oSharkAnimation.getContainer) {
      var sharkContainer = _oSharkAnimation.getContainer();
      if (sharkContainer) {
        s_oStage.setChildIndex(sharkContainer, 7 + obstacles.length);
        console.log("Shark animation moved to index", 7 + obstacles.length);
      }
    }
    // 6. Karakter (tüm platformların üzerinde - en ön)
    var characterSprite = _oCharacterManager.getSprite();
    if (characterSprite) {
      s_oStage.setChildIndex(characterSprite, s_oStage.numChildren - 1);
      console.log(
        "Character moved to index",
        s_oStage.numChildren - 1,
        "(front - above all platforms)"
      );
    }
    console.log(
      "Z order setup complete: Parallax -> First Platform -> Other Platforms -> River -> Shark -> Character (front)"
    );
  };

  this.hideCharacter = function () {
    if (_oCharacterManager && _oCharacterManager.getSprite) {
      var characterSprite = _oCharacterManager.getSprite();
      if (characterSprite) {
        characterSprite.alpha = 0;
        console.log("Character hidden via CGame.hideCharacter()");
      }
    }
  };

  this.showCharacter = function () {
    if (_oCharacterManager && _oCharacterManager.getSprite) {
      var characterSprite = _oCharacterManager.getSprite();
      if (characterSprite) {
        characterSprite.alpha = 1.0;
        console.log("Character shown via CGame.showCharacter()");
      }
    }
  };

  this.getObstacleManager = function () {
    return _oObstacleManager;
  };

  // Save game result to JSON leaderboard and update social features
  this._saveGameResultToJSON = function (gameData) {
    try {
      // Save to JSON leaderboard
      if (window.jsonLeaderboard && window.jsonLeaderboard.isInitialized()) {
        window.jsonLeaderboard.saveGameResult(gameData);
        console.log("💾 Game result saved to JSON database:", gameData);
      } else {
        console.log("JSON Leaderboard not available, skipping save");
      }

      // Social features update removed
    } catch (error) {
      console.error("Error saving game result to JSON database:", error);
    }
  };

  // Calculate multiplier based on level, jumps left, and bet amount
  this.calculateMultiplier = function (iJumpsLeft, iLevel, iBetAmount) {
    // Base multiplier increases with each successful jump
    var fBaseMultiplier = 1.0 + (MAX_JUMPS - iJumpsLeft) * 0.5;

    // Level bonus (higher levels = higher multipliers)
    var fLevelBonus = 1.0 + (iLevel - 1) * 0.2;

    // Bet amount affects risk/reward ratio
    var fBetMultiplier = 1.0 + (iBetAmount - 1) * 0.1;

    var fFinalMultiplier = fBaseMultiplier * fLevelBonus * fBetMultiplier;

    // Ensure maximum winnings don't exceed 100 MON
    var fMaxMultiplier = 100 / iBetAmount;
    return Math.min(fFinalMultiplier, fMaxMultiplier);
  };

  // Betting UI functions
  // Betting UI functions - now supports decimal values
  this.setBetAmount = function (fBetAmount) {
    if (fBetAmount >= 1.0 && fBetAmount <= 5.0) {
      _fBetAmount = parseFloat(fBetAmount.toFixed(1)); // Round to 1 decimal place

      // Update multipliers if game is not started yet (during betting phase)
      if (!_bGameStarted && _oObstacleManager) {
        _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
      }
    }
  };

  this.decreaseBet = function () {
    console.log("decreaseBet called - Current bet:", _fBetAmount);
    if (_fBetAmount > 1.0) {
      var oldBet = _fBetAmount;
      _fBetAmount = parseFloat((_fBetAmount - 0.1).toFixed(1));
      if (_fBetAmount < 1.0) _fBetAmount = 1.0;

      console.log("Bet decreased from", oldBet, "to", _fBetAmount);

      // Update UI
      _oInterface.updateBetAmount(_fBetAmount);

      // Update multipliers if game is not started yet (during betting phase)
      if (!_bGameStarted && _oObstacleManager) {
        _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
      }
    } else {
      console.log("Cannot decrease bet - already at minimum (1.0)");
    }
  };

  this.increaseBet = function () {
    console.log("=== INCREASE BET CALLED ===");
    console.log("Current bet:", _fBetAmount);
    console.log("Stack trace:", new Error().stack);

    if (_fBetAmount < 5.0) {
      var oldBet = _fBetAmount;
      _fBetAmount = parseFloat((_fBetAmount + 0.1).toFixed(1));
      if (_fBetAmount > 5.0) _fBetAmount = 5.0;

      console.log("Bet increased from", oldBet, "to", _fBetAmount);

      // Update UI
      _oInterface.updateBetAmount(_fBetAmount);

      // Update multipliers if game is not started yet (during betting phase)
      if (!_bGameStarted && _oObstacleManager) {
        _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
      }
    } else {
      console.log("Cannot increase bet - already at maximum (5.0)");
    }
  };

  this.getBetAmount = function () {
    return _fBetAmount;
  };

  this.getDifficulty = function () {
    return _sDifficulty;
  };

  this.getCurrentMultiplier = function () {
    return _fCurrentMultiplier;
  };

  // Shark attack animasyonunu başlat (fail durumunda)
  this.startSharkAttack = function () {
    if (_oSharkAttackAnimation && !_oSharkAttackAnimation.isActive()) {
      _oSharkAttackAnimation.startAttack();
    }
  };

  // Shark attack animasyonunu durdur
  this.stopSharkAttack = function () {
    if (_oSharkAttackAnimation && _oSharkAttackAnimation.isActive()) {
      _oSharkAttackAnimation.endAttack();
    }
  };

  // Game over ekranını göster
  this.showGameOverScreen = function () {
    console.log("Showing game over screen - Bet lost:", _fBetAmount, "MON");

    // Cüzdan entegrasyonu - kayıp işle
    if (window.walletManager) {
      window.walletManager.processLoss(_fBetAmount);
    }

    // Oyun güncellemelerini durdur
    _bUpdate = false;
    _bUpdateObst = false;

    // Game over ekranı oluştur
    this.createGameOverScreen();
  };

  // Game over ekranı oluştur
  this.createGameOverScreen = function () {
    // Arka plan (yarı şeffaf siyah)
    var gameOverBg = new createjs.Shape();
    gameOverBg.graphics
      .beginFill("rgba(0,0,0,0.8)")
      .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gameOverBg.x = 0;
    gameOverBg.y = 0;
    gameOverBg.alpha = 0;

    // Ana container
    var gameOverContainer = new createjs.Container();
    gameOverContainer.x = CANVAS_WIDTH / 2;
    gameOverContainer.y = CANVAS_HEIGHT / 2;
    gameOverContainer.alpha = 0;

    // Ana panel (betting UI stili)
    var mainPanel = new createjs.Shape();
    mainPanel.graphics
      .beginLinearGradientFill(
        ["#4A0E4E", "#2D1B69", "#1A0B3D"],
        [0, 0.5, 1],
        0,
        0,
        0,
        400
      )
      .drawRoundRect(-200, -150, 400, 300, 20);

    // Altın border
    var panelBorder = new createjs.Shape();
    panelBorder.graphics
      .beginStroke("#FFD700")
      .setStrokeStyle(4)
      .drawRoundRect(-200, -150, 400, 300, 20);

    // Başlık
    var titleText = new createjs.Text(
      "💀 GAME OVER 💀",
      "bold 32px " + PRIMARY_FONT,
      "#FF4444"
    );
    titleText.textAlign = "center";
    titleText.textBaseline = "middle";
    titleText.x = 0;
    titleText.y = -100;
    titleText.shadow = new createjs.Shadow("#000000", 3, 3, 6);

    // Kayıp miktarı
    var lossText = new createjs.Text(
      "You lost:",
      "bold 24px " + PRIMARY_FONT,
      "#FFFFFF"
    );
    lossText.textAlign = "center";
    lossText.textBaseline = "middle";
    lossText.x = 0;
    lossText.y = -50;
    lossText.shadow = new createjs.Shadow("#000000", 2, 2, 4);

    // Bet miktarı
    var betAmountText = new createjs.Text(
      _fBetAmount.toFixed(1) + " MON",
      "bold 36px " + PRIMARY_FONT,
      "#FF4444"
    );
    betAmountText.textAlign = "center";
    betAmountText.textBaseline = "middle";
    betAmountText.x = 0;
    betAmountText.y = -10;
    betAmountText.shadow = new createjs.Shadow("#000000", 3, 3, 6);

    // Başarılı zıplama sayısı
    var jumpsText = new createjs.Text(
      "Successful jumps: " + _iSuccessfulJumps,
      "bold 20px " + PRIMARY_FONT,
      "#CCCCCC"
    );
    jumpsText.textAlign = "center";
    jumpsText.textBaseline = "middle";
    jumpsText.x = 0;
    jumpsText.y = 30;
    jumpsText.shadow = new createjs.Shadow("#000000", 2, 2, 4);

    // HTML tabanlı butonlar oluştur (ana sayfadaki gibi)
    this._createGameOverButtons();

    // Container'a ekle
    gameOverContainer.addChild(mainPanel);
    gameOverContainer.addChild(panelBorder);
    gameOverContainer.addChild(titleText);
    gameOverContainer.addChild(lossText);
    gameOverContainer.addChild(betAmountText);
    gameOverContainer.addChild(jumpsText);
    // Butonlar CGfxButton constructor'ı tarafından otomatik ekleniyor

    // Stage'e ekle - z-index sırası önemli
    s_oStage.addChild(gameOverBg);
    s_oStage.addChild(gameOverContainer);

    // Z-index'i en üste taşı (tüm diğer elementlerin üzerinde)
    s_oStage.setChildIndex(gameOverBg, s_oStage.numChildren - 2);
    s_oStage.setChildIndex(gameOverContainer, s_oStage.numChildren - 1);

    // Animasyon
    createjs.Tween.get(gameOverBg).to({ alpha: 1 }, 500, createjs.Ease.quadOut);
    createjs.Tween.get(gameOverContainer)
      .to({ alpha: 1, scaleX: 1.1, scaleY: 1.1 }, 400, createjs.Ease.backOut)
      .to({ scaleX: 1, scaleY: 1 }, 200, createjs.Ease.elasticOut);

    // Global referanslar
    this._gameOverBg = gameOverBg;
    this._gameOverContainer = gameOverContainer;
  };

  // HTML tabanlı game over butonları oluştur
  this._createGameOverButtons = function () {
    // Buton container'ı oluştur
    var buttonContainer = document.createElement("div");
    buttonContainer.id = "game-over-buttons";
    buttonContainer.style.cssText = `
            position: absolute;
            top: calc(50% + 100px);
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            display: flex;
            gap: 40px;
            justify-content: center;
            align-items: center;
            pointer-events: auto;
        `;

    // Restart butonu
    var restartBtn = document.createElement("button");
    restartBtn.id = "game-over-restart";
    restartBtn.innerHTML =
      '<img src="sprites/but_restart.png" style="width: 70px; height: auto;">';
    restartBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            transition: transform 0.2s ease;
        `;

    // Home butonu
    var homeBtn = document.createElement("button");
    homeBtn.id = "game-over-home";
    homeBtn.innerHTML =
      '<img src="sprites/but_home.png" style="width: 70px; height: auto;">';
    homeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            transition: transform 0.2s ease;
        `;

    // Hover efektleri
    restartBtn.addEventListener("mouseenter", function () {
      restartBtn.style.transform = "scale(1.1)";
    });
    restartBtn.addEventListener("mouseleave", function () {
      restartBtn.style.transform = "scale(1)";
    });

    homeBtn.addEventListener("mouseenter", function () {
      homeBtn.style.transform = "scale(1.1)";
    });
    homeBtn.addEventListener("mouseleave", function () {
      homeBtn.style.transform = "scale(1)";
    });

    // Event listener'ları ekle
    restartBtn.addEventListener("click", this.restartGame.bind(this));
    homeBtn.addEventListener("click", this.goToMainMenu.bind(this));

    // Container'a ekle
    buttonContainer.appendChild(restartBtn);
    buttonContainer.appendChild(homeBtn);

    // Body'ye ekle
    document.body.appendChild(buttonContainer);

    // Global referans
    this._gameOverButtonContainer = buttonContainer;
  };

  // HTML butonları kaldır
  this._removeGameOverButtons = function () {
    if (this._gameOverButtonContainer) {
      document.body.removeChild(this._gameOverButtonContainer);
      this._gameOverButtonContainer = null;
    }
  };

  // Oyunu yeniden başlat
  this.restartGame = function () {
    console.log("Restarting game...");

    // Game over ekranını kaldır
    if (this._gameOverBg) {
      s_oStage.removeChild(this._gameOverBg);
      this._gameOverBg = null;
    }
    if (this._gameOverContainer) {
      s_oStage.removeChild(this._gameOverContainer);
      this._gameOverContainer = null;
    }
    // HTML butonları kaldır
    this._removeGameOverButtons();

    // Game over flag'ini sıfırla
    _bGameOver = false;

    // Game started flag'ini de sıfırla (yeni oyun için)
    _bGameStarted = false;

    // Oyun güncellemelerini tekrar başlat
    _bUpdate = true;
    _bUpdateObst = true;

    // Shark attack'ı durdur
    this.stopSharkAttack();

    // Karakteri tekrar göster (yeni oyun için)
    this.showCharacter();

    // Reset character and platforms to starting positions (bu tüm game state'leri de resetler)
    this.resetGameElements();

    // Show betting UI again
    setTimeout(function () {
      _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
      // Wallet'ı tekrar göster
      if (_oInterface.showWallet) {
        _oInterface.showWallet();
        console.log("👁️ Wallet shown after game over");
      }
    }, 100);
  };

  // Ana menüye dön
  this.goToMainMenu = function () {
    console.log("Going to main menu...");

    // Game over ekranını kaldır
    if (this._gameOverBg) {
      s_oStage.removeChild(this._gameOverBg);
      this._gameOverBg = null;
    }
    if (this._gameOverContainer) {
      s_oStage.removeChild(this._gameOverContainer);
      this._gameOverContainer = null;
    }
    // HTML butonları kaldır
    this._removeGameOverButtons();

    // Game over flag'ini sıfırla
    _bGameOver = false;

    // Shark attack'ı durdur
    this.stopSharkAttack();

    // Iframe içindeyse parent'a mesaj gönder, değilse normal exit
    if (window.parent && window.parent !== window) {
      // Iframe içindeyiz, parent'a mesaj gönder
      console.log("Sending message to parent window...");
      window.parent.postMessage(
        {
          type: "goToMainMenu",
          action: "exit",
        },
        "*"
      );
    } else {
      // Normal sayfa, normal exit
      this.onExit();
    }
  };

  this.setDifficulty = function (sDifficulty) {
    _sDifficulty = sDifficulty;
    console.log("Difficulty set to:", _sDifficulty);

    // Update multipliers if game is not started yet (during betting phase)
    if (!_bGameStarted && _oObstacleManager) {
      _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
    }
  };

  // Start game after betting UI
  this.startGameplay = async function () {
    // Prevent multiple calls
    if (_bGameStarted) {
      console.log("Game already started, ignoring startGameplay call");
      return;
    }

    // Update multipliers with current difficulty before starting
    if (_oObstacleManager) {
      _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);
      console.log(
        "🎯 Platform multipliers updated for difficulty:",
        _sDifficulty
      );
    }

    // // Contract entegrasyonu: Wallet bağlı değilse uyarı ver
    // if (!window.walletManager || !window.walletManager.isConnected()) {
    //     console.log("❌ Wallet not connected - cannot start game");
    //     if (window.errorLogger) {
    //         window.errorLogger.showErrorToUser('Please connect your wallet to play!');
    //     }
    //     return;
    // }

    // Check for active round and offer recovery
    try {
      const contract = window.walletManager.getContract();
      const address = window.walletManager.getAddress();

      if (contract && address) {
        const hasActive = await contract.hasActiveRound(address);
        if (hasActive) {
          console.log(
            "⚠️ Player has active round - checking resume possibility..."
          );

          // Check if resume is possible (round info, timeout, VRF status)
          const resumeInfo = await this._checkResumeStatus(contract, address);

          // Show recovery/resume option to user with custom game dialog
          const userChoice = await this._showRecoveryDialog(
            resumeInfo.canResume,
            resumeInfo.reason
          );

          if (userChoice === "resume") {
            console.log("🎮 User chose to resume existing game");

            // TODO: Implement resume game functionality
            // For now, get round info and reconstruct game state
            try {
              // Double-check round still exists
              const stillHasActive = await contract.hasActiveRound(address);
              if (!stillHasActive) {
                this._showGameNotification(
                  "❌ Round Not Found",
                  "Active round no longer exists. Please start a new game.",
                  "error"
                );
                return;
              }

              const roundInfo = await contract.getPlayerRoundInfo(address);
              console.log("📊 Round info for resume:", roundInfo);

              if (!roundInfo.hasRound) {
                this._showGameNotification(
                  "❌ Round Not Found",
                  "Round information not available. Please start a new game.",
                  "error"
                );
                return;
              }

              this._showGameNotification(
                "🎮 Resume Feature",
                "Resume functionality coming soon! Using recovery for now.",
                "warning"
              );

              // Fallback to recovery for now
              const recoveryResult =
                await window.walletManager.recoverStuckRound();
              if (recoveryResult.success) {
                this._showGameNotification(
                  "✅ Funds Recovered",
                  "Your round was ended and funds recovered.",
                  "success"
                );
              }
              return;
            } catch (resumeError) {
              console.error("❌ Resume error:", resumeError);
              this._showGameNotification(
                "❌ Resume Failed",
                "Could not resume game. Try recovery instead.",
                "error"
              );
              return;
            }
          } else if (userChoice === "endRound") {
            console.log("💰 User chose to end round, attempting recovery...");

            try {
              // Double-check round still exists before recovery
              const stillHasActive = await contract.hasActiveRound(address);
              if (!stillHasActive) {
                this._showGameNotification(
                  "❌ Round Not Found",
                  "Active round no longer exists. Starting new game.",
                  "warning"
                );
                // Continue with normal game start
              } else {
                const recoveryResult =
                  await window.walletManager.recoverStuckRound();

                if (recoveryResult.success) {
                  console.log(
                    "✅ Immediate recovery successful:",
                    recoveryResult.txHash
                  );
                  this._showGameNotification(
                    "✅ Round Ended Successfully!",
                    `${recoveryResult.message}`,
                    "success"
                  );
                  // Continue with game start
                } else {
                  console.error(
                    "❌ Immediate recovery failed:",
                    recoveryResult.error
                  );

                  if (recoveryResult.needsTimeout) {
                    this._showGameNotification(
                      "⏰ 5-Minute Wait Required",
                      "Recovery requires 5-minute timeout. Your funds are safe. You can wait or come back later.",
                      "warning"
                    );
                  } else {
                    this._showGameNotification(
                      "❌ Recovery Failed",
                      recoveryResult.error,
                      "error"
                    );
                  }
                  return;
                }
              }
            } catch (recoveryError) {
              console.error("❌ Recovery error:", recoveryError);
              this._showGameNotification(
                "❌ Recovery Error",
                recoveryError.message + " Please try again later.",
                "error"
              );
              return;
            }
          } else {
            console.log("❌ User cancelled");
            this._showGameNotification(
              "❌ Cancelled",
              "Please complete or recover your current round to start a new game.",
              "warning"
            );
            return;
          }
        }
      }
    } catch (activeCheckError) {
      console.warn(
        "⚠️ Could not check for active round:",
        activeCheckError.message
      );
      // Continue with game start anyway
    }

    // Balance kontrolü
    if (!window.walletManager.canPlaceBet(_fBetAmount)) {
      console.log(
        "❌ Insufficient balance:",
        window.walletManager.getBalance(),
        "needed:",
        _fBetAmount
      );
      if (window.errorLogger) {
        window.errorLogger.showErrorToUser(
          "Insufficient MON balance. Need " + _fBetAmount + " MON to play."
        );
      }
      return;
    }

    console.log("🚀 Starting contract round...");

    // Contract round başlat
    const contractLevel = _sDifficulty === "easy" ? 0 : 1; // easy = 0, hard = 1

    // Notify LeaderboardManager that game is starting
    if (
      window.s_oLeaderboardManager &&
      window.s_oLeaderboardManager.setGameActive
    ) {
      window.s_oLeaderboardManager.setGameActive(true);
    }

    const roundResult = await window.walletManager.startRound(
      contractLevel,
      _fBetAmount
    );

    if (!roundResult.success) {
      console.error("❌ Contract round start failed:", roundResult.error);
      if (window.errorLogger) {
        window.errorLogger.showErrorToUser(
          "Failed to start game: " + roundResult.error
        );
      }
      return;
    }

    console.log("✅ Contract round started successfully:", roundResult.txHash);

    // Show VRF loading after contract round starts
    this._showVRFLoading();

    _bShowingBetUI = false;
    _bGameStarted = true;

    // Wallet'ı gizle (oyun başladığında) ama toggle butonunu aktif bırak
    // if (_oInterface && _oInterface.hideWalletForGameplay) {
    //     _oInterface.hideWalletForGameplay();
    //     console.log("🙈 Wallet hidden for gameplay (toggle button remains active)");
    // }
    _iSuccessfulJumps = 0;
    _fCurrentMultiplier = 1.0;
    _bGameOver = false; // Reset game over flag when starting new game
    _iGameStartTime = new Date().getTime(); // Set game start time
    _bFirstJumpCompleted = false; // İlk jump henüz yapılmadı
    _oInterface.hideBettingUI();

    // Update platform multipliers based on bet amount and difficulty
    _oObstacleManager.updateMultipliers(_fBetAmount, _sDifficulty);

    // Show multiplier texts when game starts
    if (_oObstacleManager && _oObstacleManager.addMultiplierTextsToStage) {
      _oObstacleManager.addMultiplierTextsToStage();
      console.log("🎯 Platform multipliers shown when game started");
    }

    // Show game UI
    _oInterface.showGameUI(_fBetAmount, _sDifficulty, _fCurrentMultiplier);

    // Enable cashout button when game starts
    if (_oInterface && _oInterface.enableCashoutButton) {
      _oInterface.enableCashoutButton();
    }

    // Update side panels for gameplay
    if (window.sidePanels) {
      window.sidePanels.setVisible(true);
      window.sidePanels.setBetAmount(_fBetAmount);
      window.sidePanels.resetLiveStats();
      console.log(`💰 Game started with bet amount: ${_fBetAmount} MON`);
    }

    console.log(
      "Starting gameplay with bet:",
      _fBetAmount,
      "difficulty:",
      _sDifficulty,
      "Contract round:",
      roundResult.roundId
    );

    // Auto mode game started event
    if (window.autoModeManager) {
      window.dispatchEvent(
        new CustomEvent("gameStarted", {
          detail: {
            betAmount: _fBetAmount,
            difficulty: _sDifficulty,
            roundId: roundResult.roundId,
          },
        })
      );
    }
  };

  // Calculate current multiplier based on successful jumps, bet amount, and difficulty
  this.calculateCurrentMultiplier = function () {
    // Base multiplier starts at 1.3 (minimum multiplier, no 1.0x platforms)
    var baseMultiplier = 1.3;

    // Jump bonus: each successful jump adds 0.3x
    var jumpBonus = _iSuccessfulJumps * 0.3;

    // Difficulty bonus: Hard mode gives extra multiplier
    var difficultyBonus = _sDifficulty === "hard" ? 0.5 : 0.0;

    // Calculate total multiplier
    _fCurrentMultiplier = baseMultiplier + jumpBonus + difficultyBonus;

    // Apply maximum limit based on bet amount to prevent excessive winnings
    var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
    _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);

    console.log(
      "Multiplier calculation - Jumps:",
      _iSuccessfulJumps,
      "Difficulty:",
      _sDifficulty,
      "Bet:",
      _fBetAmount,
      "Final multiplier:",
      _fCurrentMultiplier.toFixed(2)
    );

    return _fCurrentMultiplier;
  };

  // PUBLIC: Get current multiplier (for character winnings display)
  this.getCurrentMultiplier = function () {
    return _fCurrentMultiplier; // Return the platform-based multiplier from updateUIAfterLanding
  };

  // Cashout function
  // Cashout function
  this.cashout = async function () {
    try {
      console.log("Cashout button clicked!");

      // İlk jump kontrolü - cashout'u engelle
      if (!_bFirstJumpCompleted) {
        console.log("❌ Cashout blocked - first jump not completed yet");
        if (window.errorLogger) {
          window.errorLogger.showErrorToUser(
            "You must complete at least one jump before cashing out!"
          );
        }
        return;
      }

      // Log cashout attempt
      if (window.errorLogger) {
        window.errorLogger.info("Cashout attempted", {
          betAmount: _fBetAmount,
          currentMultiplier: _fCurrentMultiplier,
          successfulJumps: _iSuccessfulJumps,
          difficulty: _sDifficulty,
          gameStarted: _bGameStarted,
          cashoutInProgress: _bCashoutInProgress,
          firstJumpCompleted: _bFirstJumpCompleted,
        });
      }

      // ÇOKLU TIKLAMA ENGELLEMESİ
      if (_bCashoutInProgress) {
        console.log("Cashout already in progress - ignoring click");
        if (window.errorLogger) {
          window.errorLogger.warn("Cashout blocked - already in progress");
        }
        return;
      }

      console.log(
        "Cashout internal check - _bGameStarted:",
        _bGameStarted,
        "_bGameOver:",
        _bGameOver
      );

      if (!_bGameStarted || _bGameOver) {
        console.log("Cannot cashout - game not active");
        if (window.errorLogger) {
          window.errorLogger.warn("Cashout blocked - game not active", {
            gameStarted: _bGameStarted,
            gameOver: _bGameOver,
          });
        }
        return;
      }

      // Cashout işlemini başlat
      _bCashoutInProgress = true;

      // HEMEN OYUN DURUMUNU DURDUR - Asenkron işlemleri engelle
      _bGameStarted = false;

      console.log("💰 Executing contract cashout...");

      // Contract cashout transaction
      var contractResult = null;
      if (window.walletManager && window.walletManager.isGameActive()) {
        contractResult = await window.walletManager.cashOut();

        if (!contractResult.success) {
          console.error("❌ Contract cashout failed:", contractResult.error);
          if (window.errorLogger) {
            window.errorLogger.showErrorToUser(
              "Cashout transaction failed: " + contractResult.error
            );
          }

          // Reset game state if contract transaction fails
          _bGameStarted = true; // Re-enable game
          _bCashoutInProgress = false;
          return;
        }

        console.log("✅ Contract cashout successful:", contractResult.txHash);
      }

      // Calculate total winnings (bet + profit)
      var totalWinnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Max 100 MON

      // Calculate net winnings (profit only) for leaderboard
      var netWinnings = totalWinnings - _fBetAmount;

      // If no jumps made, net winnings should be 0 (refund only)
      if (_iSuccessfulJumps === 0) {
        netWinnings = 0;
        console.log(
          "🚫 No jumps made - counting as refund only, net winnings = 0"
        );
      }

      // Use total winnings for contract payout, net winnings for leaderboard
      var winnings = totalWinnings;

      console.log("💰 Cashout Summary:");
      console.log(
        "  - Total payout:",
        winnings.toFixed(2),
        "MON (bet + profit)"
      );
      console.log(
        "  - Net profit:",
        netWinnings.toFixed(2),
        "MON (for leaderboard)"
      );
      console.log("  - Successful jumps:", _iSuccessfulJumps);

      // Stop background music when cashing out
      console.log("🎵 Stopping background music on Cashout...");
      if (typeof stopSound === "function") {
        stopSound("soundtrack");
      } else {
        console.log("⚠️ stopSound function not available");
      }

      // Schedule music restart after cashout
      setTimeout(function () {
        if (s_oMain && s_oMain.restartBackgroundMusic) {
          console.log(
            "🎵 Scheduling background music restart after cashout..."
          );
          s_oMain.restartBackgroundMusic();
        }
      }, 2000); // 2 saniye sonra müziği yeniden başlat

      // Log successful cashout
      if (window.errorLogger) {
        window.errorLogger.info("Cashout successful", {
          totalPayout: winnings,
          netProfit: netWinnings,
          betAmount: _fBetAmount,
          multiplier: _fCurrentMultiplier,
          successfulJumps: _iSuccessfulJumps,
        });
      }

      // Submit to leaderboard BEFORE resetting game elements
      console.log("🎯 About to call _submitToLeaderboard function...");
      console.log(
        "🎯 this._submitToLeaderboard exists:",
        typeof this._submitToLeaderboard
      );

      // IMMEDIATE TEST: Call directly without try-catch to see exact error
      console.log(
        "🔥 DIRECT TEST - window.s_oLeaderboardManager:",
        typeof window.s_oLeaderboardManager
      );
      console.log(
        "🔥 DIRECT TEST - window.s_oLeaderboardManager:",
        window.s_oLeaderboardManager
      );

      try {
        // Calculate game time, ensure it's at least 1 second
        var gameTime = Math.max(
          1,
          Math.floor((new Date().getTime() - _iGameStartTime) / 1000)
        );

        // Store values BEFORE reset to avoid losing data
        var finalBetAmount = _fBetAmount;
        var finalDifficulty = _sDifficulty;
        var finalPlatforms = _iSuccessfulJumps;
        var finalMultiplier = _fCurrentMultiplier;

        var gameData = {
          betAmount: finalBetAmount,
          difficulty: finalDifficulty,
          platforms: finalPlatforms,
          multiplier: finalMultiplier,
          winnings: netWinnings, // Send net winnings (profit only) to leaderboard
          gameTime: gameTime,
          txHash: contractResult ? contractResult.txHash : null,
        };
        console.log(
          "🔥 DIRECT TEST - About to call _submitToLeaderboard with:",
          gameData
        );
        console.log("🔥 Game time calculated:", gameTime, "seconds");
        console.log("🔥 NET WINNINGS FOR LEADERBOARD:", netWinnings);
        console.log("🔥 TOTAL WINNINGS FOR WALLET:", winnings);
        console.log(
          "🔥 FINAL VALUES - Platforms:",
          finalPlatforms,
          "Multiplier:",
          finalMultiplier,
          "Bet:",
          finalBetAmount
        );
        this._submitToLeaderboard(gameData);
      } catch (submitError) {
        console.error("❌ Error calling _submitToLeaderboard:", submitError);
        console.error("❌ Error stack:", submitError.stack);
      }

      // Hide game UI immediately
      _oInterface.hideGameUI();

      // Reset character and platforms to starting positions (bu tüm game state'leri de resetler)
      this.resetGameElements();
      // Shark attack animasyonunu durdur (cashout'ta)
      this.stopSharkAttack();

      // Cüzdan entegrasyonu - kazanç işle (Wallet balance will be updated by contract events)
      if (window.walletManager) {
        window.walletManager.processWin(winnings); // Total payout for wallet
      }

      // Achievement checking removed

      // Show beautiful cashout notification
      showCashoutNotification(winnings, false); // false = manuel cashout

      // Reset game state immediately
      this.resetGameElements();
      _bGameStarted = false;
      _bGameOver = false;

      // Show gambling UI again after shorter delay
      var self = this;
      setTimeout(function () {
        console.log("Showing betting UI after cashout...");
        console.log("Interface reference:", _oInterface);
        console.log(
          "showCanvasBettingUI function:",
          _oInterface ? _oInterface.showCanvasBettingUI : "undefined"
        );
        if (_oInterface && _oInterface.showCanvasBettingUI) {
          _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
          // Wallet'ı tekrar göster
          if (_oInterface.showWallet) {
            _oInterface.showWallet();
            console.log("👁️ Wallet shown after cashout");
          }
        } else {
          console.error(
            "Interface or showCanvasBettingUI function not available"
          );
        }

        // Parallax sistemi sıfırla (cashout'ta)
        this.resetParallax();

        // Cashout işlemi tamamlandı
        _bCashoutInProgress = false;
      }, 3500); // 3.5 seconds delay (notification + 0.5s buffer)

      // Additional safety: Force UI reset after notification
      setTimeout(function () {
        console.log("🔧 Safety UI reset after cashout notification");
        if (_oInterface && _oInterface.showCanvasBettingUI) {
          _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
        }
        if (_oInterface && _oInterface.showWallet) {
          _oInterface.showWallet();
        }
      }, 4000); // 4 seconds delay as backup
    } catch (error) {
      // Log error but don't show to user if cashout was successful
      if (window.errorLogger) {
        window.errorLogger.error("Cashout process error (non-critical)", {
          error: error.message,
          stack: error.stack,
          betAmount: _fBetAmount,
          currentMultiplier: _fCurrentMultiplier,
          successfulJumps: _iSuccessfulJumps,
        });
      }

      // Don't show error to user - cashout was successful
      // Only log for debugging purposes

      // Reset cashout state
      _bCashoutInProgress = false;
    }
  };

  // Cashout function with specific multiplier (for congratulations popup)
  this.cashoutWithMultiplier = async function (specificMultiplier) {
    if (!_bGameStarted) return;

    console.log(
      "🎉 MANUAL CASHOUT - Starting contract cashout with multiplier:",
      specificMultiplier.toFixed(2)
    );

    // Stop background music when cashing out from celebration
    console.log("🎵 Stopping background music on Manual Cashout...");
    if (typeof stopSound === "function") {
      stopSound("soundtrack");
    } else {
      console.log("⚠️ stopSound function not available");
    }

    // Schedule music restart after manual cashout
    setTimeout(function () {
      if (s_oMain && s_oMain.restartBackgroundMusic) {
        console.log(
          "🎵 Scheduling background music restart after manual cashout..."
        );
        s_oMain.restartBackgroundMusic();
      }
    }, 2000); // 2 saniye sonra müziği yeniden başlat

    // HEMEN OYUN DURUMUNU DURDUR - Asenkron işlemleri engelle
    _bGameStarted = false;

    try {
      // GERÇEK CONTRACT CASHOUT İŞLEMİ
      if (window.walletManager && window.walletManager.cashOut) {
        console.log("💸 Initiating real contract cashout transaction...");

        const result = await window.walletManager.cashOut();

        if (result.success) {
          console.log("✅ MANUAL CASHOUT SUCCESS:");
          console.log("   💸 Transaction hash:", result.txHash);
          console.log("   🎉 Celebration cashout complete");
          console.log(
            "   🏆 Player successfully cashed out from celebration platform"
          );

          // Calculate expected winnings (for display)
          var expectedWinnings = Math.min(
            _fBetAmount * specificMultiplier,
            100
          ); // Max 100 MON

          // Hide game UI immediately
          _oInterface.hideGameUI();

          // Reset character and platforms to starting positions
          this.resetGameElements();

          // Shark attack animasyonunu durdur
          this.stopSharkAttack();

          // Save to JSON database with specific multiplier
          this._saveGameResultToJSON({
            playerName: "Player" + Math.floor(Math.random() * 1000),
            betAmount: _fBetAmount,
            difficulty: _sDifficulty,
            multiplier: specificMultiplier,
            winnings: expectedWinnings,
            successfulJumps: _iSuccessfulJumps,
            gameTime: Math.floor(
              (new Date().getTime() - _iGameStartTime) / 1000
            ),
            isWin: true,
          });

          // Reset game state immediately
          this.resetGameElements();
          _bGameStarted = false;
          _bGameOver = false;

          // Show cashout notification with expected winnings
          showCashoutNotification(expectedWinnings, false); // false = manuel cashout

          // PROFIT UPDATE - Contract'tan gelen gerçek kazanç WalletManager tarafından otomatik eklenir
          console.log(
            "🎉 Real contract winnings automatically processed by WalletManager"
          );

          // Safety UI reset after manual cashout
          setTimeout(function () {
            console.log("🔧 Safety UI reset after manual cashout");
            if (_oInterface && _oInterface.showCanvasBettingUI) {
              _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
            }
            if (_oInterface && _oInterface.showWallet) {
              _oInterface.showWallet();
            }
          }, 4000); // 4 seconds delay as backup
        } else {
          console.error("❌ MANUAL CASHOUT FAILED:");
          console.error("   ❌ Error:", result.error);
          // Fallback to frontend-only cashout if contract fails
          this._fallbackCashout(specificMultiplier);
        }
      } else {
        console.error("❌ WalletManager cashOut function not found!");
        // Fallback to frontend-only cashout
        this._fallbackCashout(specificMultiplier);
      }
    } catch (error) {
      console.error("❌ MANUAL CASHOUT ERROR:", error);
      // Fallback to frontend-only cashout
      this._fallbackCashout(specificMultiplier);
    }
  };

  // Fallback cashout for when contract is not available
  this._fallbackCashout = function (specificMultiplier) {
    console.log("🔄 Using fallback cashout (frontend-only)");

    // Stop background music in fallback cashout
    console.log("🎵 Stopping background music on Fallback Cashout...");
    if (typeof stopSound === "function") {
      stopSound("soundtrack");
    } else {
      console.log("⚠️ stopSound function not available");
    }

    // Schedule music restart after fallback cashout
    setTimeout(function () {
      if (s_oMain && s_oMain.restartBackgroundMusic) {
        console.log(
          "🎵 Scheduling background music restart after fallback cashout..."
        );
        s_oMain.restartBackgroundMusic();
      }
    }, 2000); // 2 saniye sonra müziği yeniden başlat

    // Clear wallet manager game state
    if (window.walletManager && window.walletManager.clearGameState) {
      window.walletManager.clearGameState();
      console.log(
        "🧹 Game state cleared in wallet manager on fallback cashout"
      );
    }

    var winnings = Math.min(_fBetAmount * specificMultiplier, 100); // Max 100 MON

    console.log(
      "Fallback cashout! Multiplier:",
      specificMultiplier.toFixed(2),
      "Winnings:",
      winnings.toFixed(2),
      "MON"
    );

    // Hide game UI immediately
    _oInterface.hideGameUI();

    // Reset character and platforms to starting positions
    this.resetGameElements();

    // Shark attack animasyonunu durdur
    this.stopSharkAttack();

    // Save to JSON database with specific multiplier
    this._saveGameResultToJSON({
      playerName: "Player" + Math.floor(Math.random() * 1000),
      betAmount: _fBetAmount,
      difficulty: _sDifficulty,
      multiplier: specificMultiplier,
      winnings: winnings,
      successfulJumps: _iSuccessfulJumps,
      gameTime: Math.floor((new Date().getTime() - _iGameStartTime) / 1000),
      isWin: true,
    });

    // Reset game state
    _bGameStarted = false;
    _bGameOver = false;

    // Show cashout notification
    showCashoutNotification(winnings, false); // false = manuel cashout

    // PROFIT UPDATE - WalletManager'a kazancı ekle
    if (window.walletManager && window.walletManager.processWin) {
      console.log(
        "🎉 Adding fallback celebration platform winnings to profit:",
        winnings.toFixed(4),
        "MON"
      );
      window.walletManager.processWin(winnings);
    } else {
      console.error("❌ WalletManager not available for profit update");
    }

    // Safety UI reset after fallback cashout
    setTimeout(function () {
      console.log("🔧 Safety UI reset after fallback cashout");
      if (_oInterface && _oInterface.showCanvasBettingUI) {
        _oInterface.showCanvasBettingUI(_fBetAmount, _iCurrentLevel);
      }
      if (_oInterface && _oInterface.showWallet) {
        _oInterface.showWallet();
      }
    }, 4000); // 4 seconds delay as backup
  };

  this.releaseScreen = function () {
    // Mouse release - artık uzun basma gerektirmez
    _bTapping = false;
    _iTappingTime = 0;
  };

  this.tapScreen = async function () {
    // If betting UI is showing, don't allow jumping
    if (_bShowingBetUI) {
      console.log("JUMP BLOCKED - Betting UI is showing!");
      return;
    }

    // If game is not started, don't allow jumping
    if (!_bGameStarted) {
      console.log("JUMP BLOCKED - Game not started!");
      return;
    }

    // If game over screen is showing, don't allow jumping
    if (_bGameOver) {
      console.log("JUMP BLOCKED - Game over screen is active!");
      return;
    }

    // CONTRACT ROUND BITME KONTROLÜ KALDIRILDI - Çok erken yapılıyordu
    // Contract round bitme kontrolü sadece jumpToPlatform başarısız olduğunda yapılacak

    // COOLDOWN SİSTEMİ - CCharacter.js'deki zıplama durumunu kontrol et
    // 8. zıplama (kutlama platformuna) için özel kontrol - _iJumpsLeft 0 olsa bile izin ver
    // 8. zıplama kontrolü: _iSuccessfulJumps 7 ise (7. platformdayız) kutlama platformuna zıplamaya izin ver
    var canJump8th = _iSuccessfulJumps === 7 && _iJumpsLeft === 0;

    if (
      _bJumping ||
      (_iJumpsLeft < 0 && !canJump8th) ||
      !_oCharacterManager.onGround()
    ) {
      console.log(
        "JUMP BLOCKED - Game level block! Jumping:",
        _bJumping,
        "JumpsLeft:",
        _iJumpsLeft,
        "OnGround:",
        _oCharacterManager.onGround(),
        "CanJump8th:",
        canJump8th,
        "SuccessfulJumps:",
        _iSuccessfulJumps
      );
      return;
    }

    // 8. zıplama için özel log
    if (canJump8th) {
      console.log(
        "🎉 ALLOWING 8TH JUMP TO CELEBRATION PLATFORM! SuccessfulJumps:",
        _iSuccessfulJumps,
        "JumpsLeft:",
        _iJumpsLeft
      );
    }

    // If already waiting for a jump result, don't allow new jump
    if (_bWaitingForJumpResult) {
      console.log("JUMP BLOCKED - Already waiting for contract result!");
      return;
    }

    // VRF hazır olana kadar jump'a izin verme
    if (
      window.walletManager &&
      window.walletManager.isVRFReady &&
      !window.walletManager.isVRFReady()
    ) {
      console.log("JUMP BLOCKED - VRF not ready yet, please wait...");
      return;
    }

    // Auto mode kontrolü - manual mode'da manuel jump'a izin ver
    if (
      window.autoModeManager &&
      window.autoModeManager.isAutoMode() &&
      !window.autoModeManager.isAutoJumping()
    ) {
      console.log("JUMP BLOCKED - Auto mode active, manual jumps disabled");
      return;
    }

    // CONTRACT ROUND BITME KONTROLÜ KALDIRILDI - Çok erken yapılıyordu
    // Contract round bitme kontrolü sadece jumpToPlatform başarısız olduğunda yapılacak

    // Contract jump transaction - SYNCHRONOUS (wait for result)
    console.log(
      "🔍 JUMP DEBUG - WalletManager exists:",
      !!window.walletManager
    );
    console.log(
      "🔍 JUMP DEBUG - Game active:",
      window.walletManager ? window.walletManager.isGameActive() : "N/A"
    );
    console.log(
      "🔍 JUMP DEBUG - Connected:",
      window.walletManager ? window.walletManager.isConnected() : "N/A"
    );

    // TEST MODE CODE REMOVED FOR PRODUCTION

    if (window.walletManager && window.walletManager.isGameActive()) {
      // Check if this is the final jump to celebration platform (8th jump)
      const currentSuccessfulJumps = this.getSuccessfulJumps
        ? this.getSuccessfulJumps()
        : 0;
      const currentJumpsLeft = this.getJumpsLeft();
      console.log(
        "🔍 Celebration check - Successful jumps:",
        currentSuccessfulJumps
      );
      console.log("🔍 Celebration check - Jumps left:", currentJumpsLeft);

      // CELEBRATION JUMP LOGIC: If player completed 7 platforms successfully, 8th jump is celebration
      const isCelebrationJump = currentSuccessfulJumps >= 7;

      if (isCelebrationJump) {
        console.log(
          "🎉 CELEBRATION JUMP - No transaction needed, direct celebration!"
        );
        console.log(
          "🎉 Player completed 7 platforms, now jumping to celebration platform!"
        );

        // Skip transaction and go directly to celebration
        _oCharacterManager.jump();
        return;
      }

      console.log(
        "🔧 NORMAL JUMP - Platform",
        currentSuccessfulJumps + 1,
        "- Transaction needed"
      );

      console.log("🚀 Sending jumpToPlatform transaction to contract...");

      // CRITICAL FIX: Decrement jumpsLeft BEFORE contract call
      _iJumpsLeft--;
      console.log("🔄 JumpsLeft decremented to:", _iJumpsLeft);

      // Set waiting flag to prevent multiple jumps
      _bWaitingForJumpResult = true;

      try {
        // Wait for contract transaction to complete
        const result = await window.walletManager.jumpToPlatform();

        if (result.success) {
          console.log("✅ Jump transaction successful:", result.txHash);

          // Use REAL contract result from transaction receipt
          const contractResult = !result.jumpFailed; // true if jump succeeded, false if failed
          console.log(
            "🎯 REAL Contract result from transaction:",
            contractResult,
            "Round ended:",
            result.roundEnded
          );

          // Set the real contract result
          this.setContractJumpResult(contractResult);

          // Perform visual jump immediately with real result
          _oCharacterManager.jump();

          return; // Don't continue to manual jump
        } else {
          console.warn("⚠️ Jump transaction failed:", result.error);
          _bWaitingForJumpResult = false;

          // JUMP TRANSACTION BAŞARISIZ - Contract round bitmiş olabilir
          console.log(
            "💀 JUMP TRANSACTION FAILED - Contract round may have ended"
          );
          this.gameOver();
          return;
        }
      } catch (error) {
        console.error("❌ Jump transaction error:", error);
        _bWaitingForJumpResult = false;

        // JUMP TRANSACTION ERROR - Contract round bitmiş olabilir
        console.log(
          "💀 JUMP TRANSACTION ERROR - Contract round may have ended"
        );
        this.gameOver();
        return;
      }
    }

    // RİSK KONTROLÜ KALDIRILDI - PLATFORMA İNİŞTE YAPILACAK
    // Risk kontrolü artık CCharacter.js'de platforma iniş anında yapılacak

    // Normal jumping logic (fallback - should not be reached)
    _bJumping = true;
    // _iJumpsLeft already decremented above
    // _iSuccessfulJumps artırımını kaldır - CCharacter.js'de platforma iniş anında artırılacak
    // _iSuccessfulJumps++;

    _oCharacterManager.updateGraphics(0);
    _oCharacterManager.setCharge(false);
    _oCharacterManager.jump(JUMP_POWER);

    if (!_oCharacterManager.isColliding()) {
      _oObstacleManager.setMoltiplier(JUMP_POWER);
    } else {
      _oObstacleManager.setMoltiplier(0);
    }

    console.log("Jump started! Jumps:", _iSuccessfulJumps, "Bet:", _fBetAmount);

    // DÜZELTME: UI güncelleme kaldırıldı - karakter platforma indiğinde güncellenecek
    // UI güncelleme artık CCharacter.js'deki jump fonksiyonunda, karakter platforma indiğinde yapılacak
  };

  // Yeni fonksiyon: Karakter platforma indiğinde UI'ı güncelle - platform indexi ile
  this.updateUIAfterLanding = function (platformIndex, isCelebrationPlatform) {
    // Platform index kontrolü (0-7 arasında olmalı - 8 platform var)
    if (platformIndex < 0 || platformIndex > 7) {
      console.error("Invalid platform index:", platformIndex, "Expected 0-7");
      return;
    }

    // İlk jump tamamlandı - artık cashout aktif olabilir
    if (!_bFirstJumpCompleted) {
      _bFirstJumpCompleted = true;
      console.log("🎯 First jump completed - cashout now enabled");

      // Cashout button'u enable et
      if (_oInterface && _oInterface.enableCashoutButton) {
        _oInterface.enableCashoutButton();
      }
    }

    // SidePanels'a platform counter'ı güncelle
    if (window.sidePanels) {
      window.sidePanels.updatePlatformCounter(platformIndex);
    }

    // Kutlama platformu kontrolü (index 7) - ÖZEL KAZANÇ HESAPLAMASI
    if (platformIndex === 7 || isCelebrationPlatform) {
      console.log(
        "🎉 Celebration platform reached - calculating special winnings!"
      );
      console.log(
        "🎉 FINAL CELEBRATION - Setting game over state to prevent further actions"
      );
      _bGameOver = true; // Kutlama başladığında oyunu bitir

      // Kutlama platformu için özel multiplier - 7. platformun multiplier'ını kullan
      const multiplierConfig = window.gameConfig
        ? window.gameConfig.getMultipliers()
        : {
            easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19],
            hard: [1.6, 2.67, 4.44, 7.41, 12.35, 20.58, 34.3],
          };

      var easyMultipliers = multiplierConfig.easy;
      var celebrationMultiplier = easyMultipliers[6]; // 7. platformun multiplier'ı (index 6)

      console.log(
        "🎉 Celebration platform multiplier:",
        celebrationMultiplier,
        "Difficulty:",
        _sDifficulty
      );
      _fCurrentMultiplier = celebrationMultiplier;

      // Apply maximum limit based on bet amount to prevent excessive winnings
      var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
      _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);

      _fCurrentWinnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Cap at 100 MON

      console.log(
        "🎉 Celebration platform winnings calculated:",
        _fCurrentWinnings.toFixed(4),
        "MON"
      );
      return;
    }

    // Get multiplier values from configuration - MUST MATCH CONTRACT
    const multiplierConfig = window.gameConfig
      ? window.gameConfig.getMultipliers()
      : {
          easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19, 7.19], // Added 8th platform (celebration)
          hard: [1.6, 2.67, 4.44, 7.41, 12.35, 20.58, 34.3, 34.3], // Added 8th platform (celebration)
        };

    var easyMultipliers = multiplierConfig.easy; // Index 0 = 1. platform
    var hardMultipliers = multiplierConfig.hard; // Index 0 = 1. platform

    // Platform indexine göre multiplier seç - DIFFICULTY'ye göre seç
    // platformIndex 0 = 1. platform (firstplatform'dan sonraki ilk platform)
    var currentMultipliers =
      _sDifficulty === "hard" ? hardMultipliers : easyMultipliers;
    // Validate platform index
    if (platformIndex < 0 || platformIndex >= currentMultipliers.length) {
      console.error(
        "❌ Invalid platform index for multiplier:",
        platformIndex,
        "Array length:",
        currentMultipliers.length
      );
      platformIndex = Math.max(
        0,
        Math.min(platformIndex, currentMultipliers.length - 1)
      );
      console.log("🔧 Corrected platform index to:", platformIndex);
    }

    var platformMultiplier = currentMultipliers[platformIndex];

    console.log(
      "🔍 Multiplier debug - Difficulty:",
      _sDifficulty,
      "Platform index:",
      platformIndex,
      "Selected array:",
      _sDifficulty === "hard" ? "HARD" : "EASY"
    );
    console.log("🔍 Available multipliers:", currentMultipliers);
    console.log(
      "🔍 Selected multiplier for index",
      platformIndex,
      ":",
      platformMultiplier
    );

    console.log(
      "Platform",
      platformIndex + 1,
      "multiplier set to:",
      platformMultiplier,
      "Difficulty:",
      _sDifficulty
    );
    _fCurrentMultiplier = platformMultiplier;

    // Apply maximum limit based on bet amount to prevent excessive winnings
    var maxMultiplier = 100 / _fBetAmount; // Ensure max 100 MON winnings
    _fCurrentMultiplier = Math.min(_fCurrentMultiplier, maxMultiplier);

    _fCurrentWinnings = Math.min(_fBetAmount * _fCurrentMultiplier, 100); // Cap at 100 MON

    // Update game UI with current stats
    if (_oInterface && _oInterface.updateGameUI) {
      _oInterface.updateGameUI(
        _fCurrentMultiplier,
        _fCurrentWinnings,
        _iSuccessfulJumps
      );
    }

    // CRITICAL: Update character winnings display with new multiplier
    if (_oCharacterManager && _oCharacterManager.updateWinningsDisplay) {
      console.log(
        "🔄 Updating character winnings with new multiplier:",
        _fCurrentMultiplier
      );
      _oCharacterManager.updateWinningsDisplay();
    }

    // Update side panels with live stats
    if (window.sidePanels) {
      window.sidePanels.updateLiveStats(
        _fCurrentMultiplier,
        _iSuccessfulJumps,
        _fBetAmount
      );
    }

    console.log(
      "UI updated after landing! Platform:",
      platformIndex,
      "Bet:",
      _fBetAmount,
      "Platform Multiplier:",
      platformMultiplier.toFixed(2),
      "Final Multiplier:",
      _fCurrentMultiplier.toFixed(2),
      "Winnings:",
      _fCurrentWinnings.toFixed(2)
    );
  };

  // Calculate jump risk based on difficulty - Configuration-based risk system
  this.calculateJumpRisk = function (platformIndex) {
    if (!_bGameStarted) return 0;

    // Get risk values from configuration
    const riskConfig = window.gameConfig
      ? window.gameConfig.getRisk()
      : { easy: 0.25, hard: 0.4 };

    if (_sDifficulty === "easy") {
      return riskConfig.easy; // %25 risk - Easy mode (configurable)
    } else if (_sDifficulty === "hard") {
      return riskConfig.hard; // %40 risk - Hard mode (configurable)
    }

    return 0;
  };

  // Reset game elements to starting positions
  // Reset game elements to starting positions - KAPSAMLI HARD RESET
  this.resetGameElements = function () {
    console.log("🔄 COMPREHENSIVE HARD RESET STARTING...");

    // 1. ÖNCE TÜM GAME STATE'LERİ SIFIRLA
    _bGameStarted = false;
    _bShowingBetUI = true;
    _bGameOver = false;
    _bJumping = false;
    _bTapping = false;
    _iSuccessfulJumps = 0;
    _fCurrentMultiplier = 1.0;
    _bFirstJumpCompleted = false; // İlk jump flag'ini resetle

    // SidePanels'a platform counter'ı resetle
    if (window.sidePanels) {
      window.sidePanels.resetPlatformCounter();
    }
    _fCurrentWinnings = 0;
    _iJumpsLeft = MAX_JUMPS;
    _iTappingTime = 0;
    _bCollision = false;
    _oCollision = null;
    _bUpdateObst = true;
    _bCashoutInProgress = false; // Cashout flag'ini de resetle

    console.log("✅ Game state variables reset");

    // 2. CHARACTER RESET - TÜM TWEEN'LERİ DURDUR
    if (_oCharacterManager) {
      // Önce tüm character tween'lerini durdur
      var characterSprite = _oCharacterManager.getSprite();
      if (characterSprite) {
        createjs.Tween.removeTweens(characterSprite);
        // Character'i görünür yap (shark attack'tan sonra gizli kalabilir)
        characterSprite.alpha = 1.0;
      }

      // Toz efektlerini temizle
      _oCharacterManager.clearAllDustEffects();

      // Character pozisyonunu config tabanlı başlangıç değerleriyle resetle
      _oCharacterManager.resetPosition(STARTX, STARTY);

      // Character reset fonksiyonunu da çağır
      if (_oCharacterManager.reset) {
        _oCharacterManager.reset();
      }
    }

    console.log("✅ Character reset complete");

    // 3. PLATFORM RESET - TÜM TWEEN'LERİ DURDUR
    if (_oObstacleManager) {
      // Önce tüm platform tween'lerini durdur
      var platforms = _oObstacleManager.getArray();
      for (var i = 0; i < platforms.length; i++) {
        if (platforms[i]) {
          createjs.Tween.removeTweens(platforms[i]);
        }
      }

      // Platform pozisyonlarını resetle
      _oObstacleManager.reset();

      // Platform animasyonlarını resetle
      platforms = _oObstacleManager.getArray(); // Yeniden al (reset sonrası)
      for (var i = 0; i < platforms.length; i++) {
        if (platforms[i] && platforms[i].gotoAndStop) {
          platforms[i].gotoAndStop("idle");
        }
      }
    }

    console.log("✅ Platforms reset complete");

    // 4. FIRST PLATFORM RESET
    if (_oStartingPlatform) {
      createjs.Tween.removeTweens(_oStartingPlatform);
      _oStartingPlatform.x = STARTX;
      _oStartingPlatform.y = FIRST_PLATFORM_Y;
    }

    console.log("✅ First platform reset complete");

    // 5. RIVER ANIMATION RESET - YENİ!
    if (_oRiverAnimation && _oRiverAnimation.reset) {
      _oRiverAnimation.reset();
    }

    console.log("✅ River animation reset complete");

    // 6. SHARK ANIMATION RESET - YENİ!
    if (_oSharkAnimation && _oSharkAnimation.reset) {
      _oSharkAnimation.reset();
    }

    console.log("✅ Shark animation reset complete");

    // 7. SHARK ATTACK ANIMATION RESET - YENİ!
    if (_oSharkAttackAnimation && _oSharkAttackAnimation.reset) {
      _oSharkAttackAnimation.reset();
    }

    console.log("✅ Shark attack animation reset complete");

    // 8. Z ORDER SETUP
    this.setupZOrder();

    console.log("✅ Z-order setup complete");

    // 9. TÜM STAGE TWEEN'LERİNİ DURDUR (güvenlik için)
    createjs.Tween.removeAllTweens();

    console.log("✅ All stage tweens removed");

    console.log(
      "🎯 COMPREHENSIVE HARD RESET COMPLETE - All systems restored to initial state"
    );
    console.log(
      "   ✅ Character, Platforms, River, Shark, Shark Attack - ALL RESET!"
    );
  };
  this.setUpdObst = function (_bSet) {
    _bUpdateObst = _bSet;
  };

  this.update = function () {
    if (_bUpdate === false) {
      return;
    }

    if (_bTapping) {
      _iTappingTime += 1;
      _oCharacterManager.updateGraphics(_iTappingTime);
    }

    _oCharacterManager.update();
    if (!_oCharacterManager.onGround() && _bUpdateObst) {
      _oObstacleManager.update();
    }

    // PARALLAX GÜNCELLEMESİ - Karakterin x pozisyonuna göre arka plan katmanlarını hareket ettir
    // SADECE karakter hareket ederse parallax güncelle (performans için)
    if (_oCharacterManager && _oCharacterManager.getX) {
      var charX = _oCharacterManager.getX();
      // Parallax karakter zıplarken VEYA celebration sırasında güncellensin
      if (
        charX !== _lastParallaxX &&
        (!_oCharacterManager.onGround() ||
          _oCharacterManager.isCelebrationActive())
      ) {
        _lastParallaxX = charX;
        this.updateParallax(charX);
      }
    }

    // Nehir animasyonunu güncelle
    if (_oRiverAnimation) {
      _oRiverAnimation.update();
    }

    // Shark animasyonunu güncelle
    if (_oSharkAnimation) {
      _oSharkAnimation.update();
    }

    // Shark attack animasyonunu güncelle
    if (_oSharkAttackAnimation) {
      _oSharkAttackAnimation.update();
    }

    // CCharacter.js'deki zıplama durumu ile senkronize et
    _bJumping = !_oCharacterManager.onGround();
  };

  // PARALLAX UPDATE FONKSIYONU - Katmanlar bitince tekrar etsin
  this.updateParallax = function (charX) {
    if (!_oSky || !_oBGDecor || !_oMiddleDecor || !_oForeground) {
      return; // Katmanlar hazır değilse çık (Ground kaldırıldı)
    }

    if (!_parallaxMeta) {
      return;
    }

    // Stable, clamped offset relative to baseX to prevent drift and disappearance
    function applyParallax(meta, offset) {
      if (!meta || !meta.bmp) return;
      var speed = meta.speed || 0;
      var dx = -(offset * speed * 0.002); // slightly faster but still subtle
      var width = meta.width || CANVAS_WIDTH * 1.2;
      var base = meta.baseX || 0;

      // Clamp within one-width overflow so the layer never disappears
      var x = base + (dx % width);
      if (x < base - width) x += width;
      if (x > base + width) x -= width;
      meta.bmp.x = x;
    }

    applyParallax(_parallaxMeta.sky, charX);
    applyParallax(_parallaxMeta.bg_decor, charX);
    applyParallax(_parallaxMeta.middle_decor, charX);
    applyParallax(_parallaxMeta.foreground, charX);
  };

  // PARALLAX RESET FONKSIYONU - Katmanları başlangıç pozisyonuna döndür
  this.resetParallax = function () {
    if (_oSky && _oBGDecor && _oMiddleDecor && _oForeground) {
      // Başlangıç pozisyonlarına döndür (Ground kaldırıldı)
      var scaleX = CANVAS_WIDTH / _oSky.getBounds().width;
      var scaleY = CANVAS_HEIGHT / _oSky.getBounds().height;
      var maxScale = Math.max(scaleX, scaleY) * 1.2;

      var adjustedWidth = _oSky.getBounds().width * maxScale;
      var adjustedHeight = _oSky.getBounds().height * maxScale;
      var startX = (CANVAS_WIDTH - adjustedWidth) / 2;

      _oSky.x = startX;
      _oBGDecor.x = startX;
      _oMiddleDecor.x = startX;
      _oForeground.x = startX;
      // _oGround kaldırıldı

      _lastParallaxX = 0; // Sıfırla
    }
  };

  // Congratulations popup göster
  this.showCongratulationsPopup = function () {
    console.log("🎉 Showing congratulations popup!");

    // 7. platformun multiplier değerini hesapla (platform index 6)
    var platform7Multiplier;
    if (_sDifficulty === "hard") {
      platform7Multiplier = 34.3; // Hard mode 7. platform multiplier
    } else {
      platform7Multiplier = 7.19; // Easy mode 7. platform multiplier
    }

    // Maksimum limit uygula (100 MON kazanç limiti)
    var maxMultiplier = 100 / _fBetAmount;
    var finalMultiplier = Math.min(platform7Multiplier, maxMultiplier);

    console.log(
      "🎉 Congratulations popup - Platform 7 multiplier:",
      platform7Multiplier,
      "Final multiplier:",
      finalMultiplier,
      "Difficulty:",
      _sDifficulty,
      "Bet:",
      _fBetAmount
    );

    // Popup arka planı
    var popupBg = new createjs.Shape();
    popupBg.graphics
      .beginFill("rgba(0, 0, 0, 0.8)")
      .drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    popupBg.x = 0;
    popupBg.y = 0;
    popupBg.name = "congratulationsPopup";

    // Ana popup kutusu
    var popupBox = new createjs.Shape();
    popupBox.graphics.beginFill("#1a0b3d").drawRoundRect(0, 0, 400, 300, 20);
    popupBox.graphics
      .beginStroke("#FFD700")
      .setStrokeStyle(4)
      .drawRoundRect(0, 0, 400, 300, 20);
    popupBox.x = (CANVAS_WIDTH - 400) / 2;
    popupBox.y = (CANVAS_HEIGHT - 300) / 2;

    // Congratulations text
    var congratsText = new createjs.Text(
      "🎉 CONGRATULATIONS! 🎉",
      "bold 28px " + PRIMARY_FONT,
      "#FFD700"
    );
    congratsText.textAlign = "center";
    congratsText.textBaseline = "middle";
    congratsText.x = popupBox.x + 200;
    congratsText.y = popupBox.y + 80;
    congratsText.shadow = new createjs.Shadow("#000000", 3, 3, 6);

    // Success message
    var successText = new createjs.Text(
      "You reached the final platform!",
      "bold 18px " + PRIMARY_FONT,
      "#FFFFFF"
    );
    successText.textAlign = "center";
    successText.textBaseline = "middle";
    successText.x = popupBox.x + 200;
    successText.y = popupBox.y + 130;
    successText.shadow = new createjs.Shadow("#000000", 2, 2, 4);

    // Final multiplier text - 7. platformun multiplier değeri
    var multiplierText = new createjs.Text(
      "Final Multiplier: " + finalMultiplier.toFixed(2) + "x",
      "bold 16px " + PRIMARY_FONT,
      "#FFA500"
    );
    multiplierText.textAlign = "center";
    multiplierText.textBaseline = "middle";
    multiplierText.x = popupBox.x + 200;
    multiplierText.y = popupBox.y + 160;
    multiplierText.shadow = new createjs.Shadow("#000000", 2, 2, 4);

    // Cashout button
    var cashoutBtn = new createjs.Shape();
    cashoutBtn.graphics.beginFill("#FFD700").drawRoundRect(0, 0, 200, 50, 10);
    cashoutBtn.graphics
      .beginStroke("#FF8C00")
      .setStrokeStyle(3)
      .drawRoundRect(0, 0, 200, 50, 10);
    cashoutBtn.x = popupBox.x + 100;
    cashoutBtn.y = popupBox.y + 200;
    cashoutBtn.cursor = "pointer";

    var cashoutText = new createjs.Text(
      "CASHOUT",
      "bold 20px " + PRIMARY_FONT,
      "#000000"
    );
    cashoutText.textAlign = "center";
    cashoutText.textBaseline = "middle";
    cashoutText.x = cashoutBtn.x + 100;
    cashoutText.y = cashoutBtn.y + 25;

    // Cashout button click event
    cashoutBtn.on("click", function () {
      console.log("🎉 Cashout button clicked from congratulations popup!");
      var finalWinnings = s_oGame.getBetAmount() * finalMultiplier; // 7. platformun multiplier değerini kullan
      console.log("Final winnings:", finalWinnings.toFixed(2), "MON");

      // Cashout işlemi - 7. platformun multiplier değeri ile
      s_oGame.cashoutWithMultiplier(finalMultiplier);

      // Popup'ı kaldır
      s_oStage.removeChild(popupBg);
      s_oStage.removeChild(popupBox);
      s_oStage.removeChild(congratsText);
      s_oStage.removeChild(successText);
      s_oStage.removeChild(multiplierText);
      s_oStage.removeChild(cashoutBtn);
      s_oStage.removeChild(cashoutText);

      console.log("🎉 Congratulations popup closed, returning to bet UI");
    });

    // Hover efekti
    cashoutBtn.on("mouseover", function () {
      cashoutBtn.graphics.clear();
      cashoutBtn.graphics.beginFill("#FFA500").drawRoundRect(0, 0, 200, 50, 10);
      cashoutBtn.graphics
        .beginStroke("#FF8C00")
        .setStrokeStyle(3)
        .drawRoundRect(0, 0, 200, 50, 10);
    });

    cashoutBtn.on("mouseout", function () {
      cashoutBtn.graphics.clear();
      cashoutBtn.graphics.beginFill("#FFD700").drawRoundRect(0, 0, 200, 50, 10);
      cashoutBtn.graphics
        .beginStroke("#FF8C00")
        .setStrokeStyle(3)
        .drawRoundRect(0, 0, 200, 50, 10);
    });

    // Popup animasyonu
    popupBg.alpha = 0;
    popupBox.scaleX = popupBox.scaleY = 0.5;
    popupBox.alpha = 0;

    createjs.Tween.get(popupBg).to({ alpha: 1 }, 300);
    createjs.Tween.get(popupBox).to(
      { scaleX: 1, scaleY: 1, alpha: 1 },
      300,
      createjs.Ease.backOut
    );

    // Stage'e ekle
    s_oStage.addChild(popupBg);
    s_oStage.addChild(popupBox);
    s_oStage.addChild(congratsText);
    s_oStage.addChild(successText);
    s_oStage.addChild(multiplierText);
    s_oStage.addChild(cashoutBtn);
    s_oStage.addChild(cashoutText);
  };

  // Oyun durumu kontrolü için getter fonksiyonu
  this.isGameStarted = function () {
    return _bGameStarted;
  };

  // Oyun bitti mi kontrolü için getter fonksiyonu
  this.isGameOver = function () {
    return _bGameOver;
  };

  // Başarılı zıplama sayısını artır (public fonksiyon)
  this.incrementSuccessfulJumps = function () {
    _iSuccessfulJumps++;
    console.log("Successful jumps incremented to:", _iSuccessfulJumps);

    // Auto mode platform landing event
    if (window.autoModeManager) {
      window.dispatchEvent(
        new CustomEvent("platformLanded", {
          detail: {
            platformNumber: _iSuccessfulJumps,
            multiplier: _fCurrentMultiplier,
          },
        })
      );
    }
  };

  // Başarılı zıplama sayısını al (getter)
  this.getSuccessfulJumps = function () {
    return _iSuccessfulJumps;
  };

  // Contract jump result management
  this.setContractJumpResult = function (result) {
    _contractJumpResult = result;
    _bWaitingForJumpResult = false;
    console.log("🎯 Contract jump result set:", result);
  };

  this.getContractJumpResult = function () {
    return _contractJumpResult;
  };

  this.clearContractJumpResult = function () {
    _contractJumpResult = null;
    console.log("🧹 Contract jump result cleared");
  };

  this.isWaitingForJumpResult = function () {
    return _bWaitingForJumpResult;
  };

  this.setWaitingForJumpResult = function (waiting) {
    _bWaitingForJumpResult = waiting;
    console.log("⏳ Waiting for jump result:", waiting);
  };

  // Contract round bitme kontrolü
  this.isContractRoundEnded = function () {
    // WalletManager'dan contract round durumunu kontrol et
    if (window.walletManager && window.walletManager.isContractRoundEnded) {
      return window.walletManager.isContractRoundEnded();
    }
    return false;
  };

  // Custom recovery/resume dialog for game
  this._showRecoveryDialog = function (canResume = true, resumeReason = "") {
    return new Promise((resolve) => {
      // Create dialog overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;

      // Create dialog box
      const dialog = document.createElement("div");
      dialog.style.cssText = `
                background: linear-gradient(135deg, #1e3c72, #2a5298);
                border-radius: 15px;
                padding: 30px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                border: 2px solid #4fc3f7;
            `;

      dialog.innerHTML = `
                <div style="color: #fff; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #4fc3f7; font-size: 24px;">🎮 Active Round Found</h2>
                    <p style="margin: 0 0 10px 0; font-size: 16px; line-height: 1.4;">
                        You have an unfinished game round.
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: ${
                      canResume ? "#81c784" : "#ffb74d"
                    };">
                        ${resumeReason}
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #b3e5fc;">
                        What would you like to do?
                    </p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
                    <button id="resume-btn" style="
                        background: ${
                          canResume
                            ? "linear-gradient(135deg, #2196f3, #1976d2)"
                            : "linear-gradient(135deg, #757575, #616161)"
                        };
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: ${canResume ? "pointer" : "not-allowed"};
                        transition: all 0.3s ease;
                        min-width: 200px;
                        opacity: ${canResume ? "1" : "0.6"};
                    " ${canResume ? "" : "disabled"}>
                        🎮 RESUME GAME
                    </button>
                    
                    <button id="recover-btn" style="
                        background: linear-gradient(135deg, #ff9800, #f57c00);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 200px;
                    ">
                        💰 END ROUND & REFUND
                    </button>
                    
                    <button id="cancel-btn" style="
                        background: linear-gradient(135deg, #f44336, #d32f2f);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 150px;
                    ">
                        ❌ CANCEL
                    </button>
                </div>
                
                <div style="margin-top: 15px; font-size: 12px; color: #b3e5fc; line-height: 1.3;">
                    <strong>Resume:</strong> Continue playing your round (coming soon)<br>
                    <strong>Recover:</strong> Cash out current position (instant) OR wait 5 min for timeout<br>
                    <strong>Cancel:</strong> Go back to menu
                </div>
            `;

      // Add hover effects and event listeners
      const resumeBtn = dialog.querySelector("#resume-btn");
      const recoverBtn = dialog.querySelector("#recover-btn");
      const cancelBtn = dialog.querySelector("#cancel-btn");

      // Hover effects
      [resumeBtn, recoverBtn, cancelBtn].forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          btn.style.transform = "scale(1.05)";
          btn.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
        });

        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "scale(1)";
          btn.style.boxShadow = "none";
        });
      });

      // Event listeners
      resumeBtn.addEventListener("click", () => {
        if (canResume) {
          document.body.removeChild(overlay);
          resolve("resume");
        } else {
          // Show tooltip or ignore click if resume not possible
          console.log("⚠️ Resume not possible:", resumeReason);
        }
      });

      recoverBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
        resolve("endRound");
      });

      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
        resolve("cancel");
      });

      // Add to DOM
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  };

  // Custom notification system for game
  this._showGameNotification = function (title, message, type) {
    // Create notification
    const notification = document.createElement("div");
    const bgColor =
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#ff9800";

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            max-width: 350px;
            font-family: Arial, sans-serif;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

    notification.innerHTML = `
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                ${title}
            </div>
            <div style="font-size: 14px; line-height: 1.4;">
                ${message}
            </div>
        `;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(400px)";
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  // Contract event handlers
  this._setupContractEventHandlers = function () {
    var self = this;

    // Listen for contract round started event
    window.addEventListener("contractRoundStarted", function (event) {
      console.log("📢 Contract round started event received:", event.detail);
    });

    // Listen for contract platform jumped event
    window.addEventListener("contractPlatformJumped", function (event) {
      // Platform event'i UI tarafında da handle edilebilir (reduced logging)
    });

    // Listen for contract round ended event
    window.addEventListener("contractRoundEnded", function (event) {
      console.log("📢 Contract round ended event received:", event.detail);

      // Contract round sona erdi, UI'ı resetle
      if (event.detail.failed) {
        console.log("💀 Contract round failed - showing game over");
        // Contract'tan fail geldi, oyunu bitir
        if (s_oGame && s_oGame.gameOver) {
          s_oGame.gameOver();
        }
      } else {
        console.log(
          "🎉 Contract round ended successfully - winnings:",
          event.detail.winAmount
        );
        // Kazanç zaten cashout'ta handle ediliyor
      }
    });

    // VRF hazır olduğunda kullanıcıya bilgi ver
    window.addEventListener("vrfReady", function (event) {
      console.log("🎲 VRF is ready - players can now jump!");
      // VRF hazır olduğunda loading overlay'i kaldır
      if (s_oGame && s_oGame._hideVRFLoading) {
        s_oGame._hideVRFLoading();
      }
    });
  };

  // VRF Loading Overlay Management
  this._showVRFLoading = function () {
    console.log("🎲 Showing VRF loading overlay...");
    const overlay = document.getElementById("vrf-loading-overlay");
    if (overlay) {
      overlay.style.display = "flex";
      overlay.classList.remove("hidden");
    }
  };

  this._hideVRFLoading = function () {
    console.log("✅ Hiding VRF loading overlay...");
    const overlay = document.getElementById("vrf-loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 500); // CSS transition süresi kadar bekle
    }
  };

  // Check VRF status on game start (NOT USED - loading shown after contract round starts)
  this._checkVRFStatus = function () {
    // VRF loading artık start game'den sonra gösterilecek
    // Bu fonksiyon artık kullanılmıyor
  };

  // Check if resume is possible for active round
  this._checkResumeStatus = async function (contract, address) {
    try {
      console.log("🔍 Checking if resume is possible...");

      let roundInfo = null;
      let canResume = false;
      let reason = "";

      // Try to get round info
      try {
        roundInfo = await contract.getPlayerRoundInfo(address);
        console.log("📍 Round info:", roundInfo);
      } catch (infoError) {
        console.log("⚠️ getPlayerRoundInfo failed, trying fallback...");
        try {
          const roundId = await contract.playerActiveRound(address);
          if (
            roundId &&
            roundId !==
              "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            const roundData = await contract.rounds(roundId);
            roundInfo = {
              roundId: roundId,
              currentPlatform: roundData.currentPlatform || 0,
              entropyReady: roundData.entropyReady || false,
              lastActivity: roundData.lastActivity || 0,
            };
            console.log("📍 Fallback round info:", roundInfo);
          }
        } catch (fallbackError) {
          console.log("❌ Cannot get round info:", fallbackError.message);
          return {
            canResume: false,
            reason: "Round information not available",
          };
        }
      }

      if (!roundInfo) {
        return { canResume: false, reason: "Round not found" };
      }

      // Check timeout (5 minutes = 300 seconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastActivity = currentTime - (roundInfo.lastActivity || 0);
      if (timeSinceLastActivity > 300) {
        reason = "Round timed out (5+ minutes inactive)";
        canResume = false;
      }
      // Check VRF readiness
      else if (!roundInfo.entropyReady) {
        reason = "VRF not ready - resume possible when ready";
        canResume = true; // Still resumable, just need to wait
      }
      // Check if game is in valid state
      else if (roundInfo.currentPlatform >= 8) {
        reason = "Round already completed (celebration platform reached)";
        canResume = false;
      }
      // All good for resume
      else {
        reason = "Resume ready - continue your game";
        canResume = true;
      }

      console.log(
        `🔍 Resume check result: ${
          canResume ? "CAN RESUME" : "CANNOT RESUME"
        } - ${reason}`
      );

      return {
        canResume: canResume,
        reason: reason,
        roundInfo: roundInfo,
      };
    } catch (error) {
      console.error("❌ Resume status check failed:", error);
      return {
        canResume: false,
        reason: "Error checking round status: " + error.message,
      };
    }
  };

  // Submit game result to leaderboard server
  this._submitToLeaderboard = function (gameData) {
    console.log("📊 DEBUG - About to submit to leaderboard:");
    console.log(
      "📊 DEBUG - gameData object:",
      JSON.stringify(gameData, null, 2)
    );

    try {
      // Force use window.s_oLeaderboardManager to avoid scope issues
      var leaderboardManager = window.s_oLeaderboardManager;

      console.log(
        "📊 DEBUG - window.s_oLeaderboardManager exists:",
        typeof leaderboardManager
      );
      console.log("📊 DEBUG - leaderboardManager object:", leaderboardManager);

      if (
        leaderboardManager &&
        typeof leaderboardManager.submitGameResult === "function"
      ) {
        console.log("📊 Submitting game result to leaderboard:", gameData);
        console.log("📊 WINNINGS VALUE IN GAMEDATA:", gameData.winnings);

        leaderboardManager
          .submitGameResult(gameData)
          .then(function (result) {
            console.log(
              "✅ Game result submitted to leaderboard successfully:",
              result
            );
            console.log("✅ RESULT DATA:", JSON.stringify(result, null, 2));
          })
          .catch(function (error) {
            console.error(
              "❌ Failed to submit game result to leaderboard:",
              error
            );
            console.error("❌ ERROR DETAILS:", error.message);
            console.error("❌ ERROR STACK:", error.stack);
            // Don't show error to user, just log it
          });
      } else {
        console.log(
          "⚠️ Leaderboard manager not available, skipping submission"
        );
        console.log("⚠️ DEBUG - leaderboardManager:", leaderboardManager);
        console.log(
          "⚠️ DEBUG - submitGameResult method:",
          typeof (leaderboardManager && leaderboardManager.submitGameResult)
        );
        console.log(
          "⚠️ DEBUG - Available methods:",
          leaderboardManager ? Object.keys(leaderboardManager) : "null"
        );
      }
    } catch (error) {
      console.error("❌ Error in _submitToLeaderboard:", error);
      console.error("❌ Error stack:", error.stack);
    }
  };

  s_oGame = this;
  this._init();

  // Setup contract event handlers after initialization
  var self = this;
  setTimeout(function () {
    self._setupContractEventHandlers();
    // VRF loading artık start game'den sonra gösterilecek
  }, 100);
}
function showCashoutNotification(winnings) {
  console.log("Showing cashout notification:", winnings, "MON");

  // Prevent multiple notifications
  if (window._bNotificationShowing) {
    console.log("Notification already showing, skipping...");
    return;
  }
  window._bNotificationShowing = true;

  // Create notification background (gambling theme - purple gradient)
  var notificationBg = new createjs.Shape();
  notificationBg.graphics
    .beginLinearGradientFill(
      ["#4A0E4E", "#2D1B69", "#1A0B3D"],
      [0, 0.5, 1],
      0,
      0,
      0,
      400
    )
    .drawRoundRect(0, 0, 500, 300, 20);
  notificationBg.x = (CANVAS_WIDTH - 500) / 2;
  notificationBg.y = (CANVAS_HEIGHT - 300) / 2;
  notificationBg.alpha = 0;

  // Add golden border
  var notificationBorder = new createjs.Shape();
  notificationBorder.graphics
    .beginStroke("#FFD700")
    .setStrokeStyle(4)
    .drawRoundRect(0, 0, 500, 300, 20);
  notificationBorder.x = (CANVAS_WIDTH - 500) / 2;
  notificationBorder.y = (CANVAS_HEIGHT - 300) / 2;
  notificationBorder.alpha = 0;

  // Title text
  var titleText = "💰 CASHOUT SUCCESS! 💰";
  var oTitleText = new createjs.Text(
    titleText,
    "bold 32px " + PRIMARY_FONT,
    "#FFD700"
  );
  oTitleText.textAlign = "center";
  oTitleText.textBaseline = "middle";
  oTitleText.x = CANVAS_WIDTH / 2;
  oTitleText.y = CANVAS_HEIGHT / 2 - 80;
  oTitleText.alpha = 0;
  oTitleText.shadow = new createjs.Shadow("#000000", 3, 3, 5);

  // Winnings amount text
  var oWinningsText = new createjs.Text(
    winnings.toFixed(2) + " MON",
    "bold 48px " + PRIMARY_FONT,
    "#00FF00"
  );
  oWinningsText.textAlign = "center";
  oWinningsText.textBaseline = "middle";
  oWinningsText.x = CANVAS_WIDTH / 2;
  oWinningsText.y = CANVAS_HEIGHT / 2;
  oWinningsText.alpha = 0;
  oWinningsText.shadow = new createjs.Shadow("#000000", 4, 4, 8);

  // Success message
  var successMsg = "Well played!";
  var oSuccessText = new createjs.Text(
    successMsg,
    "bold 24px " + PRIMARY_FONT,
    "#FFFFFF"
  );
  oSuccessText.textAlign = "center";
  oSuccessText.textBaseline = "middle";
  oSuccessText.x = CANVAS_WIDTH / 2;
  oSuccessText.y = CANVAS_HEIGHT / 2 + 60;
  oSuccessText.alpha = 0;
  oSuccessText.shadow = new createjs.Shadow("#000000", 2, 2, 4);

  // Add elements to stage
  s_oStage.addChild(notificationBg);
  s_oStage.addChild(notificationBorder);
  s_oStage.addChild(oTitleText);
  s_oStage.addChild(oWinningsText);
  s_oStage.addChild(oSuccessText);

  // Animate notification appearance
  createjs.Tween.get(notificationBg)
    .to({ alpha: 0.95, scaleX: 1.1, scaleY: 1.1 }, 300, createjs.Ease.backOut)
    .to({ scaleX: 1, scaleY: 1 }, 200, createjs.Ease.elasticOut);

  createjs.Tween.get(notificationBorder)
    .to({ alpha: 1, scaleX: 1.1, scaleY: 1.1 }, 300, createjs.Ease.backOut)
    .to({ scaleX: 1, scaleY: 1 }, 200, createjs.Ease.elasticOut);

  createjs.Tween.get(oTitleText)
    .wait(200)
    .to({ alpha: 1, y: oTitleText.y - 10 }, 400, createjs.Ease.bounceOut);

  createjs.Tween.get(oWinningsText)
    .wait(400)
    .to({ alpha: 1, scaleX: 1.2, scaleY: 1.2 }, 300, createjs.Ease.backOut)
    .to({ scaleX: 1, scaleY: 1 }, 200, createjs.Ease.elasticOut);

  createjs.Tween.get(oSuccessText)
    .wait(600)
    .to({ alpha: 1 }, 300, createjs.Ease.quadOut);

  // Auto-remove notification after 2.5 seconds
  setTimeout(function () {
    // Fade out animation
    createjs.Tween.get(notificationBg).to(
      { alpha: 0, scaleX: 0.8, scaleY: 0.8 },
      400,
      createjs.Ease.backIn
    );
    createjs.Tween.get(notificationBorder).to(
      { alpha: 0, scaleX: 0.8, scaleY: 0.8 },
      400,
      createjs.Ease.backIn
    );
    createjs.Tween.get(oTitleText).to(
      { alpha: 0, y: oTitleText.y - 20 },
      400,
      createjs.Ease.backIn
    );
    createjs.Tween.get(oWinningsText).to(
      { alpha: 0, scaleX: 0.5, scaleY: 0.5 },
      400,
      createjs.Ease.backIn
    );
    createjs.Tween.get(oSuccessText).to(
      { alpha: 0 },
      400,
      createjs.Ease.backIn
    );

    // Remove from stage after animation
    setTimeout(function () {
      s_oStage.removeChild(notificationBg);
      s_oStage.removeChild(notificationBorder);
      s_oStage.removeChild(oTitleText);
      s_oStage.removeChild(oWinningsText);
      s_oStage.removeChild(oSuccessText);
      window._bNotificationShowing = false; // Reset notification flag
    }, 500);
  }, 2500);

  // Play success sound - safe check
  try {
    if (typeof playSound === "function") {
      playSound("click", 1, false); // Use existing click sound instead of missing win sound
    }
  } catch (e) {
    console.log("Sound play failed:", e);
  }
}

var s_oGame;

// Duplicate fonksiyonlar silindi - yukarıda zaten var

// Parallax fonksiyonu artık ana update fonksiyonu içinde çağrılıyor
