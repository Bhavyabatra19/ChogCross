function CMenu() {
    var _oBg;
    var _oButPlay;
    var _oFade;
    var _oAudioToggle;
    var _oButCredits;
    var _oButLeaderboard;
    var _oCreditsPanel = null;
    var _oHowToPanel = null;
    var _oLeaderboardPanel = null;
    var _oOnlineIndicator = null;
    var _oButFullscreen;
    var _fRequestFullScreen = null;
    var _fCancelFullScreen = null;

    var _pStartPosAudio;
    var _pStartPosCredits;
    var _pStartPosLeaderboard;
    var _pStartPosFullscreen;

    this._init = function () {
        _oBg = createBitmap(s_oSpriteLibrary.getSprite('bg_menu'));
        // Arka planı tam ekrana stretch et
        _oBg.x = CANVAS_WIDTH/2;
        _oBg.y = CANVAS_HEIGHT/2;
        _oBg.regX = _oBg.getBounds().width/2;
        _oBg.regY = _oBg.getBounds().height/2;
        var scaleX = CANVAS_WIDTH / _oBg.getBounds().width;
        var scaleY = CANVAS_HEIGHT / _oBg.getBounds().height;
        _oBg.scaleX = scaleX; // X eksenini tam stretch et
        _oBg.scaleY = scaleY; // Y eksenini tam stretch et
        s_oStage.addChild(_oBg);

        // Fade efektini önce oluştur ama henüz stage'e ekleme
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        var oSpritePlay = s_oSpriteLibrary.getSprite('but_play');
        _oButPlay = new CGfxButton(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150, oSpritePlay);
        _oButPlay.addEventListener(ON_MOUSE_UP, this._onButPlayRelease, this);
        
        // Leaderboard button disabled - using SVG menu system instead
        // var oSpriteLeaderboard = s_oSpriteLibrary.getSprite('but_leaderboard');
        // _pStartPosLeaderboard = {x: CANVAS_WIDTH - 100 - oSpriteLeaderboard.width/2, y: 71 + oSpriteLeaderboard.height/2}; // 30px daha aşağı kaydırdık (41 + 30)
        // _oButLeaderboard = new CGfxButton(_pStartPosLeaderboard.x, _pStartPosLeaderboard.y, oSpriteLeaderboard);
        // _oButLeaderboard.addEventListener(ON_MOUSE_UP, this._onLeaderboard, this);
        
        // Initialize online player indicator
        if (window.OnlinePlayerIndicator) {
            _oOnlineIndicator = new OnlinePlayerIndicator();
            _oOnlineIndicator.show();
        }
        
        var doc = window.document;
        var docEl = doc.documentElement;
        _fRequestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        _fCancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
        
        if(ENABLE_FULLSCREEN === false){
            _fRequestFullScreen = false;
        }
        
        // Credits button - En solda (Basit bitmap yaklaşımı)
        // Credits button disabled - using SVG menu system instead
        // var oSpriteCredits = s_oSpriteLibrary.getSprite('but_credits');
        // _pStartPosCredits = {x: 50 + oSpriteCredits.width/2, y: 90 + oSpriteCredits.height/2}; // 30px daha aşağı kaydırdık (60 + 30)
        // _oButCredits = new CGfxButton(_pStartPosCredits.x, _pStartPosCredits.y, oSpriteCredits);
        // _oButCredits.addEventListener(ON_MOUSE_UP, this._onHowTo, this);
        
        // Audio button disabled - using SVG menu system instead
        // if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        //     var oSpriteAudio = s_oSpriteLibrary.getSprite('audio_icon');
        //     
        //     // Sprite sheet oluştur
        //     var oAudioData = {
        //         images: [oSpriteAudio],
        //         frames: {width: oSpriteAudio.width / 2, height: oSpriteAudio.height, regX: (oSpriteAudio.width / 2) / 2, regY: oSpriteAudio.height / 2},
        //         animations: {state_true: [0], state_false: [1]}
        //     };
        //     var oAudioSpriteSheet = new createjs.SpriteSheet(oAudioData);
        //     
        //     _oAudioToggle = new createjs.Sprite(oAudioSpriteSheet, s_bAudioActive ? "state_true" : "state_false");
        //     _oAudioToggle.x = CANVAS_WIDTH/2; // Ekranın ortasına geri al
        //     _oAudioToggle.y = 90 + oSpriteAudio.height/2; // 30px daha aşağı kaydırdık (60 + 30)
        //     _oAudioToggle.cursor = "pointer";
        //     _oAudioToggle.stop();
        //     
        //     // HitArea tanımla - tek frame boyutuna göre, mobil için 3 katına çıkar
        //     _oAudioToggle.hitArea = new createjs.Shape();
        //     var hitWidth = oSpriteAudio.width / 2; // Tek frame genişliği
        //     var hitHeight = oSpriteAudio.height;
        //     var audioMultiplier = s_bMobile ? 3 : 2; // Mobilde 3 kat, masaüstünde 2 kat
        //     _oAudioToggle.hitArea.graphics.beginFill("#000").drawRect(-hitWidth * audioMultiplier/2, -hitHeight * audioMultiplier/2, hitWidth * audioMultiplier, hitHeight * audioMultiplier);
        //     
        //     s_oStage.addChild(_oAudioToggle);
        //     
        //     _oAudioToggle.on("pressup", function() {
        //         console.log("🔊 Audio button clicked!");
        //         playSound("click", 1, false);
        //         s_bAudioActive = !s_bAudioActive;
        //         _oAudioToggle.gotoAndStop(s_bAudioActive ? "state_true" : "state_false");
        //         Howler.mute(!s_bAudioActive);
        //     });
        // }
        
        // Fullscreen button disabled - using SVG menu system instead
        // if (_fRequestFullScreen && screenfull.enabled){
        //     var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
        //     
        //     // Sprite sheet oluştur
        //     var oFullscreenData = {
        //         images: [oSpriteFullscreen],
        //         frames: {width: oSpriteFullscreen.width / 2, height: oSpriteFullscreen.height, regX: (oSpriteFullscreen.width / 2) / 2, regY: oSpriteFullscreen.height / 2},
        //         animations: {state_true: [1], state_false: [0]}
        //     };
        //     var oFullscreenSpriteSheet = new createjs.SpriteSheet(oFullscreenData);
        //     
        //     _oButFullscreen = new createjs.Sprite(oFullscreenSpriteSheet, s_bFullscreen ? "state_true" : "state_false");
        //     _oButFullscreen.x = CANVAS_WIDTH - 50 - oSpriteFullscreen.width/4;
        //     _oButFullscreen.y = 90 + oSpriteFullscreen.height/2; // 30px daha aşağı kaydırdık (60 + 30)
        //     _oButFullscreen.cursor = "pointer";
        //     _oButFullscreen.stop();
        //     
        //     // HitArea tanımla - tek frame boyutuna göre, mobil için 3 katına çıkar, 30px sola kaydır
        //     _oButFullscreen.hitArea = new createjs.Shape();
        //     var hitWidth = oSpriteFullscreen.width / 2; // Tek frame genişliği
        //     var hitHeight = oSpriteFullscreen.height;
        //     var fullscreenMultiplier = s_bMobile ? 3 : 2; // Mobilde 3 kat, masaüstünde 2 kat
        //     _oButFullscreen.hitArea.graphics.beginFill("#000").drawRect(-hitWidth * fullscreenMultiplier/2 - 30, -hitHeight * fullscreenMultiplier/2, hitWidth * fullscreenMultiplier, hitHeight * fullscreenMultiplier);
        //     
        //     s_oStage.addChild(_oButFullscreen);
        //     
        //     _oButFullscreen.on("pressup", function() {
        //         console.log("📺 Fullscreen button clicked!");
        //         playSound("click", 1, false);
        //         s_bFullscreen = !s_bFullscreen;
        //         _oButFullscreen.gotoAndStop(s_bFullscreen ? "state_true" : "state_false");
        //         try {
        //             if(s_bFullscreen) {
        //                 _fRequestFullScreen.call(window.document.documentElement);
        //             }else{
        //                 _fCancelFullScreen.call(window.document);
        //             }
        //         } catch (error) {
        //             console.log("Fullscreen error:", error);
        //         }
        //         sizeHandler();
        //     });
        // }
        
        // Fade efektini butonlardan sonra stage'e ekle (en üstte olması için)
        s_oStage.addChild(_oFade);

        createjs.Tween.get(_oFade).to({alpha: 0}, 1000).call(function () {
            s_oStage.removeChild(_oFade);
        });
        if(!s_bStorageAvailable){

            new CMsgBox(TEXT_ERR_LS,s_oStage);
        }else{
            var iBestScore = getItem("best_score");
            if(iBestScore !== null ){
                s_iBestScore = iBestScore;
            }
        }
        
        this.refreshButtonPos(s_iOffsetX, s_iOffsetY);
    };

        this.unload = function () {
            _oButPlay.unload();
            _oButPlay = null;
    
            // Buttons disabled - using SVG menu system instead
            // _oButCredits.unload();
            // _oButCredits = null;
            
            // if (_oButLeaderboard) {
            //     _oButLeaderboard.unload();
            //     _oButLeaderboard = null;
            // }
            
            if (_oOnlineIndicator) {
                _oOnlineIndicator.unload();
                _oOnlineIndicator = null;
            }
            
            s_oStage.removeChild(_oBg);
            _oBg = null;
    
            // Buttons disabled - using SVG menu system instead
            // if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
            //     s_oStage.removeChild(_oAudioToggle);
            //     _oAudioToggle = null;
            // }
            // if (_fRequestFullScreen && screenfull.enabled){
            //     s_oStage.removeChild(_oButFullscreen);
            //     _oButFullscreen = null;
            // }
            s_oMenu = null;
        };

    this.refreshButtonPos = function (iNewX, iNewY) {
        // Credits button - Disabled, using SVG menu system instead
        // var oSpriteCredits = s_oSpriteLibrary.getSprite('but_credits');
        // _oButCredits.setPosition(50 + oSpriteCredits.width/2, 90 + oSpriteCredits.height/2);
        
        // Audio button - Disabled, using SVG menu system instead
        // if (DISABLE_SOUND_MOBILE === false || s_bMobile === false) {
        //     var oSpriteAudio = s_oSpriteLibrary.getSprite('audio_icon');
        //     _oAudioToggle.x = CANVAS_WIDTH/2;
        //     _oAudioToggle.y = 90 + oSpriteAudio.height/2;
        // }
        
        // Fullscreen button - Disabled, using SVG menu system instead
        // if (_fRequestFullScreen && screenfull.enabled){
        //     var oSpriteFullscreen = s_oSpriteLibrary.getSprite('but_fullscreen');
        //     _oButFullscreen.x = CANVAS_WIDTH - 50 - oSpriteFullscreen.width/4;
        //     _oButFullscreen.y = 90 + oSpriteFullscreen.height/2;
        // }
        
        // Play button position update
        if (_oButPlay) {
            _oButPlay.setPosition(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150);
        }
    };
    
    this.exitFromCredits = function(){
        _oCreditsPanel = null;
    };
    
    this.exitFromHowTo = function(){
        _oHowToPanel = null;
    };

    this._onAudioToggle = function (bActive) {
        console.log("🔊 Audio button clicked! New state:", bActive);
        s_bAudioActive = bActive;
        Howler.mute(!s_bAudioActive);
    };
    
    this._onCredits = function(){
        // HowTo paneli açıkken Credits açılmasını engelle
        if (_oHowToPanel !== null) {
            console.log("⚠️ HowTo panel açıkken Credits açılamaz!");
            return;
        }
        _oCreditsPanel = new CCreditsPanel();
    };
    
    this._onHowTo = function(){
        console.log("🎮 Credits button clicked!");
        // Credits paneli açıkken HowTo açılmasını engelle
        if (_oCreditsPanel !== null) {
            console.log("⚠️ Credits panel açıkken HowTo açılamaz!");
            return;
        }
        _oHowToPanel = new CHowToPanel();
    };
    

    this._onLeaderboard = function(){
        console.log("🏆 New Leaderboard button clicked!");
        _oLeaderboardPanel = new CLeaderboardNew();
        _oLeaderboardPanel.show();
    };

    this._onButPlayRelease = function () {
        console.log("🎮 Play button clicked! Starting game...");
        this.unload();
        if (isIOS() && s_oSoundTrack === null) {
            s_oSoundTrack = playSound("soundtrack", 0.2,true);
        }
        
        s_oMain.gotoGame();
    };
    
    
    this.resetFullscreenBut = function(){
        // Fullscreen button disabled - using SVG menu system instead
        // if (_fRequestFullScreen && screenfull.enabled){
        //     _oButFullscreen.gotoAndStop(s_bFullscreen ? "state_true" : "state_false");
        // }
    };
    s_oMenu = this;

    this._init();
}

var s_oMenu = null;