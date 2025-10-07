// Configuration-based settings - using GameConfig system
var CANVAS_WIDTH = window.gameConfig ? window.gameConfig.get('canvas.width') : 1200;
var CANVAS_HEIGHT = window.gameConfig ? window.gameConfig.get('canvas.height') : 600;

var EDGEBOARD_X = 40;
var EDGEBOARD_Y = 260;

var FPS = window.gameConfig ? window.gameConfig.get('animation.fps') : 20;
var FPS_TIME = window.gameConfig ? window.gameConfig.get('animation.fpsTime') : 50;
var DISABLE_SOUND_MOBILE = false;

var PRIMARY_FONT = window.gameConfig ? window.gameConfig.get('ui.fontFamily') : "Orbitron";
var SCORE_ITEM_NAME = "chog_cross_bestscore";
var STATE_LOADING = 0;
var STATE_MENU = 1;
var STATE_HELP = 1;
var STATE_GAME = 3;

var ON_MOUSE_DOWN = 0;
var ON_MOUSE_UP = 1;
var ON_MOUSE_OVER = 2;
var ON_MOUSE_OUT = 3;
var ON_DRAG_START = 4;
var ON_DRAG_END = 5;
var ON_COLLISION = 6;

// Responsive pozisyon değişkenleri - Configuration'dan al
var PLATFORM_Y = window.gameConfig ? window.gameConfig.get('platform.y') : (CANVAS_HEIGHT - 80);
var CHARACTER_Y = window.gameConfig ? window.gameConfig.get('character.startY') : (PLATFORM_Y - 30);
var FIRST_PLATFORM_Y = window.gameConfig ? (CHARACTER_Y - 55) : (CHARACTER_Y - 55);

var STARTX = window.gameConfig ? window.gameConfig.get('character.startX') : 130;
var STARTY = CHARACTER_Y;
var GRAVITY = window.gameConfig ? window.gameConfig.get('physics.gravity') : 0.98;
var OBST_WIDTH;
var OBST_HEIGHT;
var ENABLE_FULLSCREEN;
var ENABLE_CHECK_ORIENTATION;

// Chog Cross Gambling modu için yeni ayarlar - Configuration'dan al
var MAX_JUMPS = window.gameConfig ? window.gameConfig.get('physics.maxJumps') : 8;
var JUMP_POWER = window.gameConfig ? window.gameConfig.get('physics.jumpPower') : 15;
var SAFE_LANDING_MARGIN = window.gameConfig ? window.gameConfig.get('physics.safeLandingMargin') : 50;
var MULTIPLIER_VALUES = window.gameConfig ? window.gameConfig.get('multipliers.easy') : [1.28, 1.71, 2.28, 3.04, 4.05, 5.39, 7.19];
