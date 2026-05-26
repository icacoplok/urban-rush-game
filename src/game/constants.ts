// Game Constants for URBAN RUSH - Endless Runner

export const LANE_WIDTH = 2.5;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH] as const;
export const LANE_COUNT = 3;

export const INITIAL_SPEED = 18;
export const MAX_SPEED = 45;
export const SPEED_INCREMENT = 0.3;
export const SPEED_INCREASE_INTERVAL = 5000; // ms

export const JUMP_FORCE = 12;
export const GRAVITY = 30;
export const SLIDE_DURATION = 600; // ms

export const TRACK_SEGMENT_LENGTH = 40;
export const VISIBLE_SEGMENTS = 6;
export const OBSTACLE_MIN_GAP = 15;
export const OBSTACLE_MAX_GAP = 30;

export const PLAYER_WIDTH = 0.8;
export const PLAYER_HEIGHT = 1.6;
export const PLAYER_DEPTH = 0.6;

export const COIN_RADIUS = 0.3;
export const COIN_SPACING = 2.5;
export const COIN_COLLECT_DISTANCE = 1.2;

export const COLORS = {
  ground: 0x444444,
  track: 0x555555,
  trackLine: 0xffff00,
  trackEdge: 0xff4444,
  sky: 0x1a1a2e,
  building1: 0x2c3e50,
  building2: 0x34495e,
  building3: 0x1a252f,
  building4: 0x2d3436,
  obstacle: 0xe74c3c,
  obstacleAlt: 0xc0392b,
  barrier: 0xf39c12,
  train: 0x3498db,
  coin: 0xf1c40f,
  coinEmissive: 0xf39c12,
  player: 0x00d2ff,
  playerAccent: 0x0099cc,
  playerHead: 0xffcc99,
  powerup: 0x2ecc71,
  shield: 0x9b59b6,
  magnet: 0xe91e63,
};

export const BUILDING_CONFIG = {
  minHeight: 8,
  maxHeight: 30,
  minWidth: 4,
  maxWidth: 8,
  depth: 8,
  gap: 3,
  sideOffset: 12,
};
