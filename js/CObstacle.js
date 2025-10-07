function CObstacle(oSprite, iCharW, iCharH) {
    var _iMinHeight;
    var _iMaxHeight;
    var _iMinDistance;
    var _iMaxDistance;
    var _iHalfWidth;
    var _iLastObjIndex;
    var _iLastObjPassedByHero;
    var _iCont;
    var _aObstacles;
    var _oSprite;
    var _iSpeed;
    var _iCharW;
    var _iCharH;
    var _iMoltiplier;
    var _aMultiplierTexts; // Multiplier text'leri için array
   
   

    this._init = function (oSprite, iCharW, iCharH) {
        _iCont = 0;
        _iMoltiplier = 1;
        _oSprite = oSprite;
        _iCharW = iCharW;
        _iCharH = iCharH;
        _iSpeed = -8.0; // Çok daha hızlı hareket
        // Chog Cross Gambling için sabit yükseklik
        _iMinHeight = 0;
        _iMaxHeight = 0;
        // Platform mesafelerini ayarla (ekranda 3 platform görünecek şekilde)
        // Ekranı 3 eşit parçaya böl
        _iMinDistance = Math.floor(CANVAS_WIDTH / 3); // Her platform için eşit alan
        _iMaxDistance = _iMinDistance;
        _iHalfWidth = oSprite.width / 2;
        // Platform sprite sheet boyutlarını kullan
        var imgWidth = _oSprite.width;
        var imgHeight = _oSprite.height;
        var frameWidth = Math.floor(imgWidth / 3);
        var frameHeight = Math.floor(imgHeight / 3);
        OBST_HEIGHT = frameHeight; // Platform frame yüksekliği
        OBST_WIDTH = frameWidth; // Platform frame genişliği
        
        console.log("Platform dimensions - OBST_WIDTH:", OBST_WIDTH, "OBST_HEIGHT:", OBST_HEIGHT);
        _aMultiplierTexts = new Array();
        
        console.log("Obstacle settings - Width:", oSprite.width, "Distance:", _iMinDistance, "Jump Power:", JUMP_POWER); // Debug
        this._initLevel();
    };

    this._initLevel = function () {
        var iXPos = STARTX;
        var iYPos = STARTY;
        _aObstacles = new Array();
        _aMultiplierTexts = new Array();
        
        // TEK BİR SPRITE SHEET OLUŞTUR (performans için)
        var platformSpriteSheet = new createjs.SpriteSheet({
            images: [_oSprite],
            frames: [
                // 3x3 grid için frame tanımları (platform.png - 1536x1536)
                [0, 0, 512, 512, 0, 256, 256],       // Frame 0
                [512, 0, 512, 512, 0, 256, 256],     // Frame 1
                [1024, 0, 512, 512, 0, 256, 256],    // Frame 2
                [0, 512, 512, 512, 0, 256, 256],     // Frame 3
                [512, 512, 512, 512, 0, 256, 256],   // Frame 4
                [1024, 512, 512, 512, 0, 256, 256],  // Frame 5
                [0, 1024, 512, 512, 0, 256, 256],    // Frame 6
                [512, 1024, 512, 512, 0, 256, 256],  // Frame 7
                [1024, 1024, 512, 512, 0, 256, 256]  // Frame 8
            ],
            animations: {
                idle: 0,
                animate: {
                    frames: [0, 5],
                    next: "idle",
                    speed: 0.15
                }
            }
        });
        
        // Get platform configuration
        const platformConfig = window.gameConfig ? window.gameConfig.getPlatform() : {
            count: 7,
            spacing: 250,
            startX: 400,
            y: PLATFORM_Y,
            scale: 1.2
        };
        
        // Create platforms using configuration
        for (var i = 0; i < platformConfig.count; i++) {
            var oObstacle = new createjs.Sprite(platformSpriteSheet, "idle");
            // Platform konumlandırma - configuration'dan al
            oObstacle.x = platformConfig.startX + (i * platformConfig.spacing);
            oObstacle.y = platformConfig.y;
            oObstacle.obstacleIndex = i + 1; // Platform numarası (1, 2, 3, ..., 7)
            oObstacle.scaleX = platformConfig.scale; // Platform genişliği (configurable)
            oObstacle.scaleY = platformConfig.scale; // Platform yüksekliği (configurable)
            
            // Sprite sheet referansını sakla
            oObstacle.platformSpriteSheet = platformSpriteSheet;

            s_oStage.addChild(oObstacle);
            
            // Get multiplier values from configuration
            const multiplierConfig = window.gameConfig ? window.gameConfig.getMultipliers() : {
                easy: [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19]
            };
            var iMultiplierValue = multiplierConfig.easy[i]; // Easy mode değerleri (configurable)
            
            // Arka plan şekli (sarı dolu oval çerçeve - daha büyük ve belirgin)
            var oMultiplierBg = new createjs.Shape();
            oMultiplierBg.graphics.beginFill("#FFD700").drawEllipse(-35, -18, 70, 36); // Sarı dolu oval
            oMultiplierBg.graphics.beginStroke("#FF8C00").setStrokeStyle(4).drawEllipse(-35, -18, 70, 36); // Turuncu kalın kenarlık
            oMultiplierBg.x = oObstacle.x;
            oMultiplierBg.y = PLATFORM_Y - 60; // Responsive pozisyon (daha da yukarı)
            
            // Multiplier text'i - daha büyük ve okunabilir
            var oMultiplierText = new createjs.Text(iMultiplierValue.toFixed(1) + "x", "bold 20px " + PRIMARY_FONT, "#000000");
            oMultiplierText.textAlign = "center";
            oMultiplierText.textBaseline = "middle";
            oMultiplierText.x = oObstacle.x;
            oMultiplierText.y = PLATFORM_Y - 60; // Responsive pozisyon (daha da yukarı)
            oMultiplierText.shadow = new createjs.Shadow("#FFFFFF", 2, 2, 2);
            
            // Hem arka plan hem de text'i array'e ekle
            _aMultiplierTexts.push({bg: oMultiplierBg, text: oMultiplierText});
            
            console.log("Platform", i + 1, "multiplier bg created at X:", oMultiplierBg.x, "Y:", oMultiplierBg.y, "Value:", iMultiplierValue.toFixed(1) + "x");
            
            _aObstacles.push(oObstacle);
        }

        // 8. platform - firstplatform.webp'in kopyası (7. platformdan sonra) - KUTLAMA PLATFORMU
        var oFirstPlatformCopy = createBitmap(s_oSpriteLibrary.getSprite("first_platform"));
        // Get celebration platform configuration
        const celebrationConfig = window.gameConfig ? window.gameConfig.get('platform.celebrationPlatform') : {
            scale: 1.0,
            offsetY: 210
        };
        
        oFirstPlatformCopy.x = platformConfig.startX + (7 * platformConfig.spacing); // Configuration-based position
        oFirstPlatformCopy.y = FIRST_PLATFORM_Y; // firstplatform ile aynı Y konumu (yükseklik)
        oFirstPlatformCopy.obstacleIndex = 8; // Platform numarası 8
        oFirstPlatformCopy.regX = oFirstPlatformCopy.getBounds().width / 2;
        oFirstPlatformCopy.regY = oFirstPlatformCopy.getBounds().height / 2;
        oFirstPlatformCopy.scaleX = celebrationConfig.scale; // Configuration-based scale
        oFirstPlatformCopy.scaleY = celebrationConfig.scale; // Configuration-based scale
        oFirstPlatformCopy.alpha = 1.0; // Tam görünür
        oFirstPlatformCopy.isCelebrationPlatform = true; // Kutlama platformu işareti
        
        // Kutlama platformu için özel efekt - hafif parıltı
        oFirstPlatformCopy.filters = [
            new createjs.ColorFilter(1.2, 1.2, 1.2, 1) // Hafif parlaklık artışı
        ];
        oFirstPlatformCopy.cache(0, 0, oFirstPlatformCopy.getBounds().width, oFirstPlatformCopy.getBounds().height);
        
        s_oStage.addChild(oFirstPlatformCopy);
        
        // 8. platform için multiplier YOK - kutlama platformu
        console.log("Platform 8 (celebration platform) created at X:", oFirstPlatformCopy.x, "Y:", oFirstPlatformCopy.y, "Same height as firstplatform - No multiplier");
        
        _aObstacles.push(oFirstPlatformCopy);

        _iLastObjIndex = 7; // Son platform indexi (0-7)
        _iLastObjPassedByHero = -1;
        
        // Multiplier yazılarını oyun başladığında göstereceğiz - şimdi ekleme
    };
    
    // Multiplier yazılarını stage'e ekle (en üst katmana)
    this.addMultiplierTextsToStage = function() {
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i] && _aMultiplierTexts[i].bg && _aMultiplierTexts[i].text) {
                s_oStage.addChild(_aMultiplierTexts[i].bg);
                s_oStage.addChild(_aMultiplierTexts[i].text);
                console.log("Multiplier text", i + 1, "added to stage");
            }
        }
    };
    
    // Multiplier yazılarını stage'den kaldır
    this.removeMultiplierTextsFromStage = function() {
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i] && _aMultiplierTexts[i].bg && _aMultiplierTexts[i].text) {
                if (_aMultiplierTexts[i].bg.parent) {
                    s_oStage.removeChild(_aMultiplierTexts[i].bg);
                }
                if (_aMultiplierTexts[i].text.parent) {
                    s_oStage.removeChild(_aMultiplierTexts[i].text);
                }
                console.log("Multiplier text", i + 1, "removed from stage");
            }
        }
    };
    
    // Platform animasyonunu başlat
    this.animatePlatform = function(platformIndex, onAnimationComplete) {
        console.log("🔍 animatePlatform called with index:", platformIndex);
        
        // Oyun durumu kontrolü - sadece aktif oyun sırasında animasyon çalıştır
        if (!s_oGame || !s_oGame.isGameStarted || !s_oGame.isGameStarted()) {
            console.log("❌ Game not started - blocking platform animation");
            return;
        }
        
        console.log("🔍 Total platforms:", _aObstacles.length);
        
        if (platformIndex >= 0 && platformIndex < _aObstacles.length) {
            var platform = _aObstacles[platformIndex];
            console.log("🔍 Platform found:", platform);
            console.log("🔍 Platform X:", platform.x, "Y:", platform.y);
            console.log("🔍 Has gotoAndPlay:", !!platform.gotoAndPlay);
            console.log("🔍 Current animation:", platform.currentAnimation);
            console.log("🔍 Current frame:", platform.currentFrame);
            
            if (platform && platform.gotoAndPlay) {
                // Animasyonu başlat - sadece idle durumundaysa
                if (platform.currentAnimation === "idle" || !platform.currentAnimation) {
                    console.log("✅ Starting platform animation");
                    platform.gotoAndPlay("animate");
                    console.log("✅ Platform animation started, current animation:", platform.currentAnimation);
                    
                    // Platform animasyonu bittiğinde callback çağır
                    if (onAnimationComplete) {
                        // Platform animasyonu yaklaşık 1 saniye sürer (speed: 0.15, 2 frame)
                        setTimeout(function() {
                            console.log("🎬 Platform animation completed, calling callback");
                            onAnimationComplete();
                        }, 1000); // 1 saniye sonra callback çağır
                    }
                } else {
                    console.log("⚠️ Platform animation already running:", platform.currentAnimation);
                    // Animasyon zaten çalışıyorsa callback'i hemen çağır
                    if (onAnimationComplete) {
                        onAnimationComplete();
                    }
                }
            } else {
                console.log("❌ Platform not found or no gotoAndPlay method");
                // Platform bulunamazsa callback'i hemen çağır
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            }
        } else {
            console.log("❌ Invalid platform index:", platformIndex);
            // Geçersiz index'te callback'i hemen çağır
            if (onAnimationComplete) {
                onAnimationComplete();
            }
        }
    };
    
    // Karakter hangi platform'da olduğunu bul
    this.getPlatformIndexAtPosition = function(characterX) {
        for (var i = 0; i < _aObstacles.length; i++) {
            var platform = _aObstacles[i];
            var platformLeft = platform.x - (256 * 1.2); // Platform genişliğinin yarısı * scale (1.2)
            var platformRight = platform.x + (256 * 1.2);
            
            if (characterX >= platformLeft && characterX <= platformRight) {
                return i;
            }
        }
        return -1; // Platform bulunamadı
    };
    this.getArray = function ()
    {
        return _aObstacles;
    };
    
    this.setMoltiplier = function (iSetValue) 
    {
        _iMoltiplier = iSetValue;
    };

    this.getNextXPos = function () 
    {
        return _iSpeed * _iMoltiplier;
    };
    this.update = function () {
        // Platformlar SABİT KALACAK - hareket etmez
    };
    
    // Multiplier text'lerini kaydır (kamera takip sistemi için)
    this.moveMultipliersLeft = function(offset) {
        console.log("Moving multipliers left by:", offset);
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i]) {
                // Arka plan şeklini kaydır
                if (_aMultiplierTexts[i].bg) {
                    createjs.Tween.get(_aMultiplierTexts[i].bg).to({
                        x: _aMultiplierTexts[i].bg.x + offset
                    }, 300, createjs.Ease.quadOut);
                }
                
                // Text'i kaydır
                if (_aMultiplierTexts[i].text) {
                    createjs.Tween.get(_aMultiplierTexts[i].text).to({
                        x: _aMultiplierTexts[i].text.x + offset
                    }, 300, createjs.Ease.quadOut);
                }
            }
        }
    };
    
    // Multiplier değerlerini bet amount ve difficulty'ye göre güncelle
    this.updateMultipliers = function(fBetAmount, sDifficulty) {
        console.log("Updating platform multipliers for bet:", fBetAmount, "difficulty:", sDifficulty);
        
        // Yeni multiplier değerleri
        var easyMultipliers = [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19];
        var hardMultipliers = [1.60, 2.67, 4.44, 7.41, 12.35, 20.58, 34.30];
        
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i] && _aMultiplierTexts[i].text) {
                // Platform index kontrolü (0-6 arasında olmalı)
                if (i < 0 || i > 6) {
                    console.error("Invalid platform index in updateMultipliers:", i, "Expected 0-6");
                    continue;
                }
                
                // Difficulty'ye göre multiplier seç
                var platformMultiplier = (sDifficulty === "hard") ? hardMultipliers[i] : easyMultipliers[i];
                
                // Maksimum limit uygula (100 MON kazanç limiti)
                var maxMultiplier = 100 / fBetAmount;
                platformMultiplier = Math.min(platformMultiplier, maxMultiplier);
                
                // Text'i güncelle
                _aMultiplierTexts[i].text.text = platformMultiplier.toFixed(2) + "x";
                
                console.log("Platform", i + 1, "multiplier:", platformMultiplier.toFixed(2) + "x");
            }
        }
    };
    
    // Reset all platforms to their initial positions and states
    this.clearAll = function() {
        console.log("Clearing all platforms and multiplier texts...");
        
        // Tüm platformları stage'den kaldır
        for (var i = 0; i < _aObstacles.length; i++) {
            if (_aObstacles[i]) {
                createjs.Tween.removeTweens(_aObstacles[i]);
                s_oStage.removeChild(_aObstacles[i]);
            }
        }
        
        // Tüm multiplier text'leri stage'den kaldır
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i] && _aMultiplierTexts[i].bg) {
                s_oStage.removeChild(_aMultiplierTexts[i].bg);
            }
            if (_aMultiplierTexts[i] && _aMultiplierTexts[i].text) {
                s_oStage.removeChild(_aMultiplierTexts[i].text);
            }
        }
        
        // Array'leri temizle
        _aObstacles = new Array();
        _aMultiplierTexts = new Array();
    };
    
    this.initLevel = function() {
        this._initLevel();
    };
    
    this.reset = function() {
        console.log("Resetting all platforms to initial positions");
        
        // Stop all tweens on platforms and multiplier texts
        for (var i = 0; i < _aObstacles.length; i++) {
            if (_aObstacles[i]) {
                createjs.Tween.removeTweens(_aObstacles[i]);
                
                // Reset platform position to EXACT initial position
                if (i < 7) {
                    // Normal platforms (0-6)
                    _aObstacles[i].x = 400 + (i * 250); // İlk platform x=400, sonrakiler 250px aralıklarla
                    _aObstacles[i].y = PLATFORM_Y; // SABİT pozisyon - PLATFORM_Y kullan
                } else {
                    // Celebration platform (index 7)
                    _aObstacles[i].x = 400 + (7 * 250); // x=2150
                    _aObstacles[i].y = FIRST_PLATFORM_Y; // SABİT pozisyon - FIRST_PLATFORM_Y kullan
                }
                
                // Reset animation to idle
                if (_aObstacles[i].gotoAndStop) {
                    _aObstacles[i].gotoAndStop("idle");
                }
                
                console.log("Platform", i, "reset to X:", _aObstacles[i].x, "Y:", _aObstacles[i].y);
            }
        }
        
        // Reset multiplier texts positions
        for (var i = 0; i < _aMultiplierTexts.length; i++) {
            if (_aMultiplierTexts[i]) {
                // Reset background position to EXACT initial position
                if (_aMultiplierTexts[i].bg) {
                    createjs.Tween.removeTweens(_aMultiplierTexts[i].bg);
                    _aMultiplierTexts[i].bg.x = 400 + (i * 250); // Platform pozisyonuyla aynı
                    _aMultiplierTexts[i].bg.y = PLATFORM_Y - 60; // SABİT pozisyon - PLATFORM_Y kullan
                }
                
                // Reset text position to EXACT initial position
                if (_aMultiplierTexts[i].text) {
                    createjs.Tween.removeTweens(_aMultiplierTexts[i].text);
                    _aMultiplierTexts[i].text.x = 400 + (i * 250); // Platform pozisyonuyla aynı
                    _aMultiplierTexts[i].text.y = PLATFORM_Y - 60; // SABİT pozisyon - PLATFORM_Y kullan
                }
                
                console.log("Multiplier", i, "reset to X:", 400 + (i * 250), "Y:", PLATFORM_Y - 60);
            }
        }
        
        // Reset internal state
        _iLastObjPassedByHero = -1;
        
        console.log("Platform reset complete - all platforms returned to EXACT starting positions");
    };

    this._init(oSprite, iCharW, iCharH);
}
