function CSharkAnimation() {
    var _oContainer;
    var _aSharks = []; // Shark array'i
    var _iSharkY;
    var _iSharkHeight = 80; // Shark yüksekliği
    var _iSharkCount = 3; // 3 shark
    
    // Manuel animasyon kontrolü için
    var _iCurrentFrame = 0;
    var _iFrameCounter = 0;
    var _iFrameDuration = 3; // Her 3 frame'de bir değiş (hızlı)
    
    this._init = function() {
        // Shark konumu - nehir içinde
        _iSharkY = PLATFORM_Y - 10; // Nehir seviyesinde
        
        // Container oluştur
        _oContainer = new createjs.Container();
        _oContainer.x = 0;
        _oContainer.y = _iSharkY;
        
        // Container'ın tam boyutları kaplaması için
        _oContainer.width = CANVAS_WIDTH;
        _oContainer.height = _iSharkHeight;
        
        // Container'ın görünürlüğünü ayarla
        _oContainer.alpha = 0.6;
        
        // Shark spritesheet'ini al
        var sharkSpritesheet = s_oSpriteLibrary.getSprite("sharkidle");
        
        if (!sharkSpritesheet) {
            console.error("Shark spritesheet not found!");
            return;
        }
        
        console.log("Shark spritesheet loaded - Size:", sharkSpritesheet.width, "x", sharkSpritesheet.height);
        
        // SpriteSheet oluştur - manuel frame tanımı
        var frameWidth = Math.floor(sharkSpritesheet.width / 4); // 2048 / 4 = 512
        var frameHeight = Math.floor(sharkSpritesheet.height / 4); // 2048 / 4 = 512
        
        var spriteSheet = new createjs.SpriteSheet({
            images: [sharkSpritesheet],
            frames: [
                // 4x4 grid - 16 frame
                [0, 0, frameWidth, frameHeight, 0, 0, 0],           // Frame 0
                [frameWidth, 0, frameWidth, frameHeight, 0, 0, 1],   // Frame 1
                [frameWidth * 2, 0, frameWidth, frameHeight, 0, 0, 2], // Frame 2
                [frameWidth * 3, 0, frameWidth, frameHeight, 0, 0, 3], // Frame 3
                [0, frameHeight, frameWidth, frameHeight, 0, 0, 4],    // Frame 4
                [frameWidth, frameHeight, frameWidth, frameHeight, 0, 0, 5], // Frame 5
                [frameWidth * 2, frameHeight, frameWidth, frameHeight, 0, 0, 6], // Frame 6
                [frameWidth * 3, frameHeight, frameWidth, frameHeight, 0, 0, 7], // Frame 7
                [0, frameHeight * 2, frameWidth, frameHeight, 0, 0, 8], // Frame 8
                [frameWidth, frameHeight * 2, frameWidth, frameHeight, 0, 0, 9], // Frame 9
                [frameWidth * 2, frameHeight * 2, frameWidth, frameHeight, 0, 0, 10], // Frame 10
                [frameWidth * 3, frameHeight * 2, frameWidth, frameHeight, 0, 0, 11], // Frame 11
                [0, frameHeight * 3, frameWidth, frameHeight, 0, 0, 12], // Frame 12
                [frameWidth, frameHeight * 3, frameWidth, frameHeight, 0, 0, 13], // Frame 13
                [frameWidth * 2, frameHeight * 3, frameWidth, frameHeight, 0, 0, 14], // Frame 14
                [frameWidth * 3, frameHeight * 3, frameWidth, frameHeight, 0, 0, 15]  // Frame 15
            ],
            animations: {
                swim: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    speed: 0.1, // Hızlı animasyon
                    next: "swim" // Sürekli döngü
                }
            }
        });
        
        // 3 shark oluştur
        for (var i = 0; i < _iSharkCount; i++) {
            // Sprite oluştur - manuel kontrol için
            var sharkSprite = new createjs.Sprite(spriteSheet);
            
            // İlk frame'i göster
            sharkSprite.gotoAndStop(0);
            
            // Sprite'i çok büyüt (shark çok büyük olsun)
            var scaleX = 1.0; // Shark'ı çok büyüt (0.6'dan 1.0'a)
            var scaleY = 1.0; // Shark'ı çok büyüt (0.6'dan 1.0'a)
            
            // Sprite'i ölçekle
            sharkSprite.scaleX = scaleX;
            sharkSprite.scaleY = scaleY;
            
            // Her shark'ı farklı konumlara yerleştir
            var startX = (CANVAS_WIDTH / _iSharkCount) * i + (CANVAS_WIDTH / _iSharkCount) / 2;
            sharkSprite.x = startX;
            sharkSprite.y = _iSharkHeight / 2;
            
            // Sprite'in merkez noktasını ayarla
            sharkSprite.regX = frameWidth / 2;
            sharkSprite.regY = frameHeight / 2;
            
            // Sprite'in görünürlüğünü ayarla
            sharkSprite.alpha = 0.9;
            
            // Shark özelliklerini sakla
            var sharkData = {
                sprite: sharkSprite,
                x: startX,
                speed: 1.5 + Math.random() * 0.5, // 1.5-2.0 arası rastgele hız
                movingRight: Math.random() < 0.5, // Rastgele başlangıç yönü
                directionChangeTimer: 0,
                directionChangeInterval: 200 + Math.random() * 200 // 200-400 arası rastgele interval
            };
            
            _aSharks.push(sharkData);
            
            // Sprite'i container'a ekle
            _oContainer.addChild(sharkSprite);
        }
        
        console.log("Manual frame definition - Frame width:", frameWidth, "Frame height:", frameHeight);
        console.log("Shark scaling - Scale: 1.0 x 1.0 (ÇOK BÜYÜK)");
        console.log("Created", _iSharkCount, "sharks");
        
        // Container'ı stage'e ekle (nehir animasyonunun üstünde)
        s_oStage.addChild(_oContainer);
        
        console.log("Shark animation initialized - Y:", _iSharkY, "Height:", _iSharkHeight, "Manual control started");
        console.log("Manual animation - Frame duration:", _iFrameDuration, "Frames: 16, Manual control enabled");
        console.log("SpriteSheet info:", spriteSheet.getNumFrames(), "frames, Current frame:", _iCurrentFrame);
    };
    
    this.update = function() {
        // Manuel frame kontrolü ile animasyon (tüm shark'lar için)
        _iFrameCounter++;
        if (_iFrameCounter >= _iFrameDuration) {
            _iFrameCounter = 0;
            _iCurrentFrame = (_iCurrentFrame + 1) % 16; // 0-15 arasında döngü
            
            // Tüm shark'ların frame'ini güncelle
            for (var i = 0; i < _aSharks.length; i++) {
                if (_aSharks[i].sprite && _aSharks[i].sprite.gotoAndStop) {
                    _aSharks[i].sprite.gotoAndStop(_iCurrentFrame);
                }
            }
            
            // Debug log (her frame değişiminde göster)
            if (_iCurrentFrame === 0) {
                console.log("Shark animation cycle completed - Frame:", _iCurrentFrame, "Sharks:", _aSharks.length);
            }
        }
        
        // Her shark için hareket kontrolü
        for (var i = 0; i < _aSharks.length; i++) {
            var shark = _aSharks[i];
            if (shark.sprite) {
                // Yön değiştirme timer'ını artır
                shark.directionChangeTimer++;
                if (shark.directionChangeTimer >= shark.directionChangeInterval) {
                    shark.directionChangeTimer = 0;
                    // Rastgele yön değiştir
                    if (Math.random() < 0.3) { // %30 şansla yön değiştir
                        shark.movingRight = !shark.movingRight;
                        console.log("Shark", i, "direction changed to:", shark.movingRight ? "right" : "left");
                    }
                }
                
                // Shark'ı hareket ettir
                if (shark.movingRight) {
                    shark.sprite.x += shark.speed;
                    if (shark.sprite.x > CANVAS_WIDTH + 100) { // Ekranın dışına çıktı
                        shark.sprite.x = -100; // Sol taraftan tekrar gir
                    }
                } else {
                    shark.sprite.x -= shark.speed;
                    if (shark.sprite.x < -100) { // Ekranın dışına çıktı
                        shark.sprite.x = CANVAS_WIDTH + 100; // Sağ taraftan tekrar gir
                    }
                }
                
                // Shark'ın yönünü ayarla (sağa gidiyorsa normal, sola gidiyorsa ters çevir)
                if (shark.movingRight) {
                    shark.sprite.scaleX = 1.0; // Normal yön (çok büyük)
                } else {
                    shark.sprite.scaleX = -1.0; // Ters yön (çok büyük)
                }
            }
        }
    };
    
    // Reset function - animasyonu başlangıç durumuna döndür
    this.reset = function() {
        console.log("🦈 Resetting shark animation to initial state...");
        
        // Frame counter'ları sıfırla
        _iCurrentFrame = 0;
        _iFrameCounter = 0;
        
        // Tüm shark'ları başlangıç durumuna döndür
        for (var i = 0; i < _aSharks.length; i++) {
            var shark = _aSharks[i];
            if (shark.sprite) {
                // Frame'i sıfırla
                shark.sprite.gotoAndStop(0);
                
                // Pozisyonu resetle
                shark.sprite.x = shark.x; // Başlangıç X pozisyonu
                shark.sprite.y = _iSharkHeight / 2;
                
                // Scale'i resetle
                shark.sprite.scaleX = 1.0;
                shark.sprite.scaleY = 1.0;
                shark.sprite.alpha = 0.6;
                
                // Hareket özelliklerini resetle
                shark.movingRight = Math.random() < 0.5; // Rastgele başlangıç yönü
                shark.directionChangeTimer = 0;
                shark.directionChangeInterval = 200 + Math.random() * 200; // 200-400 arası rastgele interval
            }
        }
        
        // Container pozisyonunu resetle
        if (_oContainer) {
            _oContainer.x = 0;
            _oContainer.y = _iSharkY;
            _oContainer.alpha = 0.6;
        }
        
        console.log("✅ Shark animation reset complete -", _aSharks.length, "sharks reset");
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
