function CEndPanel(iScore){
    var _oBg;
    var _oFade;
    var _oButExit;
    var _oButRestart;
    var _oScoreText;
    var _oScoreOutline;
    var _oBestScoreText;
    var _oBestScoreOutline;
    var _oThis;

    var _oContainer;
    var _oFadeContainer;
    
    this._init = function(){
        _oContainer = new createjs.Container();
        _oFadeContainer = new createjs.Container();
        s_oStage.addChild(_oFadeContainer);
        s_oStage.addChild(_oContainer);
        _oFade = new createjs.Shape();
        _oFade.graphics.beginFill("black").drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        _oFade.alpha = 0.01;
        _oBg = createBitmap(s_oSpriteLibrary.getSprite("msg_box"));
        _oFadeContainer.addChild(_oFade);
        _oContainer.addChild(_oBg);

        _oScoreText = new createjs.Text(TEXT_YOUR_SCORE+": "+s_oGame.getScore(), "54px " + PRIMARY_FONT, "#d99b01");
        _oScoreOutline = new createjs.Text(TEXT_YOUR_SCORE+": "+s_oGame.getScore(), "54px " + PRIMARY_FONT, "#000");
        if(getItem(SCORE_ITEM_NAME)  !== null)
			if(getItem(SCORE_ITEM_NAME) > s_oGame.getScore()) {
                _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": " + getItem(SCORE_ITEM_NAME), "58px " + PRIMARY_FONT, "#d99b01");
                _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": " + getItem(SCORE_ITEM_NAME), "58px " + PRIMARY_FONT, "#000000");
            }
			else {
                _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": " + s_oGame.getScore(), "58px " + PRIMARY_FONT, "#d99b01");
                _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": " + s_oGame.getScore(), "58px " + PRIMARY_FONT, "#000000");
            }
        else {
            _oBestScoreText = new createjs.Text(TEXT_BEST_SCORE + ": 0", "58px " + PRIMARY_FONT, "#d99b01");
            _oBestScoreOutline = new createjs.Text(TEXT_BEST_SCORE + ": 0", "58px " + PRIMARY_FONT, "#000");
        }
        _oScoreText.textAlign = "center";
        _oScoreText.textBaseline = "alphabetic";
        _oScoreText.x = _oContainer.getBounds().width/2 ;
        _oScoreText.y = 100;
        _oScoreOutline.textAlign = "center";
        _oScoreOutline.textBaseline = "alphabetic";
        _oScoreOutline.x = _oContainer.getBounds().width/2 ;
        _oScoreOutline.y = 100;
        _oScoreOutline.outline = 3;
        _oBestScoreText.textAlign = "center";
        _oBestScoreText.textBaseline = "alphabetic";
        _oBestScoreText.x = _oContainer.getBounds().width/2;
        _oBestScoreText.y = 170;
        _oBestScoreOutline.textAlign = "center";
        _oBestScoreOutline.textBaseline = "alphabetic";
        _oBestScoreOutline.x = _oContainer.getBounds().width/2;
        _oBestScoreOutline.y = 170;
        _oBestScoreOutline.outline = 3;

        _oContainer.addChild(_oBestScoreOutline);
        _oContainer.addChild(_oBestScoreText);
        _oContainer.addChild(_oScoreOutline);
        _oContainer.addChild(_oScoreText);

        
        // Create HTML buttons instead of sprite buttons
        this._createHTMLButtons();
       _oContainer.x = CANVAS_WIDTH/2 - _oContainer.getBounds().width/2;
        _oContainer.y = - _oContainer.getBounds().height;
        
    };
    
    this.unload = function(){
        // Remove HTML buttons
        this._removeHTMLButtons();
        
        s_oStage.removeChild(_oContainer);
        s_oStage.removeChild(_oFadeContainer);
    };
    this.show = function ()
    {
        new createjs.Tween.get(_oFade).to({alpha: 0.8}, 1000);
      	new createjs.Tween.get(_oContainer).to({y: 500}, 1000, createjs.Ease.bounceOut);
        _oScoreText.text = TEXT_YOUR_SCORE + " :" + s_oGame.getScore();
        _oScoreOutline.text = TEXT_YOUR_SCORE+ " :" + s_oGame.getScore();
		if(getItem(SCORE_ITEM_NAME)  !== null)
			if(getItem(SCORE_ITEM_NAME) < s_oGame.getScore()) {
		_oBestScoreText.text = TEXT_BEST_SCORE + " :" + s_oGame.getScore();
        _oBestScoreOutline.text = TEXT_BEST_SCORE+ " :" + s_oGame.getScore();
		}
		else {
			_oBestScoreText.text = TEXT_BEST_SCORE + " :" + getItem(SCORE_ITEM_NAME);
			_oBestScoreOutline.text = TEXT_BEST_SCORE+ " :" + getItem(SCORE_ITEM_NAME);
		}
		
		// Show buttons after panel animation
		setTimeout(function(){
		    if (_oThis._buttonContainer) {
		        _oThis._buttonContainer.style.display = 'flex';
		    }
		}, 1000);
    };
    
    this._onExit = function(){
        _oThis.unload();
        s_oGame.onExit();
    };
    
    this._onRestart = function(){
        _oThis.unload();
        s_oGame.restart();
    };
    
    this._createHTMLButtons = function(){
        // Create HTML button container positioned relative to the game over panel
        var buttonContainer = document.createElement('div');
        buttonContainer.id = 'game-over-buttons';
        buttonContainer.style.cssText = `
            position: absolute;
            top: 250px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: none;
            gap: 20px;
            justify-content: center;
            align-items: center;
        `;
        
        // Create PLAY AGAIN button
        var playAgainBtn = document.createElement('button');
        playAgainBtn.id = 'play-again-btn';
        playAgainBtn.className = 'action-btn primary game-over-btn';
        playAgainBtn.textContent = 'PLAY AGAIN';
        playAgainBtn.style.cssText = `
            font-family: 'Orbitron', monospace;
            font-size: 18px;
            font-weight: 700;
            padding: 15px 25px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid #FFD700;
            background: #FFD700;
            color: #000;
            min-width: 150px;
            min-height: 50px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        // Create BACK TO MENU button
        var backMenuBtn = document.createElement('button');
        backMenuBtn.id = 'back-menu-btn';
        backMenuBtn.className = 'action-btn secondary game-over-btn';
        backMenuBtn.textContent = 'BACK TO MENU';
        backMenuBtn.style.cssText = `
            font-family: 'Orbitron', monospace;
            font-size: 18px;
            font-weight: 700;
            padding: 15px 25px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid #FF6666;
            background: rgba(255,102,102,0.8);
            color: #FFFFFF;
            min-width: 150px;
            min-height: 50px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        // Add hover effects
        playAgainBtn.addEventListener('mouseenter', function(){
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
        });
        playAgainBtn.addEventListener('mouseleave', function(){
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        backMenuBtn.addEventListener('mouseenter', function(){
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
        });
        backMenuBtn.addEventListener('mouseleave', function(){
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        // Add click events
        playAgainBtn.addEventListener('click', this._onRestart.bind(this));
        backMenuBtn.addEventListener('click', this._onExit.bind(this));
        
        // Add buttons to container
        buttonContainer.appendChild(playAgainBtn);
        buttonContainer.appendChild(backMenuBtn);
        
        // Add container to the game over panel (not body)
        // We need to add it to the canvas area since the panel is a canvas element
        var canvasContainer = document.getElementById('game-container');
        if (canvasContainer) {
            canvasContainer.appendChild(buttonContainer);
        } else {
            document.body.appendChild(buttonContainer);
        }
        
        // Store references for cleanup
        this._buttonContainer = buttonContainer;
        this._playAgainBtn = playAgainBtn;
        this._backMenuBtn = backMenuBtn;
    };
    
    this._removeHTMLButtons = function(){
        if (this._buttonContainer && this._buttonContainer.parentNode) {
            this._buttonContainer.parentNode.removeChild(this._buttonContainer);
        }
    };
    
    _oThis = this;
    this._init(iScore);
}