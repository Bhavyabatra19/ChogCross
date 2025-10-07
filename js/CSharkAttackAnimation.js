function CSharkAttackAnimation() {
    var _oContainer;
    var _oSprite;
    var _bIsActive = false;
    var _iCurrentFrame = 0;
    var _iFrameCounter = 0;
    var _iFrameDuration = 3; // Her 3 frame'de bir değiş (hızlı attack)
    var _iAttackDuration = 30; // 10 frame * 3 = 30 frame (0-9 frameleri kullanılıyor)
    var _iAttackCounter = 0;
    
    this._init = function() {
        // Container oluştur
        _oContainer = new createjs.Container();
        _oContainer.x = 0;
        _oContainer.y = 0;
        _oContainer.alpha = 0; // Başlangıçta görünmez
        
        // Shark attack spritesheet'ini al
        var sharkAttackSpritesheet = s_oSpriteLibrary.getSprite("sharkattack");
        
        if (!sharkAttackSpritesheet) {
            console.error("Shark attack spritesheet not found!");
            return;
        }
        
        console.log("Shark attack spritesheet loaded - Size:", sharkAttackSpritesheet.width, "x", sharkAttackSpritesheet.height);
        
        // SpriteSheet oluştur - YENİ FORMAT: 3x3 grid, 2208x2208, 9 frame
        var frameWidth = Math.floor(sharkAttackSpritesheet.width / 3); // 2208 / 3 = 736
        var frameHeight = Math.floor(sharkAttackSpritesheet.height / 3); // 2208 / 3 = 736
        
        var spriteSheet = new createjs.SpriteSheet({
            images: [sharkAttackSpritesheet],
            frames: [
                // 3x3 grid - 9 frame (0-8), frame 3 atlanacak
                [0, 0, frameWidth, frameHeight, 0, 0, 0],                    // Frame 0 (0,0)
                [frameWidth, 0, frameWidth, frameHeight, 0, 0, 1],           // Frame 1 (1,0)
                [frameWidth * 2, 0, frameWidth, frameHeight, 0, 0, 2],       // Frame 2 (2,0)
                [0, frameHeight, frameWidth, frameHeight, 0, 0, 3],          // Frame 3 (0,1) - ATLANACAK
                [frameWidth, frameHeight, frameWidth, frameHeight, 0, 0, 4], // Frame 4 (1,1)
                [frameWidth * 2, frameHeight, frameWidth, frameHeight, 0, 0, 5], // Frame 5 (2,1)
                [0, frameHeight * 2, frameWidth, frameHeight, 0, 0, 6],      // Frame 6 (0,2)
                [frameWidth, frameHeight * 2, frameWidth, frameHeight, 0, 0, 7], // Frame 7 (1,2)
                [frameWidth * 2, frameHeight * 2, frameWidth, frameHeight, 0, 0, 8] // Frame 8 (2,2)
            ]
        });
        
        // Sprite oluştur
        _oSprite = new createjs.Sprite(spriteSheet);
        _oSprite.gotoAndStop(0);
        
        // Original scale restored
        var scaleX = 1.25; // Original scale
        var scaleY = 1.25; // Original scale
        
        _oSprite.scaleX = scaleX;
        _oSprite.scaleY = scaleY;
        
        // Pixel perfect rendering için
        _oSprite.snapToPixel = true;
        _oSprite.pixelSnap = true;
        
        // Sprite pozisyonu başlangıçta merkez (startAttack'ta güncellenecek)
        _oSprite.x = CANVAS_WIDTH / 2;
        _oSprite.y = PLATFORM_Y - 50; // Platformların biraz altında
        
        // Sprite'in merkez noktasını ayarla
        _oSprite.regX = frameWidth / 2;
        _oSprite.regY = frameHeight / 2;
        
        // Sprite'i container'a ekle
        _oContainer.addChild(_oSprite);
        
        // Container'ı stage'e ekle (en üstte)
        s_oStage.addChild(_oContainer);
        
        console.log("Shark attack animation initialized - Original Scale: 1.25 x 1.25, NEW FORMAT: 3x3 grid, 9 frames, using frames: 0,1,2,4,5,6,7,8");
    };
    
    this.startAttack = function() {
        if (_bIsActive) return; // Zaten aktifse başlatma
        
        console.log("Shark attack started! (8 frame kullanılacak: 0,1,2,4,5,6,7,8 - frame 3 atlanıyor)");
        _bIsActive = true;
        _iCurrentFrame = 0;
        _iFrameCounter = 0;
        _iAttackCounter = 0;
        
        // Container'ı görünür yap
        _oContainer.alpha = 1.0;
        
        // İlk frame'i göster (frame 0'dan başla)
        _oSprite.gotoAndStop(0);
        
        // Karakteri gizle (attack sırasında gözükmesin)
        if (s_oGame && s_oGame.hideCharacter) {
            s_oGame.hideCharacter();
        }
        
        // Shark attack pozisyonunu karakterin bulunduğu platformda göster
        this.updateSharkPosition();
    };
    
    this.update = function() {
        if (!_bIsActive) return;
        
        // Shark pozisyonunu sürekli güncelle (karakter hareket ediyorsa)
        this.updateSharkPosition();
        
        // Frame counter'ı artır
        _iFrameCounter++;
        if (_iFrameCounter >= _iFrameDuration) {
            _iFrameCounter = 0;
            _iCurrentFrame++;
            
            // Frame'i güncelle - YENİ SIRALAMA: [0,1,2,4,5,6,7,8] (frame 3 atlanıyor)
            if (_iCurrentFrame < 8) {
                // Frame dizisi: [0, 1, 2, 4, 5, 6, 7, 8] - frame 3 atlanıyor
                var frameSequence = [0, 1, 2, 4, 5, 6, 7, 8];
                var frameToShow = frameSequence[_iCurrentFrame];
                _oSprite.gotoAndStop(frameToShow);
                
                // Original scaling restored
                var baseScale = 1.25; // Original base scale
                var finalScale = 1.25; // Original final scale (no scaling change)
                
                if (frameToShow >= 6 && frameToShow <= 8) {
                    // Final frames - gradually increase scale
                    var progress = (frameToShow - 6) / 2; // 0 to 1
                    var currentScale = baseScale + (finalScale - baseScale) * progress;
                    
                    _oSprite.alpha = 1.0;
                    _oSprite.scaleX = currentScale;
                    _oSprite.scaleY = currentScale;
                } else {
                    // Initial frames - base scale
                    _oSprite.alpha = 1.0;
                    _oSprite.scaleX = baseScale;
                    _oSprite.scaleY = baseScale;
                }
                
                console.log("Shark attack frame:", frameToShow, "Sequence index:", _iCurrentFrame);
            }
        }
        
        // Attack counter'ı artır
        _iAttackCounter++;
        if (_iAttackCounter >= _iAttackDuration) {
            // Attack tamamlandı
            this.endAttack();
        }
    };
    
    this.updateSharkPosition = function() {
        // Karakterin pozisyonunu al
        if (s_oGame && s_oGame.getCharacterManager) {
            var characterManager = s_oGame.getCharacterManager();
            if (characterManager) {
                var characterX = characterManager.getX();
                var characterY = characterManager.getY();
                
                console.log("Updating shark position to character location - X:", characterX, "Y:", characterY);
                
                // Shark'ı karakterin bulunduğu platformda göster (40px daha sola kaydırıldı)
                _oSprite.x = characterX - 175; // Karakterin 175px solunda başla (155+20=175)
                _oSprite.y = characterY + 30; // Karakterin biraz altında
                
                console.log("Shark positioned at X:", _oSprite.x, "Y:", _oSprite.y);
            }
        }
    };
    
    this.endAttack = function() {
        console.log("Shark attack ended! Showing game over screen...");
        _bIsActive = false;
        _oContainer.alpha = 0; // Gizle
        _oSprite.gotoAndStop(0); // İlk frame'e dön (frame 0)
        
        // Karakteri gösterme - sadece Play Again'de gösterilecek
        // if (s_oGame && s_oGame.showCharacter) {
        //     s_oGame.showCharacter();
        // }
        
        // Animasyon bittikten sonra game over ekranını göster
        if (s_oGame && s_oGame.showGameOverScreen) {
            s_oGame.showGameOverScreen();
        }
    };
    
    this.hideCharacter = function() {
        // Karakteri gizle
        if (s_oGame && s_oGame.getCharacterManager) {
            var characterManager = s_oGame.getCharacterManager();
            if (characterManager && characterManager.getSprite) {
                var characterSprite = characterManager.getSprite();
                if (characterSprite) {
                    characterSprite.alpha = 0; // Karakteri gizle
                    console.log("Character hidden during shark attack - Alpha set to 0");
                } else {
                    console.log("Character sprite not found!");
                }
            } else {
                console.log("Character manager or getSprite function not found!");
            }
        } else {
            console.log("Game instance or getCharacterManager function not found!");
        }
    };
    
    this.showCharacter = function() {
        // Karakteri tekrar göster
        if (s_oGame && s_oGame.getCharacterManager) {
            var characterManager = s_oGame.getCharacterManager();
            if (characterManager && characterManager.getSprite) {
                var characterSprite = characterManager.getSprite();
                if (characterSprite) {
                    characterSprite.alpha = 1.0; // Karakteri göster
                    console.log("Character shown after shark attack - Alpha set to 1.0");
                } else {
                    console.log("Character sprite not found!");
                }
            } else {
                console.log("Character manager or getSprite function not found!");
            }
        } else {
            console.log("Game instance or getCharacterManager function not found!");
        }
    };
    
    this.isActive = function() {
        return _bIsActive;
    };
    
    // Reset function - animasyonu başlangıç durumuna döndür
    this.reset = function() {
        console.log("🦈💥 Resetting shark attack animation to initial state...");
        
        // Attack state'ini sıfırla
        _bIsActive = false;
        _iCurrentFrame = 0;
        _iFrameCounter = 0;
        _iAttackCounter = 0;
        
        // Container'ı gizle
        if (_oContainer) {
            _oContainer.alpha = 0;
        }
        
        // Sprite'i ilk frame'e döndür ve resetle
        if (_oSprite) {
            _oSprite.gotoAndStop(0);
            _oSprite.scaleX = 1.25; // Original scale restored
            _oSprite.scaleY = 1.25; // Original scale restored
            _oSprite.alpha = 1.0;
            
            // Pozisyonu merkeze resetle
            _oSprite.x = CANVAS_WIDTH / 2;
            _oSprite.y = PLATFORM_Y - 50;
        }
        
        console.log("✅ Shark attack animation reset complete");
    };
    
    // Container referansını döndür (Z-order için)
    this.getContainer = function() {
        return _oContainer;
    };
    
    this.unload = function() {
        if (_oContainer && s_oStage.contains(_oContainer)) {
            s_oStage.removeChild(_oContainer);
        }
    };
    
    this._init();
}
