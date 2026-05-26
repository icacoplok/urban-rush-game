<div align="center">

# 🏃 URBAN RUSH

### 3D Endless Runner Game

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r184-orange?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)

**A fast-paced 3D endless runner built with Next.js, Three.js, and procedural audio.**

*Dodge obstacles. Collect coins. Survive the urban rush.*

[▶️ Play Now](#-quick-start) · [🎮 Features](#-features) · [🛠️ Tech Stack](#-tech-stack) · [📸 Screenshots](#-screenshots)

</div>

---

## 🎮 Features

### Gameplay
- 🏃 **3D Endless Runner** — Subway Surfers-style gameplay with third-person perspective
- 🛤️ **3-Lane System** — Switch between left, center, and right lanes
- 🚧 **4 Obstacle Types** — Each requires a different strategy:
  - **Barriers** → Jump over them
  - **Low Barriers** → Slide underneath
  - **Trains** → Dodge to another lane
  - **Construction Zones** → Dodge to another lane
- 🪙 **Coin Collection** — Grab coins for bonus score with spinning animation & particle effects
- 📈 **Progressive Difficulty** — Speed increases from 18 to 45 over time
- 🛡️ **Shield Power-up** — Absorb one hit without crashing

### Audio (Procedural — Zero Audio Files!)
- 🔊 **Jump** — Rising whoosh sound
- 🔊 **Slide** — Downward swoosh
- 🔊 **Landing** — Impact thud
- 🔊 **Coin Collect** — Bright ascending ding
- 🔊 **Crash** — Impact + glass shatter
- 🔊 **Footsteps** — Sync with game speed
- 🎵 **Background Music** — Procedural beat loop
- 🎵 **Game Over** — Sad descending notes

### Controls
| Action | Desktop | Mobile |
|--------|---------|--------|
| Move Left | `←` / `A` | Swipe Left |
| Move Right | `→` / `D` | Swipe Right |
| Jump | `↑` / `W` / `Space` | Swipe Up / Tap |
| Slide | `↓` / `S` | Swipe Down |
| Pause | `ESC` / `P` | Pause Button |
| Mute | `M` | Sound Button |

### Visual
- 🏙️ **Urban Cityscape** — Buildings with lit windows, street lamps
- ✨ **Particle Effects** — Coin sparkles, crash debris, shield break
- 📷 **Dynamic Camera** — Chase cam with tilt & FOV that increases with speed
- 🌃 **Night Atmosphere** — Fog, emissive lighting, ambient occlusion

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework, App Router, deployment |
| **Three.js r184** | 3D rendering engine (WebGL) |
| **Web Audio API** | Procedural sound effects & music |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | UI styling & responsive design |
| **React 19** | Component-based UI architecture |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/urban-rush-game.git
cd urban-rush-game

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Vercel

```bash
# Using Vercel CLI
npx vercel

# Or connect your GitHub repo at vercel.com
```

---

## 📸 Screenshots

### Menu Screen
- Gradient title "URBAN RUSH"
- Control instructions
- Start button with hover effects

### Gameplay
- 3D character running through urban track
- HUD showing score, coins, speed
- Obstacles approaching from distance

### Game Over
- Stats summary (score, coins, distance, top speed)
- High score tracking
- "RUN AGAIN" button

---

## 📁 Project Structure

```
src/
├── game/
│   ├── GameEngine.ts      # Core 3D game engine (Three.js)
│   ├── AudioManager.ts    # Procedural sound system (Web Audio API)
│   └── constants.ts       # Game configuration & tuning
├── components/
│   └── game/
│       └── UrbanRushGame.tsx  # Main game React component + UI
├── app/
│   ├── page.tsx           # Entry page (dynamic import, no SSR)
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles
└── components/ui/         # shadcn/ui components
```

---

## 🎯 Game Engine Details

### Architecture
- **Player stays at z=0**, world moves toward the player (infinite runner pattern)
- **Segment-based track generation** — new segments spawn ahead, old ones recycle
- **World-space collision detection** — obstacles track their world Z position
- **Frame-rate independent** — delta-time based physics and movement

### Performance
- Pixel ratio capped at 2x for performance
- PCF shadow maps with 2048x2048 resolution
- Fog culling for distant objects
- Delta-time capped to prevent physics explosions

### Audio
- All sounds generated procedurally using oscillators and noise buffers
- No external audio files required
- Dynamic footstep tempo synced to game speed
- Separate volume controls for music and SFX

---

## 🤖 Built with AI

This project was entirely built using an AI agent (GLM/Super Z) in a single development session. The AI:
- Analyzed reference games using web-reader and vision tools
- Designed the 3D game architecture
- Wrote all game engine, audio, and UI code
- Tested the game live using headless browser automation
- Iteratively fixed bugs and optimized gameplay
- Packaged the project for Vercel deployment

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">

**Made with 🤖 AI & ❤️**

[⬆ Back to Top](#-urban-rush)

</div>
