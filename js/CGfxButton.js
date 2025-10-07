function CGfxButton(iXPos, iYPos, oSprite, oParentContainer) {
    var _bDisable;
    var _aCbCompleted;
    var _aCbOwner;
    var _oButton;
    var _aParams;
    var _fScaleX;
    var _fScaleY;
    var _oParent;
    var _oTween;
    var _oMouseDown;
    var _oMouseUp;

    var _oParentContainer;

    this._init = function (iXPos, iYPos, oSprite, oParentContainer) {
        _bDisable = false;
        _aCbCompleted = new Array();
        _aCbOwner = new Array();
        _aParams = new Array();

        _oButton = createBitmap(oSprite);
        _oButton.x = iXPos;
        _oButton.y = iYPos;
        _oButton.regX = oSprite.width / 2;
        _oButton.regY = oSprite.height / 2;

        _fScaleX = 1;
        _fScaleY = 1;

        // HitArea tanımla - çok daha büyük tıklama alanları
        _oButton.hitArea = new createjs.Shape();
        var multiplier = s_bMobile ? 6 : 4; // Mobilde 6 kat, masaüstünde 4 kat (çok daha büyük)
        _oButton.hitArea.graphics.beginFill("#000").drawRect(-oSprite.width * multiplier/2, -oSprite.height * multiplier/2, oSprite.width * multiplier, oSprite.height * multiplier);
        
        // Minimum tıklama alanı boyutu (en az 80x80 pixel)
        var minSize = 80;
        var hitWidth = Math.max(oSprite.width * multiplier, minSize);
        var hitHeight = Math.max(oSprite.height * multiplier, minSize);
        _oButton.hitArea.graphics.clear().beginFill("#000").drawRect(-hitWidth/2, -hitHeight/2, hitWidth, hitHeight);

        if (!s_bMobile)
            _oButton.cursor = "pointer";

        // Container kontrolü - eğer tanımlı değilse stage'e ekle
        if (oParentContainer) {
            oParentContainer.addChild(_oButton);
        } else {
            s_oStage.addChild(_oButton);
        }

        this._initListener();
    };

    this.unload = function () {
        _oButton.off("mousedown", _oMouseDown);
        _oButton.off("pressup", _oMouseUp);

        // Container kontrolü - eğer tanımlı değilse stage'den kaldır
        if (_oParentContainer) {
            _oParentContainer.removeChild(_oButton);
        } else {
            s_oStage.removeChild(_oButton);
        }
    };

    this.setVisible = function (bVisible) {
        _oButton.visible = bVisible;
    };

    this.setCursorType = function (szValue) {
        _oButton.cursor = szValue;
    };

    this._initListener = function () {
        _oMouseDown = _oButton.on("mousedown", this.buttonDown);
        _oMouseUp = _oButton.on("pressup", this.buttonRelease);
    };

    this.addEventListener = function (iEvent, cbCompleted, cbOwner) {
        _aCbCompleted[iEvent] = cbCompleted;
        _aCbOwner[iEvent] = cbOwner;
    };

    this.addEventListenerWithParams = function (iEvent, cbCompleted, cbOwner, aParams) {
        _aCbCompleted[iEvent] = cbCompleted;
        _aCbOwner[iEvent] = cbOwner;
        _aParams[iEvent] = aParams;
    };
    
    this.enable = function(){
        _bDisable = false;
    };
    
    this.disable = function(){
        _bDisable = true;
    };
    
    this.buttonRelease = function () {

        if(_bDisable){
            return;
        }

        if (_fScaleX > 0) {
            _oButton.scaleX = 1;
        } else {
            _oButton.scaleX = -1;
        }
        _oButton.scaleY = 1;

        playSound("click", 1, false);

        if (_aCbCompleted[ON_MOUSE_UP]) {
            _aCbCompleted[ON_MOUSE_UP].call(_aCbOwner[ON_MOUSE_UP], _aParams[ON_MOUSE_UP]);
        }
    };

    this.buttonDown = function () {
        if(_bDisable){
            return;
        }

        if (_fScaleX > 0) {
            _oButton.scaleX = 0.9;
        } else {
            _oButton.scaleX = -0.9;
        }
        _oButton.scaleY = 0.9;

        if (_aCbCompleted[ON_MOUSE_DOWN]) {
            _aCbCompleted[ON_MOUSE_DOWN].call(_aCbOwner[ON_MOUSE_DOWN], _aParams[ON_MOUSE_DOWN]);
        }
    };

    this.rotation = function (iRotation) {
        _oButton.rotation = iRotation;
    };

    this.getButton = function () {
        return _oButton;
    };

    this.setPosition = function (iXPos, iYPos) {
        _oButton.x = iXPos;
        _oButton.y = iYPos;
    };

    this.setX = function (iXPos) {
        _oButton.x = iXPos;
    };

    this.setY = function (iYPos) {
        _oButton.y = iYPos;
    };

    this.getButtonImage = function () {
        return _oButton;
    };

    this.setScaleX = function (fValue) {
        _oButton.scaleX = fValue;
        _fScaleX = fValue;
    };

    this.getX = function () {
        return _oButton.x;
    };

    this.getY = function () {
        return _oButton.y;
    };

    this.pulseAnimation = function () {
        _oTween = createjs.Tween.get(_oButton).to({scaleX: _fScaleX * 0.9, scaleY: _fScaleY * 0.9}, 850, createjs.Ease.quadOut).to({scaleX: _fScaleX, scaleY: _fScaleY}, 650, createjs.Ease.quadIn).call(function () {
            _oParent.pulseAnimation();
        });
    };

    this.trebleAnimation = function () {
        _oTween = createjs.Tween.get(_oButton).to({rotation: 5}, 75, createjs.Ease.quadOut).to({rotation: -5}, 140, createjs.Ease.quadIn).to({rotation: 0}, 75, createjs.Ease.quadIn).wait(750).call(function () {
            _oParent.trebleAnimation();
        });
    };

    this.removeAllTweens = function () {
        createjs.Tween.removeTweens(_oButton);
    };

    if (oParentContainer !== undefined) {

        _oParentContainer = oParentContainer;
    } else {
        _oParentContainer = s_oStage;
    }

    this._init(iXPos, iYPos, oSprite, _oParentContainer);

    _oParent = this;

    return this;
}