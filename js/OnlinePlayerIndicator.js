/**
 * Online Player Count Indicator
 * Shows how many players are currently online with a green light indicator
 */
function OnlinePlayerIndicator() {
    var _oContainer;
    var _oPlayerIcon;
    var _oGreenLight;
    var _oPlayerCount;
    var _bIsVisible = false;
    var _iUpdateInterval = null;
    
    this._init = function() {
        _oContainer = new createjs.Container();
        _oContainer.x = CANVAS_WIDTH - 1150;
        _oContainer.y = 570;
        _oContainer.alpha = 0;
        
        this._createPlayerIcon();
        this._createGreenLight();
        this._createPlayerCount();
        
        if (typeof s_oStage !== 'undefined' && s_oStage) {
            s_oStage.addChild(_oContainer);
        } else {
            console.error("❌ s_oStage not available for OnlinePlayerIndicator");
        }
        
        // Start updating player count
        this._startUpdating();
        
        console.log("👥 Online Player Indicator initialized");
    };
    
    this._createPlayerIcon = function() {
        // Use emoji for player icon - tek siluet kişi
        // Options: 👤 👥 🎮 🕹️ 🎯 🏆 🎪 🎭 🎨 🎪 🎫 🎬 🎤 🎧 🎵 🎶
        _oPlayerIcon = new createjs.Text("👤", "24px Arial", "#FFFFFF");
        _oPlayerIcon.textAlign = "center";
        _oPlayerIcon.textBaseline = "middle";
        _oPlayerIcon.x = 0;
        _oPlayerIcon.y = 0;
        
        console.log("👤 Using emoji for player icon");
        _oContainer.addChild(_oPlayerIcon);
    };
    
    this._createGreenLight = function() {
        // Green light indicator
        _oGreenLight = new createjs.Shape();
        _oGreenLight.graphics.beginFill("#00FF00").drawCircle(0, 0, 4);
        
        // Position relative to emoji icon
        _oGreenLight.x = 20;
        _oGreenLight.y = -8;
        
        // Add pulsing animation
        this._startPulsingAnimation();
        
        _oContainer.addChild(_oGreenLight);
    };
    
    this._createPlayerCount = function() {
        // Player count text
        _oPlayerCount = new createjs.Text("0", "bold 14px Arial", "#FFFFFF");
        
        // Position relative to emoji icon
        _oPlayerCount.x = 30;
        _oPlayerCount.y = -5;
        
        _oPlayerCount.textAlign = "left";
        _oPlayerCount.textBaseline = "middle";
        
        _oContainer.addChild(_oPlayerCount);
    };
    
    this._startPulsingAnimation = function() {
        // Pulsing green light animation
        createjs.Tween.get(_oGreenLight, {loop: true})
            .to({alpha: 0.3}, 1000, createjs.Ease.quadInOut)
            .to({alpha: 1}, 1000, createjs.Ease.quadInOut);
    };
    
    this._startUpdating = function() {
        // Update player count every 30 seconds
        this._updatePlayerCount();
        
        _iUpdateInterval = setInterval(function() {
            this._updatePlayerCount();
        }.bind(this), 30000);
    };
    
    this._updatePlayerCount = function() {
        if (window.socialFeatures && window.socialFeatures.isInitialized()) {
            var playerCount = window.socialFeatures.getOnlinePlayerCount();
            _oPlayerCount.text = playerCount.toString();
            
            // Add some visual feedback when count updates
            createjs.Tween.get(_oPlayerCount)
                .to({scaleX: 1.2, scaleY: 1.2}, 200)
                .to({scaleX: 1, scaleY: 1}, 200);
        }
    };
    
    this.show = function() {
        if (!_bIsVisible) {
            _bIsVisible = true;
            createjs.Tween.get(_oContainer).to({alpha: 1}, 500, createjs.Ease.quadOut);
            console.log("👥 Online Player Indicator shown");
        }
    };
    
    this.hide = function() {
        if (_bIsVisible) {
            _bIsVisible = false;
            createjs.Tween.get(_oContainer).to({alpha: 0}, 300, createjs.Ease.quadIn);
            console.log("👥 Online Player Indicator hidden");
        }
    };
    
    this.isVisible = function() {
        return _bIsVisible;
    };
    
    this.unload = function() {
        if (_iUpdateInterval) {
            clearInterval(_iUpdateInterval);
            _iUpdateInterval = null;
        }
        
        if (_oContainer && typeof s_oStage !== 'undefined' && s_oStage && s_oStage.contains(_oContainer)) {
            s_oStage.removeChild(_oContainer);
        }
        
        console.log("👥 Online Player Indicator unloaded");
    };
    
    this._init();
}
