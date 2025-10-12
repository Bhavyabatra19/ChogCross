
function CCharacter(iX, iY, oSprite)
{
    var _iStartingX;
    var _iStartingY;
    var _iGravityForce;
    var _iHalfHeight;
    var _iHeight;
    var _iWidth;
    var _oSprite;
    var _bOnGround;
    var _rChar;
    var _bOnCollision;
    var _sheetData;
    var _oMask;
    var _iTap;
    var _spriteSheet;
    var _bCrouch;
    var _bSoundPlayed;
    var _bGameOver;
    var _bJumping; // Zıplama durumu kontrolü
    var _iJumpCooldownTimer; // Zıplama sonrası cooldown timer
    var _bJumpCooldown; // Zıplama sonrası cooldown durumu
    var _bCelebrationActive = false; // Kutlama animasyonu aktif mi
    var _bFailedLanding = false; // Failed landing flag - platform animasyonu sonrası shark attack için

    this.init = function (iX, iY, oSprite)
    {
        _iTap = 0;
        _bSoundPlayed = false;
        _bGameOver = false;
        _bJumping = false; // Başlangıçta zıplamıyor
        _iJumpCooldownTimer = 0; // Cooldown timer sıfır
        _bJumpCooldown = false; // Cooldown yok
        
        // İki farklı spritesheet kullan: idle ve jump
        var idleSprite = s_oSpriteLibrary.getSprite("hero"); // idlesprite.png
        var jumpSprite = s_oSpriteLibrary.getSprite("hero_jump"); // jumpsprite.png
        
        console.log("Jump sprite loaded:", !!jumpSprite, jumpSprite);
        console.log("Idle sprite loaded:", !!idleSprite, idleSprite);
        
        // KOMBİNE SPRITE SHEET - İDLE VE JUMP BİRLİKTE
        var combinedSheet = new createjs.SpriteSheet({
            images: [idleSprite, jumpSprite],
            frames: [
                // İlk 9 frame: idle animasyonu (idlesprite.png - 3x3 grid, 512x512 frame)
                [0, 0, 512, 512, 0, 256, 256],     // Frame 0 - Idle 1
                [512, 0, 512, 512, 0, 256, 256],   // Frame 1 - Idle 2
                [1024, 0, 512, 512, 0, 256, 256],  // Frame 2 - Idle 3
                [0, 512, 512, 512, 0, 256, 256],   // Frame 3 - Idle 4
                [512, 512, 512, 512, 0, 256, 256], // Frame 4 - Idle 5
                [1024, 512, 512, 512, 0, 256, 256], // Frame 5 - Idle 6
                [0, 1024, 512, 512, 0, 256, 256],  // Frame 6 - Idle 7
                [512, 1024, 512, 512, 0, 256, 256], // Frame 7 - Idle 8
                [1024, 1024, 512, 512, 0, 256, 256], // Frame 8 - Idle 9
                
                // Sonraki 9 frame: jump animasyonu (jumpsprite.png - 3x3 grid, 512x512 frame)
                [0, 0, 512, 512, 1, 256, 256],     // Frame 9 = Jump Frame 0 (1. satır, 1. sütun)
                [512, 0, 512, 512, 1, 256, 256],   // Frame 10 = Jump Frame 1 (1. satır, 2. sütun)
                [1024, 0, 512, 512, 1, 256, 256],  // Frame 11 = Jump Frame 2 (1. satır, 3. sütun)
                [0, 512, 512, 512, 1, 256, 256],   // Frame 12 = Jump Frame 3 (2. satır, 1. sütun)
                [512, 512, 512, 512, 1, 256, 256], // Frame 13 = Jump Frame 4 (2. satır, 2. sütun)
                [1024, 512, 512, 512, 1, 256, 256], // Frame 14 = Jump Frame 5 (2. satır, 3. sütun) - KULLANILACAK
                [0, 1024, 512, 512, 1, 256, 256],  // Frame 15 = Jump Frame 6 (3. satır, 1. sütun) - KULLANILACAK
                [512, 1024, 512, 512, 1, 256, 256], // Frame 16 = Jump Frame 7 (3. satır, 2. sütun) - KULLANILACAK
                [1024, 1024, 512, 512, 1, 256, 256] // Frame 17 = Jump Frame 8 (3. satır, 3. sütun) - KULLANILACAK
            ],
            animations: {
                idle: [0, 8, "idle", 0.2], // 9 frame idle animasyonu (0-8)
                jump: [14, 16, false, 0.20] // 3 frame jump animasyonu (14-16), 5,6,7 frameleri kullanılıyor - HIZLI
            }
        });
        
        var spriteSheet = combinedSheet; // KOMBİNE SPRITE SHEET KULLAN
        
        _oSprite = new createjs.Sprite(spriteSheet, "idle");
        _iHeight = 512; // Frame yüksekliği (512x512 - her iki sprite de aynı boyut)
        _iWidth = 512;  // Frame genişliği (512x512 - her iki sprite de aynı boyut)
        
        // Jump animasyonunda toz efekti için frame listener ekle
        _oSprite.on("animationend", function(event) {
            console.log("Animation ended:", event.name);
        });
        
        // Frame listener kaldırıldı - toz efekti artık iniş anında çıkacak
        _iHalfHeight = _iHeight * 0.5;
        _bCrouch = false;
        _oSprite.x = _iStartingX = iX + 10; // Karakteri sola kaydır
        _oSprite.y = _iStartingY = iY - _iHalfHeight - 18; // Kütüğün tam üstünde (yukarıda)
        _rChar = createRect(_oSprite.x - _iWidth / 2, _oSprite.y - _iHalfHeight, _iWidth, _iHeight);
        
        console.log("Character initialized - X:", _oSprite.x, "Y:", _oSprite.y, "Height:", _iHeight); // Debug
        
        s_oStage.addChild(_oSprite);
        
        // Idle ve Jump sprite'larının ekrandaki boyutları aynı olsun
        // Artık her iki sprite de 512x512 frame boyutunda
        // Hedef görüntü boyutu: 358x358 (idle'ın %70'i)
        var targetSize = 358; // Hedef ekran boyutu
        var frameSize = 512; // Her iki sprite de 512x512 frame boyutu
        
        // Scale hesapla: targetSize / frameSize
        var spriteScale = targetSize / frameSize; // 358/512 = 0.7
        
        // Her iki animasyon için aynı scale kullan
        _oSprite.scaleX = spriteScale; // 0.7 (her iki sprite için)
        _oSprite.scaleY = spriteScale; // 0.7 (her iki sprite için)
        
        console.log("Scale value for both sprites:", spriteScale);
        
        _oMask = new createjs.Shape();
        _oMask.graphics.beginFill("rgba(255,0,0,1)").drawRect(0, 0, 100, 5);
        _oMask.regX = 50;
        _oMask.x = _oSprite.x;
        _oMask.y = _oSprite.y - _iHeight/2;
        _oMask.scaleX = 0;
        s_oStage.addChild(_oMask);
        _iGravityForce = 0; // Başlangıçta gravity force sıfır olsun
        _bOnCollision = false;
        _bOnGround = true; // Başlangıçta yerde olsun
    };
    // ZIPLAMA BAŞLANGICINDA TOZ EFEKTİ (PUBLIC) - PERFORMANS İYİLEŞTİRMESİ
    this.createDustEffect = function(jumpX, jumpY) {
        console.log("ZIPLAMA TOZ EFEKTİ OLUŞTURULUYOR - Zıplama yerinde:", jumpX, jumpY);
        
        // ÖNCE ESKİ EFEKTLERİ TEMİZLE
        this.cleanupOldDustEffects();
        
        // Maksimum efekt limiti kontrolü
        if (_aDustEffects.length > 15) {
            console.log("🚫 TOZ EFEKTİ LİMİTİ AŞILDI - Temizleme yapılıyor");
            this.clearAllDustEffects();
        }
        
        // Daha az toz parçacığı oluştur (10 yerine 5)
        for (var i = 0; i < 5; i++) {
            var dust = new createjs.Shape();
            dust.graphics.beginFill("rgba(255, 255, 255, 1.0)").drawCircle(0, 0, Math.random() * 8 + 5);
            
            // Zıplama yerinde rastgele pozisyon
            dust.x = jumpX + (Math.random() - 0.5) * 50;
            dust.y = jumpY +100; // Platformun üzerinde
            dust.createdTime = Date.now(); // Oluşturulma zamanını kaydet
            
            s_oStage.addChild(dust);
            
            // Toz efektini array'e ekle (kamera takip için)
            _aDustEffects.push(dust);
            console.log("Jump dust effect added to array - Total count:", _aDustEffects.length);
            
            // Daha hızlı animasyon (700ms yerine 400ms)
            createjs.Tween.get(dust)
                .to({
                    x: dust.x + (Math.random() - 0.5) * 70, // Sadece yanlara hareket
                    y: dust.y + Math.random() * 10, // Çok az yukarı (maksimum 10px)
                    alpha: 0,
                    scaleX: 0.3,
                    scaleY: 0.3
                }, 400 + Math.random() * 200, createjs.Ease.quadOut)
                .call(function() {
                    s_oStage.removeChild(dust);
                    // Array'den de kaldır
                    var index = _aDustEffects.indexOf(dust);
                    if (index > -1) {
                        _aDustEffects.splice(index, 1);
                        console.log("Jump dust effect removed from array - Remaining count:", _aDustEffects.length);
                    }
                });
        }
    };
    // İNİŞ YERİNDE TOZ EFEKTİ (PUBLIC) - PERFORMANS İYİLEŞTİRMESİ
    this.createLandingDustEffect = function(landingX, landingY) {
        console.log("İNİŞ TOZ EFEKTİ OLUŞTURULUYOR - İniş yerinde:", landingX, landingY);
        
        // ÖNCE ESKİ EFEKTLERİ TEMİZLE
        this.cleanupOldDustEffects();
        
        // Maksimum efekt limiti kontrolü
        if (_aDustEffects.length > 20) {
            console.log("🚫 TOZ EFEKTİ LİMİTİ AŞILDI - Temizleme yapılıyor");
            this.clearAllDustEffects();
        }
        
        // Daha az toz parçacığı oluştur (15 yerine 8)
        for (var i = 0; i < 8; i++) {
            var dust = new createjs.Shape();
            dust.graphics.beginFill("rgba(255, 255, 255, 1.0)").drawCircle(0, 0, Math.random() * 10 + 6);
            
            // İniş yerinde rastgele pozisyon
            dust.x = landingX + (Math.random() - 0.5) * 60;
            dust.y = landingY + 100; // Platformun üzerinde
            dust.createdTime = Date.now(); // Oluşturulma zamanını kaydet
            
            s_oStage.addChild(dust);
            
            // Toz efektini array'e ekle (kamera takip için)
            _aDustEffects.push(dust);
            console.log("Landing dust effect added to array - Total count:", _aDustEffects.length);
            
            // Daha hızlı animasyon (900ms yerine 500ms)
            createjs.Tween.get(dust)
                .to({
                    x: dust.x + (Math.random() - 0.5) * 90, // Sadece yanlara hareket
                    y: dust.y + Math.random() * 15, // Çok az yukarı (maksimum 15px)
                    alpha: 0,
                    scaleX: 0.25,
                    scaleY: 0.25
                }, 500 + Math.random() * 300, createjs.Ease.quadOut)
                .call(function() {
                    s_oStage.removeChild(dust);
                    // Array'den de kaldır
                    var index = _aDustEffects.indexOf(dust);
                    if (index > -1) {
                        _aDustEffects.splice(index, 1);
                        console.log("Landing dust effect removed from array - Remaining count:", _aDustEffects.length);
                    }
                });
        }
    };
this.reset = function (){
    console.log("🔄 CCharacter.reset() called - Resetting all character states");
    
    _iGravityForce = 0; // Reset'te de sıfır olsun
    _bOnGround = true; // Reset'te yerde olsun
    _bGameOver = false; // Game over durumunu resetle
    _bJumping = false; // Zıplama durumunu resetle
    _iJumpCooldownTimer = 0; // Cooldown timer resetle
    _bJumpCooldown = false; // Cooldown durumunu resetle
    _bCelebrationActive = false; // Kutlama animasyonunu resetle
    
    // Tüm character tween'lerini durdur
    if (_oSprite) {
        createjs.Tween.removeTweens(_oSprite);
        _oSprite.alpha = 1; // Karakteri görünür yap
    }
    
    this.clearWinningsDisplay(); // Kazanç text'ini temizle
    this.clearAllDustEffects(); // Tüm toz efektlerini temizle
    
    console.log("✅ CCharacter.reset() complete");
    };
    
    // Reset character position to starting position
    this.resetPosition = function(iX, iY) {
        console.log("🔄 CCharacter.resetPosition() called - Position:", iX, iY);
        
        // Stop all tweens on the character sprite
        createjs.Tween.removeTweens(_oSprite);
        
        // DÜZELTME: Eğer parametreler undefined ise default değerleri kullan
        var resetX = (iX !== undefined) ? iX : 130; // Default X: 130
        var resetY = (iY !== undefined) ? iY : 216; // Default Y: 216 (DOĞRU BAŞLANGIÇ POZİSYONU)
        
        console.log("🔄 Using reset position - X:", resetX, "Y:", resetY);
        
        // Reset position to starting values (use same formula as initial spawn)
        _oSprite.x = _iStartingX = resetX + 10; // slight offset to align with first platform
        _oSprite.y = _iStartingY = resetY - _iHalfHeight - 18; // align sprite bottom to platform like at first spawn
        
        // Reset physics
        _iGravityForce = 0;
        _bOnGround = true;
        _bGameOver = false;
        _iTap = 0;
        _bSoundPlayed = false;
        _bOnCollision = false;
        _bJumping = false; // Reset'te zıplama durumunu sıfırla
        _iJumpCooldownTimer = 0; // Cooldown timer sıfırla
        _bJumpCooldown = false; // Cooldown durumunu sıfırla
        _bCelebrationActive = false; // Kutlama animasyonunu sıfırla
        
        // Karakteri görünür yap (kutlama animasyonundan sonra gizli kalabilir)
        _oSprite.alpha = 1;
        
        // Kazanç text'ini temizle
        this.clearWinningsDisplay();
        
        // Reset animation to idle
        _oSprite.stop();
        _oSprite.gotoAndPlay("idle");
        
        // Update collision rectangle
        _rChar = createRect(_oSprite.x - _iWidth / 2, _oSprite.y - _iHalfHeight, _iWidth, _iHeight);
        
        // Reset mask position
        _oMask.x = _oSprite.x;
        _oMask.y = _oSprite.y - _iHeight/2;
        _oMask.scaleX = 0;
        _oMask.alpha = 0.001;
        
        console.log("✅ CCharacter.resetPosition() complete - X:", _oSprite.x, "Y:", _oSprite.y);
    };
    
    this.getSprite = function (){
        return _oSprite;
    };
    
    this.getY = function (){
        return _oSprite.y;
    };
    
    this.getX = function ()
    {
        return _oSprite.x;
    };

    this.getHeight = function ()
    {
        return _iHeight;
    };

    this.getWidth = function ()
    {
        return _iWidth;
    };

    this.setCharge = function (bSet) 
    {
      _bCrouch = bSet;  
    };
    this.onGround = function ()
    {
        return _bOnGround;
    };
    
    this.isCelebrationActive = function ()
    {
        return _bCelebrationActive;
    };
    this.isColliding = function ()
    {
        return _bOnCollision;
    };
    
    this.update = function (){
        if (_bGameOver) return; // Oyun bittiyse update etme
        
        // PERFORMANS İYİLEŞTİRMESİ: Her 60 frame'de bir (1 saniyede) eski toz efektlerini temizle
        if (!this._dustCleanupCounter) this._dustCleanupCounter = 0;
        this._dustCleanupCounter++;
        
        if (this._dustCleanupCounter >= 60) { // 60 FPS'de 1 saniye
            this.cleanupOldDustEffects();
            this._dustCleanupCounter = 0;
        }
        
        // Acil durum: Çok fazla efekt varsa hemen temizle
        if (_aDustEffects.length > 30) {
            console.log("🚨 ACİL DURUM: Çok fazla toz efekti - Hemen temizleme yapılıyor");
            this.clearAllDustEffects();
        }
        
        // Basit update - sadece mask pozisyonunu güncelle
        _oMask.x = _oSprite.x;
        _oMask.y = _oSprite.y - _iHeight/2;
        
        // KAZANÇ TEXT'İNİ KARAKTERLE BİRLİKTE HAREKET ETTİR
        this.updateWinningsPosition();
        
        // COOLDOWN TIMER GÜNCELLE
        if (_bJumpCooldown && _iJumpCooldownTimer > 0) {
            _iJumpCooldownTimer--;
            if (_iJumpCooldownTimer <= 0) {
                _bJumpCooldown = false;
                console.log("JUMP COOLDOWN FINISHED - Ready to jump again!");
            }
        }
        
        // Oyun sonu kontrolü kaldırıldı - risk kontrolü iniş anında yapılacak
        // if (s_oGame.getJumpsLeft() <= 0 && _bOnGround) {
        //     if (_bGameOver === false) {
        //         _bGameOver = true; // Önce game over'ı true yap
        //         s_oGame.gameOver();
        //     }
        // }
    };
    
    this.updateGraphics = function (iTap){
        _iTap = iTap;
         if (iTap >= 25) 
        {
            _iTap= 25;
        }
        var percentage = _iTap / 25;
        _oMask.alpha = 1;
        createjs.Tween.get(_oMask).to({scaleX: percentage}, 100).call(function () { _oMask.alpha = 0.001});
    };
    
    this.updateAnim = function () {
        // JUMP SIRASINDA HİÇBİR ŞEY YAPMA - JUMP ANİMASYONU BOZULMASIN
        if (!_bOnGround) {
            // Havadayken hiçbir şey yapma, jump animasyonu devam etsin
            return;
        }
        
        // Sadece yerdeyken idle animasyonuna dön VE SÜREKLI TEKRAR ETSİN
        if (_bOnGround && _oSprite.currentAnimation !== "idle"){
            _oSprite.gotoAndPlay("idle"); // Idle animasyonunu başlat (loop eder)
        }
        
        // İDLE POZİSYONUNDA YUKARSI ZIPLAMA ENGELLENSİN - Pozisyonu sabitle
        if (_bOnGround && _oSprite.currentAnimation === "idle") {
            // Karakter pozisyonunu sabitle, yukarı zıplamasın
            var currentPlatformY = CHARACTER_Y - _iHalfHeight + 80; // Sabit platform pozisyonu
            _oSprite.y = currentPlatformY; // Y pozisyonunu sabitle
        }
        
        if (_bOnGround && _oSprite.currentAnimation === "idle" && _bCrouch === true){
            _oSprite.gotoAndStop("idle");
            _oSprite.gotoAndPlay("charge");
        }
    };
    
    this.startJump = function() {
        console.log("=== JUMP BAŞLADI - SCALE DEĞİŞTİRİLİYOR ===");
        console.log("Önceki animasyon:", _oSprite.currentAnimation);
        console.log("Önceki frame:", _oSprite.currentFrame);
        
        // Artık her iki sprite de 512x512 olduğu için scale değiştirmeye gerek yok
        // Scale zaten 0.7 olarak ayarlanmış durumda
        console.log("Jump started - scale remains:", _oSprite.scaleX);
        
        // Jump animasyonunu başlat
        _oSprite.stop();
        _oSprite.gotoAndPlay("jump");
        
        console.log("Jump animation started, scale:", _oSprite.scaleX);
        console.log("Sonraki animasyon:", _oSprite.currentAnimation);
        console.log("Sonraki frame:", _oSprite.currentFrame);
        console.log("=== JUMP BAŞLATMA BİTTİ ===");
    };
    
    this.stopJump = function() {
        console.log("=== JUMP DURDURULUYOR - SCALE GERİ ALINIYOR ===");
        console.log("Önceki animasyon:", _oSprite.currentAnimation);
        console.log("Önceki frame:", _oSprite.currentFrame);
        
        // Artık her iki sprite de aynı boyutta olduğu için scale değiştirmeye gerek yok
        console.log("Jump stopped - scale remains:", _oSprite.scaleX);
        
        // Idle animasyonuna dön (sürekli tekrar eder)
        _oSprite.gotoAndPlay("idle");
        
        console.log("Idle animation started, scale:", _oSprite.scaleX);
        console.log("Sonraki animasyon:", _oSprite.currentAnimation);
        console.log("Sonraki frame:", _oSprite.currentFrame);
        console.log("=== JUMP DURDURMA BİTTİ ===");
    };
    
    this.moveToNextLog = function(){
        // Karakteri bir sonraki kütüğün konumuna taşı
        var aObstacles = s_oGame.updateCollidables();
        if (aObstacles.length > 0) {
            // Bir sonraki kütüğü bul
            var iNextObstacle = null;
            for (var i = 0; i < aObstacles.length; i++) {
                if (aObstacles[i].x > _oSprite.x) {
                    if (iNextObstacle === null || aObstacles[i].x < iNextObstacle.x) {
                        iNextObstacle = aObstacles[i];
                    }
                }
            }
            
            // Eğer sağda kütük yoksa, en soldaki kütüğe git
            if (iNextObstacle === null) {
                iNextObstacle = aObstacles[0];
            }
            
            _oSprite.x = iNextObstacle.x; // Tam ortada
            _oSprite.y = iNextObstacle.y - _iHalfHeight - 50; // Kütüğün tam üstünde (yukarıda)
            _iGravityForce = 0;
            _bOnGround = true;
        }
    };
    
    this.jump = function (iMultiplier){
        console.log("Jump called - onGround:", _bOnGround, "gameOver:", _bGameOver, "jumpsLeft:", s_oGame.getJumpsLeft(), "jumping:", _bJumping);
        
        // KUTLAMA ANİMASYONU KONTROLÜ - Kutlama animasyonu sırasında zıplama yapma
        if (_bCelebrationActive) {
            console.log("JUMP BLOCKED - Celebration animation is active!");
            return;
        }
        
        // OYUN DURUMU KONTROLÜ - Oyun başlamamışsa veya bitmiş ise zıplama yapma
        if (!s_oGame || !s_oGame.isGameStarted()) {
            console.log("JUMP BLOCKED - Game not started or ended!");
            return;
        }
        
        // GAME OVER KONTROLÜ - Game over durumunda zıplama yapma
        if (_bGameOver) {
            console.log("JUMP BLOCKED - Game over state active!");
            return;
        }
        // ZIPLAMA ENGELLEME SİSTEMİ - Zaten zıplıyorsa veya cooldown'daysa yeni zıplama kabul etme
        if (_bJumping || _bJumpCooldown) {
            console.log("JUMP BLOCKED - Already jumping or in cooldown! Jumping:", _bJumping, "Cooldown:", _bJumpCooldown, "Timer:", _iJumpCooldownTimer);
            return;
        }
        
        // 8. zıplama (kutlama platformuna) için özel kontrol - jumpsLeft 0 olsa bile son zıplamaya izin ver
        var jumpsUsed = 8 - s_oGame.getJumpsLeft();
        var successfulJumps = s_oGame.getSuccessfulJumps ? s_oGame.getSuccessfulJumps() : 0;
        
        // DÜZELTME: 8. zıplama için doğru kontrol - 6 başarılı zıplama sonrası 8. zıplamaya izin ver
        var canJump8th = (successfulJumps >= 6 && s_oGame.getJumpsLeft() <= 0); // 6 başarılı zıplama sonrası 8. zıplamaya izin ver
        var canJumpNormal = s_oGame.getJumpsLeft() > 0; // Normal zıplamalar
        var canJump = canJumpNormal || canJump8th;
        
        console.log("🔍 CCharacter Jump Check - JumpsLeft:", s_oGame.getJumpsLeft(), "SuccessfulJumps:", successfulJumps, "CanJump8th:", canJump8th, "CanJump:", canJump);
        
        if (_bOnGround && !_bGameOver && canJump){
        // ZIPLAMA BAŞLANGICINDA TOZ EFEKTİ
        this.createDustEffect(_oSprite.x, _oSprite.y);
        
        var aObstacles = s_oGame.updateCollidables();
        
        // DÜZELTME: Doğru platform hesaplaması - KUTLAMA PLATFORM DİKKATLİ!
        var jumpsLeft = s_oGame.getJumpsLeft(); // Kalan zıplama sayısı
        var successfulJumps = s_oGame.getSuccessfulJumps(); // Başarılı zıplama sayısı
        
        // Kutlama platform kontrolü için successfulJumps kullan
        if (successfulJumps >= 7) {
            // 7. platformdan kutlama platformuna zıplama
            var jumpsUsed = 8; // 8. zıplama - kutlama platform
            var targetPlatformNumber = 8; // Kutlama platform
            var targetPlatformIndex = 7; // Kutlama platform index
            console.log("🎉 CELEBRATION JUMP DETECTED - jumpsUsed:", jumpsUsed, "targetPlatformIndex:", targetPlatformIndex);
        } else {
            // Normal platform zıplaması
            var jumpsUsed = Math.max(0, 8 - jumpsLeft); // Kullanılan zıplama sayısı (1, 2, 3, ..., 7)
            var targetPlatformNumber = jumpsUsed; // Hedef platform numarası (1, 2, 3, ..., 7)
            var targetPlatformIndex = Math.max(0, jumpsUsed - 1); // Array index (0, 1, 2, ..., 6)
        }
        
        console.log("DEBUG - jumpsLeft:", jumpsLeft, "jumpsUsed:", jumpsUsed, "targetPlatformNumber:", targetPlatformNumber, "targetPlatformIndex:", targetPlatformIndex);
        
        // SON ZIPLAMA KONTROLÜ - 8. zıplama yapılıyorsa (jumpsUsed = 8), kutlama platformuna iniş yapacak
        if (jumpsUsed === 8) {
            console.log("🎉 FINAL JUMP - Landing on celebration platform (index 7) - This is the 8th jump!");
        }
        
        // SABİT OYUN ALANI - Platform mesafeleri korunarak karakter ilerler
        var nextPlatformX = _oSprite.x + 250; // Sabit 250px mesafe korunur
        console.log("🎮 FIXED GAME AREA - Character jumps 250px forward to X:", nextPlatformX);
        
        // Kutlama platformu kontrolü - 8. zıplama (jumpsUsed = 8)
        var targetY;
        if (jumpsUsed === 8) {
            // Kutlama platformunun 150px yukarısına iniş yap
            targetY = FIRST_PLATFORM_Y - 210;
        } else {
            // Normal platformlar için eski hesaplama
            targetY = CHARACTER_Y - _iHalfHeight + 80; // Responsive karakter pozisyonu (45-40=5)
        }
        
        console.log("JUMPING to next platform X:", nextPlatformX, "Y:", targetY);
        
        playSound("jump", 1, false);
        _bOnGround = false;
        _bJumping = true; // Zıplama başladı - yeni zıplamaları engelle
        
        // JUMP ANİMASYONUNU BAŞLAT
        console.log("Jump animation starting, current scale:", _oSprite.scaleX);
        
        _oSprite.stop();
        _oSprite.gotoAndPlay("jump");
        
        console.log("Jump animation started, scale:", _oSprite.scaleX);
        console.log("Current animation:", _oSprite.currentAnimation);
        console.log("Current frame:", _oSprite.currentFrame);
        
        // GERÇEK PARABOLİK HAREKET - İki aşamalı parabolik animasyon
        var currentX = _oSprite.x;
        var currentY = _oSprite.y;
        var jumpHeight = currentY - 25; // Zıplama yüksekliği (yukarı 25px - daha alçaktan zıplama)
        var self = this; // this referansını kaydet
        
        console.log("PARABOLIC JUMP - Start:", currentX, currentY, "Peak:", jumpHeight, "End:", nextPlatformX, targetY);
        
        // KUTLAMA PLATFORMU KONTROLÜ - 8. zıplama (jumpsUsed = 8) ise kutlama platformu
        var isCelebrationPlatform = (jumpsUsed === 8);
        
        if (isCelebrationPlatform) {
            console.log("🎉 CELEBRATION JUMP! This is the 8th jump to celebration platform!");
            console.log("🎉 Jumps used:", jumpsUsed, "Target platform index:", targetPlatformIndex);
        }
        
        // PARABOLİK HAREKET - İki aşama: 1) Yukarı çık, 2) Aşağı in
        // 1. AŞAMA: Yukarı zıpla (parabolik yukarı hareket)
        createjs.Tween.get(_oSprite)
            .to({
                x: currentX + (nextPlatformX - currentX) * 0.5, // Yarı yol X hareketi
                y: jumpHeight // Zıplama zirvesi
            }, 200, createjs.Ease.quadOut) // Yukarı çıkarken yavaşla - HIZLI
            // 2. AŞAMA: Aşağı düş (parabolik aşağı hareket)
            .to({
                x: nextPlatformX, // Hedef X pozisyonu
                y: targetY // Hedef Y pozisyonu
            }, 200, createjs.Ease.quadIn) // Aşağı düşerken hızlan - HIZLI
            .call(function() {
                _bOnGround = true;
                _iGravityForce = 0;
                _bJumping = false; // Zıplama bitti
                
                // DÜZELTME: İniş yapılan platform indexi - targetPlatformIndex zaten doğru hesaplanmış
                // targetPlatformIndex değeri jump başlangıcında hesaplandı ve scope'ta mevcut
                var landedPlatformIndex = targetPlatformIndex; // Use the already calculated correct index
                
                console.log("=== PLATFORM LANDING DEBUG ===");
                console.log("Target platform index from jump start:", targetPlatformIndex);
                console.log("Landed on platform:", landedPlatformIndex + 1, "(platform", landedPlatformIndex + 1, ")");
                console.log("🎬 ANIMATION: Will animate platform index:", landedPlatformIndex, "which should be platform", landedPlatformIndex + 1);
                
                // UI güncellemesi her zaman yap - game state check'i kaldır
                // Jump animation ve platform animasyonu jump fail olsa bile tamamlanmalı
                if (s_oGame && !_bGameOver) {
                    // BAŞARILI ZIPLAMA SAYISINI ARTIR - İniş anında (public fonksiyon kullan)
                    if (s_oGame.incrementSuccessfulJumps) {
                        s_oGame.incrementSuccessfulJumps();
                    }
                    
                    // ÖNCE UI'ı güncelle (multiplier'ı hesapla)
                    if (s_oGame && s_oGame.updateUIAfterLanding) {
                        s_oGame.updateUIAfterLanding(landedPlatformIndex);
                    }
                    
                    // SONRA kazanç gösterimini yap (güncellenmiş multiplier ile)
                    // Small delay to ensure multiplier is updated
                    setTimeout(function() {
                        self.showWinningsDisplay(nextPlatformX, _oSprite.y);
                        // ALSO call updateWinningsDisplay to ensure real-time sync
                        setTimeout(function() {
                            self.updateWinningsDisplay();
                        }, 50); // Additional delay for updateWinningsDisplay
                    }, 100); // 100ms delay to ensure multiplier is calculated
                } else {
                    console.log("Game ended - skipping UI updates");
                }
                
                // TOZ EFEKTİNİ İNİŞ YERİNDE OLUŞTUR (İNİŞ EFEKTİ)
                self.createLandingDustEffect(nextPlatformX, _oSprite.y);
                
                // COOLDOWN BAŞLAT - 60 frame (yaklaşık 1 saniye) bekleme süresi
                _bJumpCooldown = true;
                _iJumpCooldownTimer = 15; // 15 FPS'de 0.25 saniye
                console.log("JUMP COOLDOWN STARTED - Wait", _iJumpCooldownTimer, "frames before next jump");
                
                // JUMP ANİMASYONU BİTTİ - İNİŞ YAPILDI, İDLE ANİMASYONUNA GEÇ
                _oSprite.gotoAndPlay("idle"); // Idle animasyonunu başlat (sürekli tekrar eder)
                
                console.log("LANDED at X:", _oSprite.x, "Platform index:", landedPlatformIndex);
                
                // KUTLAMA PLATFORMU KONTROLÜ VE ANİMASYONU - 8. zıplamada (kutlama platformu index 7)
                // CELEBRATION PLATFORM CHECK: 8th jump lands on platform index 7 (celebration platform)
                var isCelebrationPlatform = (landedPlatformIndex === 7 || jumpsUsed === 8);
                console.log("🎉 CELEBRATION CHECK - landedPlatformIndex:", landedPlatformIndex, "jumpsUsed:", jumpsUsed, "isCelebrationPlatform:", isCelebrationPlatform);
                
                if (isCelebrationPlatform) {
                    console.log("🎉 CELEBRATION PLATFORM REACHED! Starting celebration animation...");
                    console.log("🎉 This is the 8th jump (jumpsUsed:", jumpsUsed, ") - Landing on celebration platform (index:", landedPlatformIndex, ")");
                    console.log("🎉 isCelebrationPlatform:", isCelebrationPlatform, "- Starting celebration animation now!");
                    
                    console.log("🎯 CELEBRATION DETAILS:");
                    console.log("   📍 Final landing position X:", _oSprite.x);
                    console.log("   📍 Final landing position Y:", _oSprite.y);
                    console.log("   🏆 Platform index reached:", landedPlatformIndex);
                    console.log("   🎮 Total jumps made:", jumpsUsed);
                    console.log("   🎪 Celebration animation starting...");
                    
                    // KUTLAMA BAŞLADIĞINDA DAHA FAZLA ZIPLAMA ENGELLENECEK
                    _bGameOver = true; // Oyun bitti, artık zıplanamaz
                    console.log("🎉 CELEBRATION MODE - Game over flag set to prevent further jumping");
                    
                    // ÖNCE KAZANÇ HESAPLAMASINI YAP - Kutlama platformu için özel kazanç
                    if (s_oGame && s_oGame.updateUIAfterLanding) {
                        console.log("🎉 Calculating celebration platform winnings...");
                        s_oGame.updateUIAfterLanding(landedPlatformIndex, true); // true = kutlama platformu
                    }
                    
                    // SONRA kutlama animasyonunu başlat
                    self.startCelebrationAnimation();
                    
                    // Congratulations popup göster - kullanıcı manuel cashout yapacak
                    setTimeout(function() {
                        console.log("🎉 Showing congratulations popup with manual cashout button...");
                        console.log("🎯 MANUAL CASHOUT MODE:");
                        console.log("   💰 User must click cashout button in congratulations popup");
                        console.log("   🏆 Player reached celebration platform successfully");
                        console.log("   🎮 Waiting for user interaction...");
                        
                        if (s_oGame && s_oGame.showCongratulationsPopup) {
                            s_oGame.showCongratulationsPopup();
                        } else {
                            console.error("❌ showCongratulationsPopup function not found!");
                        }
                        
                        // OTOMATİK CASHOUT KALDIRILDI - Kullanıcı popup'taki butona tıklayacak
                        console.log("🎉 Congratulations popup displayed - awaiting user cashout action");
                        
                    }, 2000); // 2 saniye kutlama animasyonu sonrası
                    
                    return; // Diğer işlemleri yapma - platform animasyonu yapılmaz ama kazanç hesaplandı
                }
                
                // PLATFORM ANİMASYON TESTİ KALDIRILDI - Sadece kutlama platformu dışında animasyon yapılmayacak
                console.log("🚫 Platform animation test removed - no animation for regular platforms");
                
                // CONTRACT BASED DECISION - Wait for blockchain result
                console.log("🎲 WAITING FOR CONTRACT DECISION - Platform", landedPlatformIndex + 1, "Platform index:", landedPlatformIndex);
                
                // SPECIAL CASE: First platform and celebration platform never fail
                const isFirstPlatform = (landedPlatformIndex === 0); // Platform 1 (first after starting log)
                const isEndingPlatform = (landedPlatformIndex === 7); // Celebration platform - SADECE INDEX 7
                
                // ÖNCELİKLE CONTRACT FAIL KONTROLÜ - Hangi platform olursa olsun contract failed ise shark attack
                if (window.walletManager && window.walletManager.isContractFailed && window.walletManager.isContractFailed()) {
                    console.log("💀 CONTRACT FAILED - Character landed on failed platform (ANY PLATFORM)");
                    _bFailedLanding = true;
                    // Contract fail durumunu temizle
                    window.walletManager.clearContractFailed();
                } else if (s_oGame && s_oGame.isContractRoundEnded && s_oGame.isContractRoundEnded()) {
                    console.log("💀 CONTRACT ROUND ENDED - Auto fail due to round end (ANY PLATFORM)");
                    _bFailedLanding = true;
                } else if (isFirstPlatform) {
                    // CONTRACT AKTİF VE İLK PLATFORM - Güvenli
                    console.log("🌟 FIRST PLATFORM - Contract active, always successful!");
                    _bFailedLanding = false;
                } else if (isEndingPlatform) {
                    // CONTRACT AKTİF VE KUTLAMA PLATFORM - Güvenli
                    console.log("🎉 CELEBRATION PLATFORM - Contract active, always successful!");
                    _bFailedLanding = false;
                } else {
                    // Check if we have a pending jump result from contract
                    var contractJumpResult = s_oGame.getContractJumpResult();
                    if (contractJumpResult !== null) {
                        if (contractJumpResult === false) {
                            console.log("💀 CONTRACT DECISION: JUMP FAILED - Round already ended by contract");
                            _bFailedLanding = true;
                            
                            // Contract already ended the round - no need to send additional transaction
                        } else {
                            console.log("✅ CONTRACT DECISION: JUMP SUCCESSFUL");
                            _bFailedLanding = false;
                        }
                        // Clear the result after using it
                        s_oGame.clearContractJumpResult();
                    } else {
                        // CONTRACT ROUND BITME KONTROLÜ - Eğer contract sonucu yoksa round bitmiş olabilir
                        console.log("⚠️ NO CONTRACT RESULT - Checking if round ended...");
                        
                        // Contract round bitmişse otomatik fail
                        if (s_oGame && s_oGame.isContractRoundEnded && s_oGame.isContractRoundEnded()) {
                            console.log("💀 CONTRACT ROUND ENDED - Auto fail due to round end");
                            _bFailedLanding = true;
                        } else {
                            // CONTRACT ROUND AKTİF AMA SONUÇ YOK - Bu durumda beklemeli
                            console.log("⚠️ CONTRACT ROUND ACTIVE - Waiting for contract result...");
                            _bFailedLanding = false; // Contract sonucunu bekliyoruz
                            
                            // Contract sonucu gelene kadar beklemeli - game over yapma
                            return; // Platform animasyonu yapma, contract sonucunu bekle
                        }
                    }
                }
                
                // OYUN DURUMU KONTROLÜ - Oyun bitmiş veya cashout yapılmışsa platform animasyonu yapma
                if (!s_oGame || !s_oGame.isGameStarted() || _bGameOver) {
                    console.log("Game ended or cashout - skipping platform animation and UI updates");
                    return; // Platform animasyonu ve UI güncellemesi yapma
                }
                // ÖNCE PLATFORM ANİMASYONU YAP - KAMERA TAKİP SİSTEMİNDEN ÖNCE!
                var obstacleManager = s_oGame.getObstacleManager();
                if (obstacleManager && obstacleManager.animatePlatform && s_oGame && !_bGameOver) {
                    console.log("✅ Calling animatePlatform for LANDED platform index:", landedPlatformIndex, "BEFORE camera movement");
                    
                    // Failed landing kontrolü - platform animasyonu başladığı anda shark attack başlat
                    if (_bFailedLanding) {
                        console.log("💀 FAILED LANDING DETECTED - Starting shark attack immediately with platform animation!");
                        
                        // Platform animasyonunu başlat (arka planda devam edecek)
                        obstacleManager.animatePlatform(landedPlatformIndex);
                        
                        // Shark attack'ı hemen başlat
                        setTimeout(function() {
                            console.log("Starting shark attack during platform animation!");
                            s_oGame.gameOver();
                        }, 100); // Çok kısa gecikme - platform animasyonu ile eş zamanlı
                        return; // Diğer işlemleri yapma
                    } else {
                        // Normal landing - platform animasyonunu normal şekilde başlat
                        obstacleManager.animatePlatform(landedPlatformIndex);
                    }
                    
                    // KARAKTERİ PLATFORM ANİMASYONU İLE SENKRONİZE ET
                    var platform = obstacleManager.getArray()[landedPlatformIndex];
                    if (platform) {
                        console.log("🎯 Platform found for animation - X:", platform.x, "Y:", platform.y);
                        // Karakter platform animasyonu ile senkronize bounce efekti
                        createjs.Tween.get(_oSprite, {loop: false})
                            .to({y: _oSprite.y - 15}, 200, createjs.Ease.quadOut)  // Yukarı zıpla
                            .to({y: _oSprite.y}, 200, createjs.Ease.quadIn);       // Normale dön
                    } else {
                        console.log("❌ Platform not found for animation - Index:", landedPlatformIndex);
                    }
                } else {
                    console.log("🚫 Platform animation skipped - game not started or not available");
                }
                
                // UI güncellemesi yukarıda yapıldı (multiplier hesaplaması için)
                    
                // YUMUŞAK KAMERA SİSTEMİ - 4. platforma geldiğinde kamera kaydırması
                console.log("🎮 SMOOTH CAMERA SYSTEM - Character at X:", _oSprite.x, "Platform number:", targetPlatformNumber);
                
                // 4. platforma indiğinde kamera kaydırmaya başla - Use targetPlatformNumber (1-based)
                if (targetPlatformNumber === 4) {
                    console.log("🎥 SMOOTH CAMERA - 4th platform reached! Moving 4th platform to first platform position");
                    console.log("🔍 CAMERA TRIGGER: targetPlatformNumber =", targetPlatformNumber, "targetPlatformIndex =", targetPlatformIndex);
                    
                    // Yumuşak kamera kaydırması - 1000px sola kaydır
                    // 4. platform (X:1150) → first platform konumuna (X:150) = 1000px fark
                    var smoothShift = -1000; // 4 platform mesafesi
                    
                    console.log("📐 POSITIONING: 4th platform (X:1150) will move to first position (X:150)");
                    console.log("📐 RESULT: Screen will show platforms 4-5-6-7-celebration");
                    
                    // TÜM DÜNYAYI YAVAŞÇA SOLA KAYDIR
                    if (obstacleManager) {
                        var platforms = obstacleManager.getArray();
                        for (var i = 0; i < platforms.length; i++) {
                            if (platforms[i]) {
                                console.log("📷 Camera shift: Moving platform", i + 1, "from X:", platforms[i].x, "to X:", platforms[i].x + smoothShift);
                                
                                // Yumuşak animasyon ile kaydır (1 saniye)
                                createjs.Tween.get(platforms[i])
                                    .to({x: platforms[i].x + smoothShift}, 1000, createjs.Ease.quadOut);
                            }
                        }
                        
                        // Multiplier text'lerini de yumuşak kaydır
                        if (obstacleManager.moveMultipliersLeft) {
                            console.log("📷 Camera shift: Moving multipliers left by:", smoothShift);
                            obstacleManager.moveMultipliersLeft(smoothShift);
                        }
                    }
                    
                    // İlk platformu da yumuşak kaydır
                    if (s_oGame && s_oGame.getStartingPlatform) {
                        var startingPlatform = s_oGame.getStartingPlatform();
                        if (startingPlatform) {
                            console.log("📷 Camera shift: Moving starting platform from X:", startingPlatform.x, "to X:", startingPlatform.x + smoothShift);
                            createjs.Tween.get(startingPlatform)
                                .to({x: startingPlatform.x + smoothShift}, 1000, createjs.Ease.quadOut);
                        }
                    }
                    
                    // Karakteri de yumuşak sola kaydır
                    console.log("📷 Camera shift: Moving character from X:", _oSprite.x, "to X:", _oSprite.x + smoothShift);
                    createjs.Tween.get(_oSprite)
                        .to({x: _oSprite.x + smoothShift}, 1000, createjs.Ease.quadOut);
                    
                    console.log("🎥 CAMERA SHIFT COMPLETE - Now showing platforms 4-5-6-7-celebration on screen");
                
                } else if (targetPlatformNumber < 4) {
                    console.log("🎮 Platforms 1-3 - no camera movement yet, waiting for 4th platform");
                } else {
                    console.log("🎮 Post-camera platforms - camera already shifted");
                }
                
                playSound("footstep", 1, false);
            });
        }
    };
    
    // Sürekli kazanç gösterme sistemi
    var _oWinningsText = null; // Kazanç text objesi
    
    // Toz efektleri için global array
    var _aDustEffects = []; // Aktif toz efektleri
    
    // Kazanç gösterme fonksiyonu - Sürekli görünür
    this.showWinningsDisplay = function(landingX, landingY) {
        // Kazanç miktarını hesapla
        var betAmount = s_oGame ? s_oGame.getBetAmount() : 1.0;
        var currentMultiplier = s_oGame ? s_oGame.getCurrentMultiplier() : 1.0;
        
        console.log("🔍 Winnings display debug - Bet:", betAmount, "Multiplier from game:", currentMultiplier);
        console.log("🔍 Game difficulty:", s_oGame ? s_oGame.getDifficulty() : "unknown");
        console.log("🔍 Expected vs actual - if Easy 1st platform should be 1.28x, if Hard should be 1.60x");
        
        // If multiplier is 0 or invalid, don't show winnings
        if (!currentMultiplier || currentMultiplier <= 1.0) {
            console.warn("⚠️ Invalid multiplier for winnings display:", currentMultiplier, "- Checking game state...");
            console.warn("🔍 Bet amount:", betAmount, "Game object:", !!s_oGame);
            if (s_oGame) {
                console.warn("🔍 Game started:", s_oGame.isGameStarted?.());
                console.warn("🔍 Current multiplier direct:", s_oGame.getCurrentMultiplier?.());
            }
            return;
        }
        
        // Toplam kazanç = bahis * multiplier
        var totalWinnings = betAmount * currentMultiplier;
        
        // Net kazanç = toplam kazanç - bahis (sadece kâr kısmı)
        var netWinnings = totalWinnings - betAmount;
        
        console.log("Winnings calculation - Bet:", betAmount, "Multiplier:", currentMultiplier.toFixed(2), "Total:", totalWinnings.toFixed(2), "Net:", netWinnings.toFixed(2));
        
        // Eğer önceki kazanç text'i varsa kaldır
        if (_oWinningsText) {
            s_oStage.removeChild(_oWinningsText);
        }
        
        
        // Yeni kazanç text'i oluştur
        _oWinningsText = new createjs.Text("+" + netWinnings.toFixed(2) + " MON", "bold 28px " + PRIMARY_FONT, "#00FF00");
        _oWinningsText.textAlign = "center";
        _oWinningsText.textBaseline = "middle";
        _oWinningsText.x = landingX; // İniş yapılan platform X pozisyonu
        _oWinningsText.y = landingY - 100; // Karakterin başının üzerinde (daha yukarı)
        _oWinningsText.alpha = 1; // Sürekli görünür
        _oWinningsText.shadow = new createjs.Shadow("#000000", 3, 3, 6); // Belirgin gölge
        
        // Stage'e ekle
        s_oStage.addChild(_oWinningsText);
        console.log("Persistent winnings text added at X:", _oWinningsText.x, "Y:", _oWinningsText.y);
        
        console.log("Persistent winnings display shown: +" + netWinnings.toFixed(1) + " MON");
    };
    
    // Kazanç text'ini karakterle birlikte hareket ettir
    this.updateWinningsPosition = function() {
        if (_oWinningsText && _oSprite) {
            // Karakterin başının üzerinde tut (daha yukarı)
            _oWinningsText.x = _oSprite.x;
            _oWinningsText.y = _oSprite.y - 100;
        }
    };
    
    // Kutlama animasyonu - karakter dans etsin
    // Kutlama animasyonu - karakter dans etsin
    this.startCelebrationAnimation = function() {
        console.log("🎉 Starting celebration animation with celebration.png spritesheet!");
        console.log("🎯 CELEBRATION ANIMATION STARTED:");
        console.log("   📍 Character position when animation starts: X:", _oSprite.x, "Y:", _oSprite.y);
        console.log("   🎪 Animation will play at character's current position");
        console.log("🎉 s_oSpriteLibrary:", s_oSpriteLibrary);
        console.log("🎉 Available sprites:", s_oSpriteLibrary ? Object.keys(s_oSpriteLibrary._aSprites || {}) : "No sprite library");
        
        // KUTLAMA ANİMASYONU AKTİF - Karakter kontrolünü devre dışı bırak
        _bCelebrationActive = true;
        console.log("🎉 Celebration animation activated - character control disabled");
        
        // ÖNCE KARAKTERİ GİZLE - Kutlama animasyonu sırasında görünmeyecek
        console.log("🎉 Hiding character for celebration animation...");
        _oSprite.alpha = 0; // Karakteri gizle
        // Celebration spritesheet'ini al
        var celebrationSprite = s_oSpriteLibrary.getSprite("celebration");
        console.log("🎉 Celebration sprite:", celebrationSprite);
        if (!celebrationSprite) {
            console.error("❌ Celebration sprite not found!");
            // Karakter gizlenmişse tekrar göster
            _oSprite.alpha = 1;
            return;
        }
        
        // Celebration spritesheet oluştur (16 frame, 4x4 grid, 2048x2048)
        var celebrationSheet = new createjs.SpriteSheet({
            images: [celebrationSprite],
            frames: [
                // 4x4 grid, her frame 512x512 (2048/4 = 512)
                [0, 0, 512, 512, 0, 256, 256],     // Frame 0
                [512, 0, 512, 512, 0, 256, 256],   // Frame 1
                [1024, 0, 512, 512, 0, 256, 256],  // Frame 2
                [1536, 0, 512, 512, 0, 256, 256],  // Frame 3
                [0, 512, 512, 512, 0, 256, 256],   // Frame 4
                [512, 512, 512, 512, 0, 256, 256], // Frame 5
                [1024, 512, 512, 512, 0, 256, 256], // Frame 6
                [1536, 512, 512, 512, 0, 256, 256], // Frame 7
                [0, 1024, 512, 512, 0, 256, 256],   // Frame 8
                [512, 1024, 512, 512, 0, 256, 256], // Frame 9
                [1024, 1024, 512, 512, 0, 256, 256], // Frame 10
                [1536, 1024, 512, 512, 0, 256, 256], // Frame 11
                [0, 1536, 512, 512, 0, 256, 256],   // Frame 12
                [512, 1536, 512, 512, 0, 256, 256], // Frame 13
                [1024, 1536, 512, 512, 0, 256, 256], // Frame 14
                [1536, 1536, 512, 512, 0, 256, 256]  // Frame 15
            ],
            animations: {
                celebration: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    speed: 0.5 // 2 frame per second
                }
            }
        });
        
        // Celebration sprite oluştur - 1.5 kat büyük, karakterin kutlama platformundaki konumunda
        var celebrationAnim = new createjs.Sprite(celebrationSheet, "celebration");
        // Karakterin mevcut konumunu kullan (kutlama platformuna indiği yer)
        celebrationAnim.x = _oSprite.x - 15; // Merkezle (512 * 1.5 / 4 = 192)
        celebrationAnim.y = _oSprite.y - 20; // Karakterin bulunduğu yerde
        celebrationAnim.scaleX = 0.75; // 1.5 kat büyük (512 * 0.75 = 384px)
        celebrationAnim.scaleY = 0.75; // 1.5 kat büyük (512 * 0.75 = 384px)
        
        console.log("🎯 CELEBRATION ANIMATION POSITIONED:");
        console.log("   📍 Animation X:", celebrationAnim.x, "(Character X:", _oSprite.x, "- 15)");
        console.log("   📍 Animation Y:", celebrationAnim.y, "(Character Y:", _oSprite.y, "- 20)");
        console.log("   📏 Animation scale:", celebrationAnim.scaleX, "x", celebrationAnim.scaleY);
        console.log("   🎪 Animation now playing for 5 seconds...");
        
        // Stage'e ekle
        s_oStage.addChild(celebrationAnim);
        
        // 5 saniye sonra animasyonu temizle ve karakteri tekrar göster
        setTimeout(function() {
            console.log("🎉 Celebration animation finished - showing character and congratulations popup");
            
            // Kutlama animasyonunu kaldır
            s_oStage.removeChild(celebrationAnim);
            
            // KARAKTERİ TEKRAR GÖSTER VE KONTROLÜ AKTİF ET
            _oSprite.alpha = 1;
            _bCelebrationActive = false; // Karakter kontrolünü tekrar aktif et
            console.log("🎉 Character shown again after celebration - control reactivated");
            
        }, 5000);
        
        // Kutlama text'i KALDIRILDI - artık gösterilmeyecek
        // var celebrationText = new createjs.Text("🎉 CELEBRATION! 🎉", "bold 24px " + PRIMARY_FONT, "#FFD700");
        // celebrationText.textAlign = "center";
        // celebrationText.textBaseline = "middle";
        // celebrationText.x = _oSprite.x;
        // celebrationText.y = _oSprite.y - 80;
        // celebrationText.shadow = new createjs.Shadow("#000000", 3, 3, 6);
        
        // s_oStage.addChild(celebrationText);
        
        // Text'i yukarı aşağı hareket ettir
        // createjs.Tween.get(celebrationText, {loop: true})
        //     .to({y: celebrationText.y - 20}, 500, createjs.Ease.quadOut)
        //     .to({y: celebrationText.y + 20}, 500, createjs.Ease.quadIn);
        
        // 5 saniye sonra kutlama animasyonunu durdur
        setTimeout(function() {
            createjs.Tween.removeTweens(_oSprite);
            // createjs.Tween.removeTweens(celebrationText); // Text kaldırıldı
            // s_oStage.removeChild(celebrationText); // Text kaldırıldı
            // _oSprite.x = originalX; // originalX tanımlı değil, kaldırıldı
            // _oSprite.y = originalY; // originalY tanımlı değil, kaldırıldı
            
            // Karakter tekrar görünür durumda olduğundan emin ol ve kontrolü aktif et
            _oSprite.alpha = 1;
            _bCelebrationActive = false; // Karakter kontrolünü tekrar aktif et
            console.log("🎉 Celebration animation cleanup complete - character control fully reactivated");
        }, 5000);
    };
    
    // Eski toz efektlerini temizle - PERFORMANS İYİLEŞTİRMESİ
    this.cleanupOldDustEffects = function() {
        var currentTime = Date.now();
        var maxAge = 2000; // 2 saniyeden eski efektleri temizle
        
        for (var i = _aDustEffects.length - 1; i >= 0; i--) {
            var dustEffect = _aDustEffects[i];
            if (dustEffect && dustEffect.createdTime && (currentTime - dustEffect.createdTime > maxAge)) {
                // Eski efekti temizle
                createjs.Tween.removeTweens(dustEffect);
                if (s_oStage.contains(dustEffect)) {
                    s_oStage.removeChild(dustEffect);
                }
                _aDustEffects.splice(i, 1);
                console.log("🧹 Eski toz efekti temizlendi - Kalan:", _aDustEffects.length);
            }
        }
    };

    // Tüm toz efektlerini temizle - AGRESIF TEMİZLEME
    this.clearAllDustEffects = function() {
        console.log("🧹 AGGRESSIVE DUST CLEANUP - Count:", _aDustEffects.length);
        
        // Önce tüm tween'leri durdur
        for (var i = 0; i < _aDustEffects.length; i++) {
            var dustEffect = _aDustEffects[i];
            if (dustEffect) {
                createjs.Tween.removeTweens(dustEffect);
                if (s_oStage.contains(dustEffect)) {
                    s_oStage.removeChild(dustEffect);
                }
            }
        }
        
        // Array'i tamamen temizle
        _aDustEffects.length = 0; // Daha hızlı array temizleme
        _aDustEffects = []; // Çift güvenlik
        
        // Stage'deki tüm dust efektlerini manuel olarak temizle (güvenlik için)
        var stageChildren = s_oStage.children.slice(); // Kopya oluştur
        for (var j = 0; j < stageChildren.length; j++) {
            var child = stageChildren[j];
            if (child && child.graphics && child.graphics._fill && child.graphics._fill.style) {
                // Dust efekti benzeri objeler (beyaz daireler)
                if (child.graphics._fill.style.indexOf("255, 255, 255") !== -1) {
                    s_oStage.removeChild(child);
                    createjs.Tween.removeTweens(child);
                }
            }
        }
        
        console.log("🧹 AGGRESSIVE CLEANUP COMPLETE - All dust effects removed");
    };

    // Kazanç text'ini temizle
    this.clearWinningsDisplay = function() {
        if (_oWinningsText) {
            s_oStage.removeChild(_oWinningsText);
            _oWinningsText = null;
            console.log("Winnings display cleared");
        }
    };
    
    // NEW: Update winnings display with current game multiplier (called from CGame.js)
    this.updateWinningsDisplay = function() {
        if (!s_oGame) {
            console.warn("⚠️ Cannot update winnings - no game reference");
            return;
        }
        
        var betAmount = s_oGame.getBetAmount();
        var currentMultiplier = s_oGame.getCurrentMultiplier();
        
        console.log("🔄 updateWinningsDisplay called - Bet:", betAmount, "Multiplier:", currentMultiplier);
        console.log("🔄 Platform-based real-time calculation!");
        
        if (!currentMultiplier || currentMultiplier <= 1.0) {
            console.warn("⚠️ Invalid multiplier for update:", currentMultiplier);
            return;
        }
        
        // Calculate net winnings (profit only)
        var totalWinnings = betAmount * currentMultiplier;
        var netWinnings = totalWinnings - betAmount;
        
        console.log("🔄 Updated winnings calculation - Total:", totalWinnings.toFixed(2), "Net:", netWinnings.toFixed(2));
        
        // Remove existing winnings text
        if (_oWinningsText && s_oStage) {
            s_oStage.removeChild(_oWinningsText);
        }
        
        // Create new winnings text with updated value
        _oWinningsText = new createjs.Text("+" + netWinnings.toFixed(2) + " MON", "bold 28px " + PRIMARY_FONT, "#00FF00");
        _oWinningsText.textAlign = "center";
        _oWinningsText.x = _oSprite.x;
        _oWinningsText.y = _oSprite.y - 60; // Above character
        _oWinningsText.alpha = 1.0;
        
        // Add to stage
        if (s_oStage) {
            s_oStage.addChild(_oWinningsText);
            
            // Keep it visible (no fade out for persistent display)
            console.log("✅ Winnings display updated with new value:", netWinnings.toFixed(2), "MON");
        }
    };

    this.init(iX, iY, oSprite);
}