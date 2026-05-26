// URBAN RUSH - Complete 3D Endless Runner Game Engine
// Three.js based, procedural generation, realistic feel

import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import {
  LANE_WIDTH, LANES, INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT,
  JUMP_FORCE, GRAVITY, SLIDE_DURATION, TRACK_SEGMENT_LENGTH,
  VISIBLE_SEGMENTS, COIN_RADIUS, COIN_COLLECT_DISTANCE, COLORS,
  BUILDING_CONFIG, PLAYER_HEIGHT, PLAYER_WIDTH,
} from './constants';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';
export type PlayerLane = 0 | 1 | 2;
export type ObstacleType = 'barrier' | 'low_barrier' | 'train' | 'construction';

interface Obstacle {
  mesh: THREE.Group;
  type: ObstacleType;
  lane: number;
  worldZ: number;
  passed: boolean;
}

interface CoinObj {
  mesh: THREE.Mesh;
  lane: number;
  worldZ: number;
  collected: boolean;
  origY: number;
}

interface TrackSegment {
  group: THREE.Group;
  baseZ: number;
  obstacles: Obstacle[];
  coins: CoinObj[];
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onCoinChange: (coins: number) => void;
  onStateChange: (state: GameState) => void;
  onSpeedChange: (speed: number) => void;
  onDistanceChange: (distance: number) => void;
  onMultiplierChange: (multiplier: number) => void;
  onShieldChange: (hasShield: boolean) => void;
  onHighScore: (score: number) => void;
}

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private audio: AudioManager;

  private state: GameState = 'menu';
  private score = 0;
  private coins = 0;
  private distance = 0;
  private speed = INITIAL_SPEED;
  private multiplier = 1;
  private hasShield = false;
  private highScore = 0;
  private lastSpeedIncrease = 0;

  private playerGroup: THREE.Group;
  private playerLane: PlayerLane = 1;
  private targetLane: PlayerLane = 1;
  private playerY = 0;
  private playerVelocityY = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private playerRunAnim = 0;
  private playerMeshes: {
    body: THREE.Mesh;
    head: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    shield: THREE.Mesh;
  };

  private segments: TrackSegment[] = [];
  private segmentIndex = 0;

  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

  private swipeStartX = 0;
  private swipeStartY = 0;
  private touchStartTime = 0;

  private lastTime = 0;
  private animFrameId = 0;

  private callbacks: GameCallbacks;
  private sunLight!: THREE.DirectionalLight;
  private fogColor = new THREE.Color(COLORS.sky);

  // Bound handlers for cleanup
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.audio = new AudioManager();
    this.canvas = canvas;

    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = this.fogColor;
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.012);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 300);
    this.camera.position.set(0, 5, 8);
    this.camera.lookAt(0, 1.5, -10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;

    // Lights
    this.setupLights();

    // Player
    this.playerMeshes = {} as any;
    this.playerGroup = this.createPlayer();
    this.scene.add(this.playerGroup);

    // Track
    this.generateInitialTrack();

    // Environment
    this.createEnvironment();

    // Input - bind handlers for cleanup
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    window.addEventListener('resize', this.onResize.bind(this));

    // Load high score
    if (typeof window !== 'undefined') {
      this.highScore = parseInt(localStorage.getItem('urbanrush_highscore') || '0');
    }

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.sunLight.position.set(10, 20, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.scene.add(this.sunLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-5, 5, -10);
    this.scene.add(fillLight);

    const groundLight = new THREE.HemisphereLight(0x1a1a2e, 0x444444, 0.3);
    this.scene.add(groundLight);
  }

  private createPlayer(): THREE.Group {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.8, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.player, roughness: 0.3, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);
    this.playerMeshes.body = body;

    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: COLORS.playerHead, roughness: 0.5 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);
    this.playerMeshes.head = head;

    // Cap
    const capGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.12, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: COLORS.player, roughness: 0.4 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.72;
    cap.castShadow = true;
    group.add(cap);

    const brimGeo = new THREE.BoxGeometry(0.35, 0.03, 0.2);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 1.67, -0.15);
    group.add(brim);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.25);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.6 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.18, 0.35, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    this.playerMeshes.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.18, 0.35, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    this.playerMeshes.rightLeg = rightLeg;

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: COLORS.playerAccent, roughness: 0.4 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.48, 0.95, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    this.playerMeshes.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.48, 0.95, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    this.playerMeshes.rightArm = rightArm;

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.12, 0.35);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.5 });
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.18, 0.06, -0.03);
    group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.18, 0.06, -0.03);
    group.add(rightShoe);

    // Shield effect (hidden)
    const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: COLORS.shield,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = 1;
    group.add(shield);
    this.playerMeshes.shield = shield;

    group.position.set(LANES[1], 0, 0);
    return group;
  }

  private createEnvironment() {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(100, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.position.z = -200;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Buildings
    this.generateBuildings(-1);
    this.generateBuildings(1);
  }

  private buildings: THREE.Mesh[] = [];

  private generateBuildings(side: number) {
    const { minHeight, maxHeight, minWidth, maxWidth, depth, gap, sideOffset } = BUILDING_CONFIG;
    const buildingColors = [COLORS.building1, COLORS.building2, COLORS.building3, COLORS.building4];

    for (let i = 0; i < 20; i++) {
      const w = minWidth + Math.random() * (maxWidth - minWidth);
      const h = minHeight + Math.random() * (maxHeight - minHeight);
      const geo = new THREE.BoxGeometry(w, h, depth);
      const mat = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        roughness: 0.7,
        metalness: 0.1,
      });
      const building = new THREE.Mesh(geo, mat);
      building.position.set(
        side * (sideOffset + w / 2 + Math.random() * 2),
        h / 2,
        -i * (depth + gap) - 20
      );
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      this.buildings.push(building);

      // Windows
      const windowRows = Math.floor(h / 2.5);
      const windowCols = Math.floor(w / 1.5);
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          if (Math.random() > 0.4) {
            const winGeo = new THREE.PlaneGeometry(0.6, 0.8);
            const isLit = Math.random() > 0.3;
            const winMat = new THREE.MeshStandardMaterial({
              color: isLit ? 0xffdd88 : 0x334455,
              emissive: isLit ? 0x443300 : 0x000000,
              emissiveIntensity: isLit ? 0.5 : 0,
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(
              -w / 2 + 0.8 + col * 1.5,
              -h / 2 + 2 + row * 2.5,
              side < 0 ? depth / 2 + 0.01 : -depth / 2 - 0.01
            );
            if (side > 0) win.rotation.y = Math.PI;
            building.add(win);
          }
        }
      }
    }
  }

  private generateInitialTrack() {
    for (let i = 0; i < VISIBLE_SEGMENTS + 2; i++) {
      // First segment (i=0) closest to player gets no obstacles for a safe start
      this.addSegment(-i * TRACK_SEGMENT_LENGTH, i === 0);
    }
  }

  private addSegment(baseZ: number, safeZone = false) {
    const group = new THREE.Group();

    // Track surface
    const trackGeo = new THREE.BoxGeometry(LANE_WIDTH * 3 + 1, 0.1, TRACK_SEGMENT_LENGTH);
    const trackMat = new THREE.MeshStandardMaterial({ color: COLORS.track, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.receiveShadow = true;
    group.add(track);

    // Lane dividers
    for (let i = -1; i <= 1; i += 2) {
      const lineGeo = new THREE.BoxGeometry(0.08, 0.12, TRACK_SEGMENT_LENGTH);
      const lineMat = new THREE.MeshStandardMaterial({ color: COLORS.trackLine, emissive: 0x444400, emissiveIntensity: 0.3 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(i * LANE_WIDTH, 0.06, 0);
      group.add(line);
    }

    // Track edges
    for (let side = -1; side <= 1; side += 2) {
      const edgeGeo = new THREE.BoxGeometry(0.15, 0.2, TRACK_SEGMENT_LENGTH);
      const edgeMat = new THREE.MeshStandardMaterial({ color: COLORS.trackEdge, emissive: 0x330000, emissiveIntensity: 0.2 });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.set(side * (LANE_WIDTH * 1.5 + 0.5), 0.1, 0);
      group.add(edge);
    }

    // Sidewalks
    for (let side = -1; side <= 1; side += 2) {
      const walkGeo = new THREE.BoxGeometry(2, 0.15, TRACK_SEGMENT_LENGTH);
      const walkMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
      const walk = new THREE.Mesh(walkGeo, walkMat);
      walk.position.set(side * (LANE_WIDTH * 1.5 + 1.5), 0.075, 0);
      walk.receiveShadow = true;
      group.add(walk);
    }

    // Street lamps
    for (let lz = -5; lz > -TRACK_SEGMENT_LENGTH; lz -= 15) {
      for (const side of [-1, 1]) {
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 4, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(side * (LANE_WIDTH * 1.5 + 1.2), 2, lz);
        group.add(pole);

        // Lamp head
        const lampGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const lampMat = new THREE.MeshStandardMaterial({
          color: 0xffeecc,
          emissive: 0xffddaa,
          emissiveIntensity: 0.8,
        });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(side * (LANE_WIDTH * 1.5 + 1.2), 4.1, lz);
        group.add(lamp);
      }
    }

    group.position.z = baseZ;
    this.scene.add(group);

    const segment: TrackSegment = {
      group,
      baseZ,
      obstacles: [],
      coins: [],
    };

    // Obstacles (skip in safe zone near player start)
    if (!safeZone) {
      this.generateObstaclesForSegment(segment, baseZ);
    }
    // Coins
    this.generateCoinsForSegment(segment, baseZ);

    this.segments.push(segment);
    this.segmentIndex++;
  }

  private generateObstaclesForSegment(segment: TrackSegment, baseZ: number) {
    const numObstacles = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < numObstacles; i++) {
      // Local z within the segment (0 = start, -TRACK_SEGMENT_LENGTH = end)
      // Spread obstacles evenly across the segment
      const segPortion = TRACK_SEGMENT_LENGTH / numObstacles;
      const localZ = -(5 + i * segPortion + Math.random() * (segPortion * 0.6));
      const worldZ = baseZ + localZ;

      // Ensure at least one lane is always free
      const lane = Math.floor(Math.random() * 3);

      const typeRoll = Math.random();
      let type: ObstacleType;
      if (typeRoll < 0.3) type = 'barrier';
      else if (typeRoll < 0.55) type = 'low_barrier';
      else if (typeRoll < 0.8) type = 'train';
      else type = 'construction';

      const obstacle = this.createObstacle(type, lane, localZ, worldZ);
      segment.obstacles.push(obstacle);
      segment.group.add(obstacle.mesh);
    }
  }

  private createObstacle(type: ObstacleType, lane: number, localZ: number, worldZ: number): Obstacle {
    const group = new THREE.Group();

    switch (type) {
      case 'barrier': {
        const postGeo = new THREE.BoxGeometry(0.15, 1.8, 0.15);
        const postMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
        const barGeo = new THREE.BoxGeometry(1.8, 0.15, 0.1);
        const barMat = new THREE.MeshStandardMaterial({ color: COLORS.barrier, emissive: 0x332200, emissiveIntensity: 0.3 });

        const leftPost = new THREE.Mesh(postGeo, postMat);
        leftPost.position.set(-0.85, 0.9, 0);
        leftPost.castShadow = true;
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeo, postMat);
        rightPost.position.set(0.85, 0.9, 0);
        rightPost.castShadow = true;
        group.add(rightPost);

        const topBar = new THREE.Mesh(barGeo, barMat);
        topBar.position.y = 1.7;
        topBar.castShadow = true;
        group.add(topBar);

        const midBar = new THREE.Mesh(barGeo, barMat);
        midBar.position.y = 1.0;
        group.add(midBar);
        break;
      }
      case 'low_barrier': {
        const pillarGeo = new THREE.BoxGeometry(0.2, 2.5, 0.2);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
        const topGeo = new THREE.BoxGeometry(2.0, 0.3, 0.3);
        const topMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x332200, emissiveIntensity: 0.3 });

        const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.position.set(-0.9, 1.25, 0);
        leftPillar.castShadow = true;
        group.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.position.set(0.9, 1.25, 0);
        rightPillar.castShadow = true;
        group.add(rightPillar);

        const topBeam = new THREE.Mesh(topGeo, topMat);
        topBeam.position.y = 0.75;
        topBeam.castShadow = true;
        group.add(topBeam);

        const stripeGeo = new THREE.BoxGeometry(2.1, 0.08, 0.32);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.position.y = 0.65;
        group.add(stripe1);
        break;
      }
      case 'train': {
        const carGeo = new THREE.BoxGeometry(2.0, 2.5, 4.0);
        const carMat = new THREE.MeshStandardMaterial({ color: COLORS.train, roughness: 0.4, metalness: 0.3 });
        const car = new THREE.Mesh(carGeo, carMat);
        car.position.y = 1.25;
        car.castShadow = true;
        group.add(car);

        const windowGeo = new THREE.BoxGeometry(0.5, 0.4, 0.01);
        const windowMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0x224466, emissiveIntensity: 0.5 });
        for (let side = -1; side <= 1; side += 2) {
          for (let wz = -1.2; wz <= 1.2; wz += 1.2) {
            const win = new THREE.Mesh(windowGeo, windowMat);
            win.position.set(side * 1.01, 1.8, wz);
            group.add(win);
          }
        }

        const roofGeo = new THREE.BoxGeometry(2.1, 0.1, 4.1);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 2.5;
        group.add(roof);
        break;
      }
      case 'construction': {
        const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x331100, emissiveIntensity: 0.3 });
        const baseGeo = new THREE.BoxGeometry(0.35, 0.05, 0.35);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xff3300 });

        const conePositions = [[-0.6, 0], [0, 0], [0.6, 0], [-0.3, 0.5], [0.3, 0.5]];
        conePositions.forEach(([x, zOff]) => {
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(x, 0.35, zOff);
          cone.castShadow = true;
          group.add(cone);
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.set(x, 0.05, zOff);
          group.add(base);
        });

        const tapeGeo = new THREE.BoxGeometry(1.6, 0.08, 0.02);
        const tapeMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x333300, emissiveIntensity: 0.3 });
        const tape = new THREE.Mesh(tapeGeo, tapeMat);
        tape.position.y = 0.5;
        group.add(tape);
        break;
      }
    }

    group.position.set(LANES[lane], 0, localZ);

    return { mesh: group, type, lane, worldZ, passed: false };
  }

  private generateCoinsForSegment(segment: TrackSegment, baseZ: number) {
    if (Math.random() > 0.4) {
      const lane = Math.floor(Math.random() * 3);
      const numCoins = 3 + Math.floor(Math.random() * 5);

      for (let i = 0; i < numCoins; i++) {
        const localZ = -2 - i * 2.5;
        const worldZ = baseZ + localZ;
        const coin = this.createCoin(lane, localZ, worldZ);
        segment.coins.push(coin);
        segment.group.add(coin.mesh);
      }
    }
  }

  private createCoin(lane: number, localZ: number, worldZ: number): CoinObj {
    const geo = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, 0.06, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.coin,
      emissive: COLORS.coinEmissive,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(LANES[lane], 1.2, localZ);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;

    return { mesh, lane, worldZ, collected: false, origY: 1.2 };
  }

  // Input handlers
  private onKeyDown(e: KeyboardEvent) {
    if (this.state === 'menu') {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.startGame(); }
      return;
    }
    if (this.state === 'gameover') {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.restartGame(); }
      return;
    }
    if (this.state === 'playing') {
      switch (e.key) {
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); this.moveLeft(); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); this.moveRight(); break;
        case 'ArrowUp': case 'w': case 'W': case ' ': e.preventDefault(); this.jump(); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); this.slide(); break;
        case 'Escape': case 'p': case 'P': this.pauseGame(); break;
        case 'm': case 'M': this.audio.toggleMute(); break;
      }
    } else if (this.state === 'paused') {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') this.resumeGame();
    }
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    this.swipeStartX = touch.clientX;
    this.swipeStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }

  private onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.state === 'menu') { this.startGame(); return; }
    if (this.state === 'gameover') { this.restartGame(); return; }
    if (this.state !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.swipeStartX;
    const dy = touch.clientY - this.swipeStartY;
    const dt = Date.now() - this.touchStartTime;
    const minSwipe = 30;

    if (dt < 500) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        if (dx > 0) this.moveRight(); else this.moveLeft();
      } else if (Math.abs(dy) > minSwipe) {
        if (dy < 0) this.jump(); else this.slide();
      } else {
        this.jump(); // Tap = jump
      }
    }
  }

  private onResize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Player actions
  private moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane = (this.targetLane - 1) as PlayerLane;
      this.audio.playLaneSwitch();
    }
  }

  private moveRight() {
    if (this.targetLane < 2) {
      this.targetLane = (this.targetLane + 1) as PlayerLane;
      this.audio.playLaneSwitch();
    }
  }

  private jump() {
    if (this.isJumping || this.isSliding) return;
    this.isJumping = true;
    this.playerVelocityY = JUMP_FORCE;
    this.audio.playJump();
  }

  private slide() {
    if (this.isSliding || this.isJumping) return;
    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    this.audio.playSlide();
  }

  // Game state
  async startGame() {
    await this.audio.init();
    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.audio.startMusic();
    this.audio.startFootsteps(this.speed);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  restartGame() {
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.speed = INITIAL_SPEED;
    this.multiplier = 1;
    this.hasShield = false;
    this.playerLane = 1;
    this.targetLane = 1;
    this.playerY = 0;
    this.playerVelocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.lastSpeedIncrease = 0;
    this.playerGroup.position.set(LANES[1], 0, 0);
    this.playerGroup.scale.set(1, 1, 1);
    (this.playerMeshes.shield.material as THREE.MeshStandardMaterial).opacity = 0;

    // Clean up
    this.segments.forEach(seg => this.scene.remove(seg.group));
    this.segments = [];
    this.segmentIndex = 0;
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    this.generateInitialTrack();

    this.callbacks.onScoreChange(0);
    this.callbacks.onCoinChange(0);
    this.callbacks.onSpeedChange(this.speed);
    this.callbacks.onDistanceChange(0);
    this.callbacks.onMultiplierChange(1);
    this.callbacks.onShieldChange(false);

    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.audio.startMusic();
    this.audio.startFootsteps(this.speed);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.callbacks.onStateChange('paused');
    this.audio.stopMusic();
    this.audio.stopFootsteps();
    cancelAnimationFrame(this.animFrameId);
  }

  private resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.callbacks.onStateChange('playing');
    this.audio.startMusic();
    this.audio.startFootsteps(this.speed);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameOver() {
    this.state = 'gameover';
    this.callbacks.onStateChange('gameover');
    this.audio.stopMusic();
    this.audio.stopFootsteps();
    this.audio.playGameOver();
    cancelAnimationFrame(this.animFrameId);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('urbanrush_highscore', this.highScore.toString());
      }
      this.callbacks.onHighScore(this.highScore);
    }
  }

  getHighScore() { return this.highScore; }

  // Game loop
  private gameLoop() {
    if (this.state !== 'playing') return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.update(dt, now);
    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(dt: number, now: number) {
    // Speed increase
    this.distance += this.speed * dt;
    this.lastSpeedIncrease += dt * 1000;
    if (this.lastSpeedIncrease > 5000 && this.speed < MAX_SPEED) {
      this.speed = Math.min(MAX_SPEED, this.speed + SPEED_INCREMENT);
      this.lastSpeedIncrease = 0;
      this.callbacks.onSpeedChange(this.speed);
      this.audio.startFootsteps(this.speed);
    }

    this.score = Math.floor(this.distance * this.multiplier);
    this.callbacks.onScoreChange(this.score);
    this.callbacks.onDistanceChange(this.distance);

    // Player lane movement
    const targetX = LANES[this.targetLane];
    const currentX = this.playerGroup.position.x;
    const laneSpeed = 12;
    if (Math.abs(currentX - targetX) > 0.05) {
      this.playerGroup.position.x += (targetX - currentX) * laneSpeed * dt;
    } else {
      this.playerGroup.position.x = targetX;
      this.playerLane = this.targetLane;
    }

    // Jump
    if (this.isJumping) {
      this.playerVelocityY -= GRAVITY * dt;
      this.playerY += this.playerVelocityY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVelocityY = 0;
        this.isJumping = false;
        this.audio.playLand();
      }
    }
    this.playerGroup.position.y = this.playerY;

    // Slide
    if (this.isSliding) {
      this.slideTimer -= dt * 1000;
      this.playerGroup.scale.y = 0.5;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.playerGroup.scale.y = 1;
      }
    }

    // Running animation
    this.playerRunAnim += dt * this.speed * 0.5;
    const legAngle = Math.sin(this.playerRunAnim) * 0.5;
    this.playerMeshes.leftLeg.rotation.x = legAngle;
    this.playerMeshes.rightLeg.rotation.x = -legAngle;
    this.playerMeshes.leftArm.rotation.x = -legAngle * 0.7;
    this.playerMeshes.rightArm.rotation.x = legAngle * 0.7;
    this.playerMeshes.head.position.y = 1.55 + Math.abs(Math.sin(this.playerRunAnim)) * 0.05;

    // Shield visual
    if (this.hasShield) {
      const shieldMat = this.playerMeshes.shield.material as THREE.MeshStandardMaterial;
      shieldMat.opacity = 0.15 + Math.sin(now * 0.005) * 0.05;
      this.playerMeshes.shield.rotation.y += dt * 2;
    }

    // Camera follow - smooth chase camera
    const camTargetX = this.playerGroup.position.x * 0.4;
    const camTargetY = 5 + this.playerY * 0.4;
    this.camera.position.x += (camTargetX - this.camera.position.x) * 5 * dt;
    this.camera.position.y += (camTargetY - this.camera.position.y) * 5 * dt;
    
    // Slight camera tilt when switching lanes
    const tiltTarget = (this.targetLane - 1) * -0.04;
    this.camera.rotation.z += (tiltTarget - this.camera.rotation.z) * 3 * dt;
    
    // FOV increases with speed for sense of speed
    const targetFov = 65 + (this.speed - INITIAL_SPEED) * 0.3;
    this.camera.fov += (targetFov - this.camera.fov) * dt;
    this.camera.updateProjectionMatrix();

    // Move world
    this.moveWorld(dt);

    // Collisions
    this.checkCollisions();

    // Animate coins
    this.animateCoins(dt, now);

    // Particles
    this.updateParticles(dt);

    // Sun movement
    this.sunLight.position.x = 10 + Math.sin(now * 0.0001) * 5;
  }

  private moveWorld(dt: number) {
    const moveZ = this.speed * dt;

    this.segments.forEach(segment => {
      segment.group.position.z += moveZ;
      segment.baseZ += moveZ;

      // Update world positions for collision
      segment.obstacles.forEach(obs => {
        obs.worldZ += moveZ;
      });
      segment.coins.forEach(coin => {
        coin.worldZ += moveZ;
      });
    });

    // Move buildings
    this.buildings.forEach(b => {
      b.position.z += moveZ;
      if (b.position.z > 30) {
        b.position.z -= 400;
      }
    });

    // Remove old segments
    while (this.segments.length > 0 && this.segments[0].baseZ > 20) {
      const old = this.segments.shift()!;
      this.scene.remove(old.group);
    }

    // Add new segments
    const lastBaseZ = this.segments.length > 0 ? this.segments[this.segments.length - 1].baseZ : 0;
    if (lastBaseZ > -(VISIBLE_SEGMENTS * TRACK_SEGMENT_LENGTH)) {
      const newZ = lastBaseZ - TRACK_SEGMENT_LENGTH;
      this.addSegment(newZ);
    }
  }

  private checkCollisions() {
    const playerX = LANES[this.targetLane];
    const playerHalfW = PLAYER_WIDTH / 2;
    const playerH = this.isSliding ? PLAYER_HEIGHT * 0.5 : PLAYER_HEIGHT;
    const playerBottom = this.playerY;

    for (const segment of this.segments) {
      for (const obs of segment.obstacles) {
        if (obs.passed) continue;

        const obsX = LANES[obs.lane];
        const obsWorldZ = obs.worldZ;
        const obsHalfW = 0.9;
        const obsH = this.getObstacleHeight(obs.type);
        const obsDepth = obs.type === 'train' ? 2.0 : 0.5;

        // Z range check (player is at z=0)
        if (obsWorldZ > -obsDepth && obsWorldZ < obsDepth) {
          // X overlap
          if (Math.abs(playerX - obsX) < playerHalfW + obsHalfW) {
            // Y check depends on type
            if (obs.type === 'low_barrier') {
              if (!this.isSliding && playerBottom < 0.9) {
                this.handleCollision(obs);
                return;
              }
            } else if (obs.type === 'barrier') {
              if (playerBottom < obsH - 0.3) {
                this.handleCollision(obs);
                return;
              }
            } else {
              if (playerBottom < obsH - 0.3) {
                this.handleCollision(obs);
                return;
              }
            }
          }
        }

        if (obsWorldZ > 2 && !obs.passed) {
          obs.passed = true;
        }
      }

      // Coins
      for (const coin of segment.coins) {
        if (coin.collected) continue;

        const coinX = LANES[coin.lane];
        const dz = Math.abs(coin.worldZ);
        const dx = Math.abs(playerX - coinX);
        const dy = Math.abs(playerBottom + 1 - coin.origY);

        if (dx < COIN_COLLECT_DISTANCE && dz < COIN_COLLECT_DISTANCE && dy < COIN_COLLECT_DISTANCE + 0.5) {
          coin.collected = true;
          coin.mesh.visible = false;
          this.coins++;
          this.score += 10 * this.multiplier;
          this.callbacks.onCoinChange(this.coins);
          this.audio.playCoinCollect();
          this.spawnCoinParticles(coin.mesh.getWorldPosition(new THREE.Vector3()));
        }
      }
    }
  }

  private getObstacleHeight(type: ObstacleType): number {
    switch (type) {
      case 'barrier': return 1.8;
      case 'low_barrier': return 0.9;
      case 'train': return 2.5;
      case 'construction': return 0.7;
      default: return 1.5;
    }
  }

  private handleCollision(obs: Obstacle) {
    if (this.hasShield) {
      this.hasShield = false;
      (this.playerMeshes.shield.material as THREE.MeshStandardMaterial).opacity = 0;
      this.callbacks.onShieldChange(false);
      this.audio.playCrash();
      obs.passed = true;
      this.spawnShieldBreakParticles();
      return;
    }
    this.spawnCrashParticles();
    this.gameOver();
  }

  private spawnCoinParticles(pos: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.05, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: COLORS.coin });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 4 + 2, (Math.random() - 0.5) * 4),
        life: 0.8,
      });
    }
  }

  private spawnCrashParticles() {
    const pos = this.playerGroup.position.clone();
    pos.y += 1;
    for (let i = 0; i < 20; i++) {
      const size = 0.1 + Math.random() * 0.15;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? COLORS.obstacle : COLORS.player });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8),
        life: 1.5,
      });
    }
  }

  private spawnShieldBreakParticles() {
    const pos = this.playerGroup.position.clone();
    pos.y += 1;
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.06, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: COLORS.shield });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.5) * 6),
        life: 1.0,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 10 * dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      const s = Math.max(0.01, p.life);
      p.mesh.scale.setScalar(s);
    }
  }

  private animateCoins(dt: number, now: number) {
    this.segments.forEach(seg => {
      seg.coins.forEach(coin => {
        if (!coin.collected) {
          coin.mesh.rotation.z += dt * 3;
          coin.mesh.position.y = coin.origY + Math.sin(now * 0.003 + coin.worldZ) * 0.15;
        }
      });
    });
  }

  // Public API
  doMoveLeft() { if (this.state === 'playing') this.moveLeft(); }
  doMoveRight() { if (this.state === 'playing') this.moveRight(); }
  doJump() { if (this.state === 'playing') this.jump(); }
  doSlide() { if (this.state === 'playing') this.slide(); }
  doStart() { if (this.state === 'menu') this.startGame(); }
  doRestart() { if (this.state === 'gameover') this.restartGame(); }
  doPause() {
    if (this.state === 'playing') this.pauseGame();
    else if (this.state === 'paused') this.resumeGame();
  }
  doToggleMute() { return this.audio.toggleMute(); }

  getState() { return this.state; }
  getScore() { return this.score; }
  getCoins() { return this.coins; }
  getSpeed() { return this.speed; }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    this.audio.destroy();
    window.removeEventListener('keydown', this.boundKeyDown);
    this.canvas.removeEventListener('touchstart', this.boundTouchStart);
    this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
