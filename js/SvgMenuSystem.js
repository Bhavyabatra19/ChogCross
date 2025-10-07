/**
 * SVG Menu System for Chog Cross Game
 * High-quality SVG menu with fan-style opening animation
 * Replaces traditional button system with modern UI
 */

function SvgMenuSystem() {
    var _bMenuOpen = false;
    var _oMenuContainer = null;
    var _oMenuButton = null;
    var _oMenuItems = null;
    var _aMenuItems = [];
    
    // Menu item references
    var _oOptionsItem = null;
    var _oLeaderboardItem = null;
    var _oSoundItem = null;
    var _oFullscreenItem = null;
    var _oCreditsItem = null;
    
    // State tracking
    var _bSoundEnabled = true;
    var _bFullscreenEnabled = false;
    
    // --- SOCIAL MENU SYSTEM ---
    var _bSocialOpen = false;
    var _oSocialContainer = null;
    var _oSocialButton = null;
    var _oSocialItems = null;

    this.init = function() {
        console.log("🎨 Initializing SVG Menu System...");
        
        // Get DOM elements
        _oMenuContainer = document.getElementById('svg-menu-container');
        _oMenuButton = document.getElementById('svg-menu-button');
        _oMenuItems = document.getElementById('menu-items');
        
        // Get menu items
        _oOptionsItem = document.getElementById('menu-options');
        _oLeaderboardItem = document.getElementById('menu-leaderboard');
        _oSoundItem = document.getElementById('menu-sound');
        _oFullscreenItem = document.getElementById('menu-fullscreen');
        _oCreditsItem = document.getElementById('menu-credits');
        
        _aMenuItems = [_oOptionsItem, _oLeaderboardItem, _oSoundItem, _oFullscreenItem, _oCreditsItem];
        
        // Initialize state
        this._updateSoundState();
        this._updateFullscreenState();
        
        // Add event listeners
        this._addEventListeners();
        
        // Initialize canvas-responsive positioning
        this._initCanvasResponsivePositioning();
        
        // Initialize social menu
        this._initSocialMenu();
        
        console.log("✅ SVG Menu System initialized successfully!");
    };
    
    this._initCanvasResponsivePositioning = function() {
        console.log("🎯 Initializing canvas-responsive positioning...");
        // Function to update menu and social button position based on canvas bounding box
        var updateButtonPositions = function() {
            var canvas = document.getElementById('canvas');
            var gameContainer = document.getElementById('game-container');
            if (!canvas || !gameContainer || !_oMenuContainer || !_oSocialContainer) return;
            var canvasRect = canvas.getBoundingClientRect();
            var containerRect = gameContainer.getBoundingClientRect();
            // Responsive ölçek çarpanı artık global g_canvasScale
            var scale = (typeof g_canvasScale !== 'undefined') ? g_canvasScale : 1;
            // --- MENU BUTTON (TOP-RIGHT) ---
            var menuButtonOffsetRight = 60; // px (10px daha sağa kaydırıldı)
            var menuButtonOffsetTop = 50; // px
            _oMenuContainer.style.position = 'fixed';
            _oMenuContainer.style.right = (containerRect.width - canvasRect.right + menuButtonOffsetRight * scale) + 'px';
            _oMenuContainer.style.top = (canvasRect.top + menuButtonOffsetTop * scale) + 'px';
            _oMenuContainer.style.left = 'auto';
            _oMenuContainer.style.transform = 'scale(' + scale + ')';
            _oMenuContainer.style.transformOrigin = 'top right';
            // --- SOCIAL MEDIA BUTTON (TOP-LEFT) ---
            var socialButtonOffsetLeft = 40; // px
            var socialButtonOffsetTop = 52; // px
            _oSocialContainer.style.position = 'fixed';
            _oSocialContainer.style.left = (canvasRect.left + socialButtonOffsetLeft * scale) + 'px';
            _oSocialContainer.style.top = (canvasRect.top + socialButtonOffsetTop * scale) + 'px';
            _oSocialContainer.style.right = 'auto';
            _oSocialContainer.style.transform = 'scale(' + scale + ')';
            _oSocialContainer.style.transformOrigin = 'top left';
        };
        updateButtonPositions();
        window.addEventListener('resize', updateButtonPositions);
        window.addEventListener('orientationchange', updateButtonPositions);
        // MutationObserver ile canvas boyutu değişirse de güncelle
        var canvas = document.getElementById('canvas');
        if (canvas) {
            var observer = new MutationObserver(function() { setTimeout(updateButtonPositions, 100); });
            observer.observe(canvas, { attributes: true, attributeFilter: ['style', 'width', 'height', 'class'] });
        }
        console.log("✅ Canvas bounding-box responsive positioning initialized!");
    };
    
    this._initSocialMenu = function() {
        _oSocialContainer = document.getElementById('social-menu-container');
        _oSocialButton = document.getElementById('social-menu-button');
        _oSocialItems = document.getElementById('social-items');
        if (!_oSocialButton || !_oSocialContainer) return;
        _oSocialButton.addEventListener('click', function(e) {
            e.stopPropagation();
            _bSocialOpen = !_bSocialOpen;
            if (_bSocialOpen) {
                _oSocialContainer.classList.add('social-open');
            } else {
                _oSocialContainer.classList.remove('social-open');
            }
        });
        // Dışarı tıklayınca kapansın
        document.addEventListener('click', function(e) {
            if (_bSocialOpen && !_oSocialContainer.contains(e.target)) {
                _oSocialContainer.classList.remove('social-open');
                _bSocialOpen = false;
            }
        });
    };
    
    
    this._addEventListeners = function() {
        // Main menu button
        _oMenuButton.addEventListener('click', this._onMenuToggle.bind(this));
        
        // Menu items
        _oOptionsItem.addEventListener('click', this._onOptionsClick.bind(this));
        _oLeaderboardItem.addEventListener('click', this._onLeaderboardClick.bind(this));
        _oSoundItem.addEventListener('click', this._onSoundClick.bind(this));
        _oFullscreenItem.addEventListener('click', this._onFullscreenClick.bind(this));
        _oCreditsItem.addEventListener('click', this._onCreditsClick.bind(this));
        
        // Close menu when clicking outside
        document.addEventListener('click', this._onDocumentClick.bind(this));
        
        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', this._onFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this._onFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this._onFullscreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this._onFullscreenChange.bind(this));
    };
    
    this._onMenuToggle = function(e) {
        e.stopPropagation();
        this.toggleMenu();
    };
    
    this.toggleMenu = function() {
        _bMenuOpen = !_bMenuOpen;
        
        if (_bMenuOpen) {
            this._openMenu();
        } else {
            this._closeMenu();
        }
    };
    
    this._openMenu = function() {
        _oMenuContainer.classList.add('menu-open');
        console.log("🎨 Menu opened");
    };
    
    this._closeMenu = function() {
        _oMenuContainer.classList.remove('menu-open');
        console.log("🎨 Menu closed");
    };
    
    this._onDocumentClick = function(e) {
        // Don't interfere with canvas clicks or game elements
        if (e.target.tagName === 'CANVAS' || e.target.closest('#game-container')) {
            return;
        }
        
        if (_bMenuOpen && !_oMenuContainer.contains(e.target)) {
            this._closeMenu();
            _bMenuOpen = false;
        }
    };
    
    // Menu item click handlers
    this._onOptionsClick = function(e) {
        e.stopPropagation();
        console.log("⚙️ Options clicked from SVG menu");
        
        // Show options panel
        this._showOptionsPanel();
        
        this._closeMenu();
        _bMenuOpen = false;
    };
    
    this._onLeaderboardClick = function(e) {
        e.stopPropagation();
        console.log("🏆 Leaderboard clicked from SVG menu");
        
        // Call existing leaderboard function
        if (s_oMenu && s_oMenu._onLeaderboard) {
            s_oMenu._onLeaderboard();
        } else if (window.CLeaderboardNew) {
            var leaderboard = new CLeaderboardNew();
            leaderboard.show();
        }
        
        this._closeMenu();
        _bMenuOpen = false;
    };
    
    this._onSoundClick = function(e) {
        e.stopPropagation();
        console.log("🔊 Sound clicked from SVG menu");
        
        // Toggle sound
        _bSoundEnabled = !_bSoundEnabled;
        this._updateSoundState();
        
        // Update game sound state
        if (typeof s_bAudioActive !== 'undefined') {
            s_bAudioActive = _bSoundEnabled;
            if (typeof Howler !== 'undefined') {
                Howler.mute(!_bSoundEnabled);
            }
        }
        
        // Play click sound if enabled
        if (_bSoundEnabled && typeof playSound === 'function') {
            playSound("click", 1, false);
        }
        
        this._closeMenu();
        _bMenuOpen = false;
    };
    
    this._onFullscreenClick = function(e) {
        e.stopPropagation();
        console.log("📺 Fullscreen clicked from SVG menu");
        
        this._toggleFullscreen();
        this._closeMenu();
        _bMenuOpen = false;
    };
    
    this._onCreditsClick = function(e) {
        e.stopPropagation();
        console.log("👤 How to clicked from SVG menu");
        
        // Call existing how to function
        if (s_oMenu && s_oMenu._onHowTo) {
            s_oMenu._onHowTo();
        } else if (window.CHowToPanel) {
            new CHowToPanel();
        }
        
        this._closeMenu();
        _bMenuOpen = false;
    };
    
    this._toggleFullscreen = function() {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // Enter fullscreen
            var elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };
    
    this._onFullscreenChange = function() {
        _bFullscreenEnabled = !!(document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement);
        this._updateFullscreenState();
        
        // Update game fullscreen state
        if (typeof s_bFullscreen !== 'undefined') {
            s_bFullscreen = _bFullscreenEnabled;
        }
        
        console.log("📺 Fullscreen state changed:", _bFullscreenEnabled);
    };
    
    this._updateSoundState = function() {
        if (_oSoundItem) {
            if (_bSoundEnabled) {
                _oSoundItem.classList.remove('sound-off');
            } else {
                _oSoundItem.classList.add('sound-off');
            }
        }
    };
    
    this._updateFullscreenState = function() {
        if (_oFullscreenItem) {
            if (_bFullscreenEnabled) {
                _oFullscreenItem.classList.remove('fullscreen-off');
            } else {
                _oFullscreenItem.classList.add('fullscreen-off');
            }
        }
    };
    
    // Public methods for external control
    this.setSoundEnabled = function(enabled) {
        _bSoundEnabled = enabled;
        this._updateSoundState();
    };
    
    this.setFullscreenEnabled = function(enabled) {
        _bFullscreenEnabled = enabled;
        this._updateFullscreenState();
    };
    
    this.isMenuOpen = function() {
        return _bMenuOpen;
    };
    
    this.closeMenu = function() {
        if (_bMenuOpen) {
            this._closeMenu();
            _bMenuOpen = false;
        }
    };
    
    // Options Panel Functions
    this._showOptionsPanel = function() {
        var optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.style.display = 'flex';
            this._initOptionsPanel();
        }
    };
    
    this._initOptionsPanel = function() {
        var self = this;
        
        // Get elements
        var closeBtn = document.getElementById('close-options');
        var applyBtn = document.getElementById('apply-options');
        var resetBtn = document.getElementById('reset-options');
        var musicVolumeSlider = document.getElementById('music-volume');
        var soundVolumeSlider = document.getElementById('sound-volume');
        var musicVolumeValue = document.getElementById('music-volume-value');
        var soundVolumeValue = document.getElementById('sound-volume-value');
        var brightnessSlider = document.getElementById('brightness');
        var contrastSlider = document.getElementById('contrast');
        var saturationSlider = document.getElementById('saturation');
        var brightnessValue = document.getElementById('brightness-value');
        var contrastValue = document.getElementById('contrast-value');
        var saturationValue = document.getElementById('saturation-value');
        var fullscreenSelect = document.getElementById('fullscreen-mode');
        
        // Load saved settings
        this._loadOptionsSettings();
        
        // Close button
        if (closeBtn) {
            closeBtn.onclick = function() {
                self._hideOptionsPanel();
            };
        }
        
        // Apply button
        if (applyBtn) {
            applyBtn.onclick = function() {
                self._applyOptionsSettings();
            };
        }
        
        // Reset button
        if (resetBtn) {
            resetBtn.onclick = function() {
                self._resetOptionsSettings();
            };
        }
        
        // Volume sliders
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.oninput = function() {
                musicVolumeValue.textContent = this.value + '%';
            };
        }
        
        if (soundVolumeSlider && soundVolumeValue) {
            soundVolumeSlider.oninput = function() {
                soundVolumeValue.textContent = this.value + '%';
            };
        }
        
        // Display sliders
        if (brightnessSlider && brightnessValue) {
            brightnessSlider.oninput = function() {
                brightnessValue.textContent = this.value + '%';
            };
        }
        
        if (contrastSlider && contrastValue) {
            contrastSlider.oninput = function() {
                contrastValue.textContent = this.value + '%';
            };
        }
        
        if (saturationSlider && saturationValue) {
            saturationSlider.oninput = function() {
                saturationValue.textContent = this.value + '%';
            };
        }
        
        // Click outside to close
        var optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.onclick = function(e) {
                if (e.target === optionsPanel) {
                    self._hideOptionsPanel();
                }
            };
        }
    };
    
    this._hideOptionsPanel = function() {
        var optionsPanel = document.getElementById('options-panel');
        if (optionsPanel) {
            optionsPanel.style.display = 'none';
        }
    };
    
    this._loadOptionsSettings = function() {
        // Load from localStorage or get current values from game
        var musicVolume = localStorage.getItem('game_music_volume');
        var soundVolume = localStorage.getItem('game_sound_volume');
        
        // If no saved values, get current values from game
        if (!musicVolume && window.s_aSounds && window.s_aSounds['soundtrack']) {
            musicVolume = Math.round(window.s_aSounds['soundtrack'].volume() * 100);
        }
        if (!soundVolume && window.s_aSounds && window.s_aSounds['click']) {
            soundVolume = Math.round(window.s_aSounds['click'].volume() * 100);
        }
        
        // Use defaults if still no values
        musicVolume = musicVolume || '20';
        soundVolume = soundVolume || '100';
        
        // Get current canvas resolution or use default
        var currentResolution = '1200x600';
        var canvas = document.getElementById('canvas');
        if (canvas) {
            currentResolution = canvas.width + 'x' + canvas.height;
        }
        
        var resolution = localStorage.getItem('game_resolution') || currentResolution;
        var fullscreenMode = localStorage.getItem('game_fullscreen_mode') || 'windowed';
        
        // Apply to UI
        var musicVolumeSlider = document.getElementById('music-volume');
        var soundVolumeSlider = document.getElementById('sound-volume');
        var musicVolumeValue = document.getElementById('music-volume-value');
        var soundVolumeValue = document.getElementById('sound-volume-value');
        var brightnessSlider = document.getElementById('brightness');
        var contrastSlider = document.getElementById('contrast');
        var saturationSlider = document.getElementById('saturation');
        var brightnessValue = document.getElementById('brightness-value');
        var contrastValue = document.getElementById('contrast-value');
        var saturationValue = document.getElementById('saturation-value');
        var fullscreenSelect = document.getElementById('fullscreen-mode');
        
        if (musicVolumeSlider) {
            musicVolumeSlider.value = musicVolume;
            if (musicVolumeValue) musicVolumeValue.textContent = musicVolume + '%';
        }
        
        if (soundVolumeSlider) {
            soundVolumeSlider.value = soundVolume;
            if (soundVolumeValue) soundVolumeValue.textContent = soundVolume + '%';
        }
        
        if (brightnessSlider) {
            brightnessSlider.value = localStorage.getItem('game_brightness') || '100';
            if (brightnessValue) brightnessValue.textContent = (localStorage.getItem('game_brightness') || '100') + '%';
        }
        
        if (contrastSlider) {
            contrastSlider.value = localStorage.getItem('game_contrast') || '100';
            if (contrastValue) contrastValue.textContent = (localStorage.getItem('game_contrast') || '100') + '%';
        }
        
        if (saturationSlider) {
            saturationSlider.value = localStorage.getItem('game_saturation') || '100';
            if (saturationValue) saturationValue.textContent = (localStorage.getItem('game_saturation') || '100') + '%';
        }
        
        if (fullscreenSelect) {
            fullscreenSelect.value = fullscreenMode;
        }
        
        console.log("📊 Loaded settings - Music:", musicVolume + '%', "Sound:", soundVolume + '%');
    };
    
    this._applyOptionsSettings = function() {
        var musicVolume = document.getElementById('music-volume').value;
        var soundVolume = document.getElementById('sound-volume').value;
        var brightness = document.getElementById('brightness').value;
        var contrast = document.getElementById('contrast').value;
        var saturation = document.getElementById('saturation').value;
        var fullscreenMode = document.getElementById('fullscreen-mode').value;
        
        // Save to localStorage
        localStorage.setItem('game_music_volume', musicVolume);
        localStorage.setItem('game_sound_volume', soundVolume);
        localStorage.setItem('game_brightness', brightness);
        localStorage.setItem('game_contrast', contrast);
        localStorage.setItem('game_saturation', saturation);
        localStorage.setItem('game_fullscreen_mode', fullscreenMode);
        
        // Apply audio settings
        this._applyAudioSettings(musicVolume, soundVolume);
        
        // Apply display settings
        this._applyDisplaySettings(brightness, contrast, saturation);
        
        // Apply fullscreen settings
        this._applyFullscreenSettings(fullscreenMode);
        
        console.log("✅ Options applied successfully!");
        
        // Show success message
        if (window.errorLogger) {
            window.errorLogger.info("Settings applied successfully!");
        }
        
        // Close panel
        this._hideOptionsPanel();
    };
    
    this._resetOptionsSettings = function() {
        // Reset to defaults
        document.getElementById('music-volume').value = '20';
        document.getElementById('sound-volume').value = '100';
        document.getElementById('brightness').value = '100';
        document.getElementById('contrast').value = '100';
        document.getElementById('saturation').value = '100';
        document.getElementById('fullscreen-mode').value = 'windowed';
        
        // Update display values
        document.getElementById('music-volume-value').textContent = '20%';
        document.getElementById('sound-volume-value').textContent = '100%';
        document.getElementById('brightness-value').textContent = '100%';
        document.getElementById('contrast-value').textContent = '100%';
        document.getElementById('saturation-value').textContent = '100%';
        
        console.log("🔄 Options reset to defaults");
    };
    
    this._applyAudioSettings = function(musicVolume, soundVolume) {
        console.log("🔊 Applying audio settings - Music:", musicVolume + '%', "Sound:", soundVolume + '%');
        
        // Apply music volume (soundtrack)
        if (typeof setVolume === 'function' && window.s_aSounds && window.s_aSounds['soundtrack']) {
            setVolume('soundtrack', musicVolume / 100);
            console.log("✅ Music volume set to:", musicVolume + '%');
        } else {
            console.log("⚠️ Music volume function not available");
        }
        
        // Apply sound effects volume
        if (typeof setVolume === 'function' && window.s_aSounds) {
            setVolume('click', soundVolume / 100);
            setVolume('jump', soundVolume / 100);
            setVolume('splash', soundVolume / 100);
            setVolume('footstep', soundVolume / 100);
            console.log("✅ Sound effects volume set to:", soundVolume + '%');
        } else {
            console.log("⚠️ Sound effects volume function not available");
        }
        
        // Also try direct Howler.js approach
        if (window.s_aSounds) {
            // Music volume
            if (window.s_aSounds['soundtrack']) {
                window.s_aSounds['soundtrack'].volume(musicVolume / 100);
                console.log("✅ Direct Howler music volume set to:", musicVolume + '%');
            }
            
            // Sound effects volume
            var soundEffects = ['click', 'jump', 'splash', 'footstep'];
            for (var i = 0; i < soundEffects.length; i++) {
                if (window.s_aSounds[soundEffects[i]]) {
                    window.s_aSounds[soundEffects[i]].volume(soundVolume / 100);
                }
            }
            console.log("✅ Direct Howler sound effects volume set to:", soundVolume + '%');
        }
        
        console.log("🔊 Audio settings applied successfully!");
    };
    
    this._applyDisplaySettings = function(brightness, contrast, saturation) {
        console.log("🎨 Applying display settings - Brightness:", brightness + '%', "Contrast:", contrast + '%', "Saturation:", saturation + '%');
        
        // Apply display settings to canvas
        var canvas = document.getElementById('canvas');
        if (canvas) {
            // Convert percentage to decimal (100% = 1.0)
            var brightnessValue = brightness / 100;
            var contrastValue = contrast / 100;
            var saturationValue = saturation / 100;
            
            // Apply CSS filter
            canvas.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(${saturationValue})`;
        }
        
        console.log("🎨 Display settings applied successfully!");
    };
    
    this._applyResolutionSettings = function(resolution) {
        var canvas = document.getElementById('canvas');
        if (!canvas) return;
        
        var dimensions = resolution.split('x');
        var width = parseInt(dimensions[0]);
        var height = parseInt(dimensions[1]);
        
        console.log("🖥️ Changing resolution to:", resolution, "(" + width + "x" + height + ")");
        
        // Update canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Update canvas style with centering
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        
        // Update game container
        var gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.width = width + 'px';
            gameContainer.style.height = height + 'px';
            gameContainer.style.position = 'relative';
            gameContainer.style.margin = '0 auto';
            gameContainer.style.display = 'flex';
            gameContainer.style.justifyContent = 'center';
            gameContainer.style.alignItems = 'center';
        }
        
        // Update stage if available
        if (window.s_oStage) {
            window.s_oStage.canvas.width = width;
            window.s_oStage.canvas.height = height;
        }
        
        // Update SVG menu positioning
        this._updateMenuPositioning();
        
        console.log("✅ Resolution changed to:", resolution, "Canvas centered");
    };
    
    this._updateMenuPositioning = function() {
        // Update SVG menu container positioning
        var menuContainer = document.getElementById('svg-menu-container');
        if (menuContainer) {
            // Position relative to canvas
            menuContainer.style.position = 'absolute';
            menuContainer.style.top = '50px';
            menuContainer.style.right = '50px';
        }
    };
    
    this._applyFullscreenSettings = function(fullscreenMode) {
        switch (fullscreenMode) {
            case 'fullscreen':
                this._enterFullscreen();
                break;
            case 'borderless':
                this._enterBorderlessWindow();
                break;
            case 'windowed':
            default:
                this._exitFullscreen();
                break;
        }
        
        console.log("🖥️ Fullscreen mode changed to:", fullscreenMode);
    };
    
    this._enterFullscreen = function() {
        var element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    };
    
    this._enterBorderlessWindow = function() {
        // For borderless window, we'll use fullscreen as fallback
        // In a real application, this would require native app integration
        this._enterFullscreen();
    };
    
    this._exitFullscreen = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.init.bind(this));
    } else {
        this.init();
    }

    // Social menu visibility control
    this.setSocialMenuVisible = function(visible) {
        var socialContainer = document.getElementById('social-menu-container');
        if (socialContainer) {
            socialContainer.style.display = visible ? 'block' : 'none';
        }
    };

    // Ana sayfa/oyun state kontrolü için event listener ekle
    document.addEventListener('DOMContentLoaded', function() {
        // Ana menüde göster
        svgMenuSystem.setSocialMenuVisible(true);
        // Oyun başladığında gizle
        document.addEventListener('game_start', function() {
            svgMenuSystem.setSocialMenuVisible(false);
        });
        // Ana menüye dönünce tekrar göster
        document.addEventListener('back_to_menu', function() {
            svgMenuSystem.setSocialMenuVisible(true);
        });
    });
}

// Global instance
var svgMenuSystem = new SvgMenuSystem();

// Export for use in other scripts
window.svgMenuSystem = svgMenuSystem;
