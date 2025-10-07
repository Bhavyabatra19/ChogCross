function CRiverAnimation() {
    var _oContainer;
    var _oSprite;
    var _iRiverY;
    var _iRiverHeight = 130; // Nehir yüksekliği
    
    // Manuel animasyon kontrolü için
    var _iCurrentFrame = 0;
    var _iFrameCounter = 0;
    var _iFrameDuration = 5; // Her 5 frame'de bir değiş (çok hızlı)
    
    this._init = function() {
        // Nehir konumu - platformların altında
        _iRiverY = PLATFORM_Y - 30; // Platformların 20px altında
        
        // Container oluştur
        _oContainer = new createjs.Container();
        _oContainer.x = 0;
        _oContainer.y = _iRiverY;
        
        // Container'ın tam boyutları kaplaması için
        _oContainer.width = CANVAS_WIDTH;
        _oContainer.height = _iRiverHeight;
        
        // Container'ın görünürlüğünü ayarla (daha az saydam)
        _oContainer.alpha = 0.9; // %30 opaklık - shark çok daha net görünsün
        
        // Sea spritesheet'ini al
        var seaSpritesheet = s_oSpriteLibrary.getSprite("sea_spritesheet");
        
        if (!seaSpritesheet) {
            console.error("Sea spritesheet not found!");
            return;
        }
        
        console.log("Sea spritesheet loaded - Size:", seaSpritesheet.width, "x", seaSpritesheet.height);
        
        // SpriteSheet oluştur - manuel frame tanımı
        var frameWidth = Math.floor(seaSpritesheet.width / 3); // 3632 / 3 = 1210 (tam sayı)
        var frameHeight = seaSpritesheet.height;   // 416
        
        var spriteSheet = new createjs.SpriteSheet({
            images: [seaSpritesheet],
            frames: [
                [0, 0, frameWidth, frameHeight, 0, 0, 0],           // Frame 0
                [frameWidth, 0, frameWidth, frameHeight, 0, 0, 1],   // Frame 1
                [frameWidth * 2, 0, frameWidth, frameHeight, 0, 0, 2] // Frame 2
            ],
            animations: {
                sea: {
                    frames: [0, 1, 2],
                    speed: 0.1, // Çok hızlı animasyon
                    next: "sea" // Sürekli döngü
                }
            }
        });
        
        // Sprite oluştur - manuel kontrol için
        _oSprite = new createjs.Sprite(spriteSheet);
        
        // İlk frame'i göster
        _oSprite.gotoAndStop(0);
        
        // Sprite'i tam 1200x100px alana kaplayacak şekilde ölçekle
        var scaleX = CANVAS_WIDTH / frameWidth;     // 1200 / frame_width
        var scaleY = _iRiverHeight / frameHeight;    // 100 / frame_height
        
        console.log("Manual frame definition - Frame width:", frameWidth, "Frame height:", frameHeight);
        console.log("Frame positions: [0,0], [", frameWidth, ",0], [", frameWidth * 2, ",0]");
        
        // Sprite'i ölçekle
        _oSprite.scaleX = scaleX;
        _oSprite.scaleY = scaleY;
        
        // Sprite'i container'ın merkezine yerleştir
        _oSprite.x = CANVAS_WIDTH / 2;
        _oSprite.y = _iRiverHeight / 2;
        
        // Sprite'in merkez noktasını ayarla
        _oSprite.regX = frameWidth / 2;
        _oSprite.regY = frameHeight / 2;
        
        // Sprite'in görünürlüğünü ayarla
        _oSprite.alpha = 1.0;
        
        // Sprite'in gerçek boyutlarını hesapla
        var actualWidth = frameWidth * scaleX;
        var actualHeight = frameHeight * scaleY;
        
        console.log("Sea sprite scaling - Target:", CANVAS_WIDTH, "x", _iRiverHeight, "Frame:", frameWidth, "x", frameHeight, "Scale:", scaleX, "x", scaleY, "Actual:", actualWidth, "x", actualHeight, "Position:", _oSprite.x, "x", _oSprite.y);
        
        // Sprite'i container'a ekle
        _oContainer.addChild(_oSprite);
        
        // Container'ı stage'e ekle
        s_oStage.addChild(_oContainer);
        
        console.log("Sea animation initialized - Y:", _iRiverY, "Height:", _iRiverHeight, "Final size:", CANVAS_WIDTH, "x", _iRiverHeight, "Manual control started");
        console.log("Manual animation - Frame duration:", _iFrameDuration, "Frames: 3, Manual control enabled");
        console.log("SpriteSheet info:", spriteSheet.getNumFrames(), "frames, Current frame:", _iCurrentFrame);
    };
    
    this.update = function() {
        // Manuel frame kontrolü ile animasyon
        if (_oSprite && _oSprite.gotoAndStop) {
            _oSprite.gotoAndStop(_iCurrentFrame);
            
            // Frame counter'ı artır
            _iFrameCounter++;
            if (_iFrameCounter >= _iFrameDuration) {
                _iFrameCounter = 0;
                _iCurrentFrame = (_iCurrentFrame + 1) % 3; // 0, 1, 2 arasında döngü
                
                // Debug log (her frame değişiminde göster)
                console.log("Sea animation frame changed to:", _iCurrentFrame);
            }
        }
    };
    
    // Reset function - animasyonu başlangıç durumuna döndür
    this.reset = function() {
        console.log("🌊 Resetting river animation to initial state...");
        
        // Frame counter'ları sıfırla
        _iCurrentFrame = 0;
        _iFrameCounter = 0;
        
        // Sprite'i ilk frame'e döndür
        if (_oSprite && _oSprite.gotoAndStop) {
            _oSprite.gotoAndStop(0);
        }
        
        // Container pozisyonunu resetle
        if (_oContainer) {
            _oContainer.x = 0;
            _oContainer.y = _iRiverY;
            _oContainer.alpha = 0.9;
        }
        
        console.log("✅ River animation reset complete");
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