function CSeaAnimation() {
    var _oSprite;
    var _iCurFrame;
    var _iNumFrames;
    var _iSpeed;
    var _iX;
    var _iY;
    
    this._init = function() {
        _iCurFrame = 0;
        _iNumFrames = 8; // Sprite sheet'teki frame sayısı
        _iSpeed = 0.1; // Animasyon hızı
        _iX = 0;
        _iY = CANVAS_HEIGHT - 200; // Ekranın alt kısmında
        
        // Sprite sheet'ten frame oluştur
        _oSprite = new createjs.Bitmap(s_oSpriteLibrary.getSprite("seasprite"));
        _oSprite.x = _iX;
        _oSprite.y = _iY;
        _oSprite.scaleX = CANVAS_WIDTH / 800; // Sprite sheet genişliği
        _oSprite.scaleY = 200 / 200; // Sprite sheet yüksekliği
        
        s_oStage.addChild(_oSprite);
    };
    
    this.update = function() {
        _iCurFrame += _iSpeed;
        if (_iCurFrame >= _iNumFrames) {
            _iCurFrame = 0;
        }
        
        // Sprite sheet'ten doğru frame'i göster
        var iFrameX = Math.floor(_iCurFrame) * 100; // Her frame 100px genişlik
        _oSprite.sourceRect = new createjs.Rectangle(iFrameX, 0, 100, 200);
    };
    
    this.unload = function() {
        s_oStage.removeChild(_oSprite);
    };
    
    this._init();
}
