# 🏆 League Stat Tracker

[![Release](https://img.shields.io/github/v/release/LNewell00/LeagueStatTracker?color=E84057&label=Release&style=flat-square)](https://github.com/LNewell00/LeagueStatTracker/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-0078D6?style=flat-square&logo=windows)](https://github.com/LNewell00/LeagueStatTracker/releases/latest)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](LICENSE)

A high-performance, lightweight desktop companion for **League of Legends**, built from the ground up with **Tauri v2**, **Rust**, **React 18**, **TypeScript**, and **Tailwind CSS**.

Unlike memory-heavy web overlays, League Stat Tracker is engineered to remain fast, unobtrusive, and gentle on your CPU and GPU while delivering real-time match radar, automated zero-click VOD recording, and deep post-game analytics.

---

## 📥 Installation

Download and run the latest Windows installer:

**[Download LeagueStatTracker_0.2.0_x64-setup.exe](https://github.com/LNewell00/LeagueStatTracker/releases/latest)**

---

## ✨ Features (v0.2.0)

### 🎥 Automated Native Match Recording Studio
- **Zero-Prompt Capture**: Uses the native Windows Graphics Capture (WGC) API to automatically attach to `League of Legends (TM) Client`. Zero screen pickers, zero permissions dialogs, and seamless support for Windows Virtual Desktops.
- **Hardware-Accelerated Encoding**: Direct H.264 MP4 encode via Windows Media Foundation with zero in-game frame rate drops.
- **Hands-Free Lifecycle**: Starts silently when you load onto Summoner's Rift and finalizes automatically when the match concludes.
- **100% Private**: All recordings are saved directly to your local drive (`%USERPROFILE%\Videos\LeagueStatTracker`). No video is ever uploaded.

### 🎬 In-App VOD Review Player & Replay Hub
- **Integrated Video Player**: Review your matches directly inside the app with timeline scrubbing, frame stepping, variable playback speed (0.5x–2.0x), and fullscreen mode.
- **Smart Bookmarking**: Add timestamped notes during review to document clutch plays, death causes, and wave management mistakes.
- **ROFL Replay Launcher**: Scans your local League replays folder and boots the League of Legends spectator client directly with one click.

### ⚡ Live Match Radar & Face-Off
- **Local Live Client Integration**: Connects securely to the local League client data stream (`https://127.0.0.1:2999/liveclientdata/allgamedata`) during active matches.
- **10-Player Head-to-Head**: Real-time lane matchup telemetry featuring gold and level differentials, current item builds, active runes, and objective countdowns.

### 📊 Deep Match Analytics & Forecaster
- **Riot Match-V5 Telemetry**: Full historical parsing of recent games, KDA ratios, CS/min pace, vision scores, and kill maps.
- **Rank & LP Trend Forecaster**: Visual MMR progression tracker and rank-up pace calculator.
- **Damage Distribution**: High-fidelity charts breaking down physical, magic, and true damage output per match.

---

## 🗺️ Roadmap to Version 1.0

We are actively developing League Stat Tracker toward our official **v1.0.0 Milestone**. Here is what is planned before then:

```
v0.1.0 ──────────────► v0.2.0 ──────────────► v0.3.0 - v0.9.0 ──────────────► v1.0.0
Live Radar             Native VOD Studio      In-Game HUD Overlay             Full Production
Match-V5 Analytics     Review Player          Champion Deep-Dives             Commercial Release
Rank Forecaster        Setup & Policies       Auto-Import & Themes
```

### 🎯 Gameplay & HUD Overlays
- [ ] **In-Game HUD Overlay**: Ultra-lightweight in-game overlay displaying live CS/min pacing, team gold differentials, and dragon/baron spawn timers.
- [ ] **Side-Monitor Custom Build Helper**: Dedicated second-monitor workbench displaying situational item paths, counter-itemization recommendations, and ability level-up orders.
- [ ] **Automatic Gameplay Highlight Clipper**: Smart clip generation engine that automatically cuts highlights for solo kills, multi-kills, baron steals, and game-winning teamfights.

### 🧠 Champion Mastery & Scouting
- [ ] **Champion Explorer & Deep-Dive**: Lookup any champion to inspect tier rankings, win rates, ban rates, and counter matchups.
- [ ] **Comparative Performance Engine**: Compare your champion stats directly against rank averages (e.g., your CS/min, vision score, and KDA vs Diamond average on the same champion).
- [ ] **Predraft Champion Picker**: Draft phase assistant suggesting optimal synergy picks, hard counters, and strategic bans in Champion Select.

### 🪄 Automation & Client Integration
- [ ] **One-Click Auto-Import**: Automatically import the highest win-rate runes, item sets, and summoner spells directly into your League client via LCU.

### 🎨 Personalization & Theming
- [ ] **Theme Switcher**: Switch between built-in themes (Hextech Cyan, Riot Red, Void Purple, and Bilgewater Dark).
- [ ] **Custom Theme Engine**: Create and share your own personalized color palettes, fonts, and UI layouts.

---

## 🛠️ Building from Source (For Developers Only)

> *Regular players do not need this section. Download the ready-to-run setup executable above.*

### Prerequisites
1. **Node.js**: v18.0 or higher ([Download](https://nodejs.org/))
2. **Rust & Cargo**: Latest stable toolchain ([Install via rustup](https://rustup.rs/))
3. **Visual Studio C++ Build Tools**: Required for native Windows compilation

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/LNewell00/LeagueStatTracker.git
cd LeagueStatTracker

# 2. Install dependencies
npm install

# 3. Launch in development mode (with hot-reload)
npm run tauri dev

# 4. Package production NSIS setup installer (.exe)
npm run tauri build
```
Compiled setup executables will be output to `src-tauri/target/release/bundle/nsis/`.

---

## 🔒 Privacy & Compliance

- **Riot Games Developer Compliance**: League Stat Tracker operates strictly within Riot Games' Third-Party Guidelines. It does not inject code into the League client, read protected memory, or manipulate game files.
- **Local Data Storage**: All match recordings, notes, and cache files stay on your machine. We do not track personal files or transmit video content to external servers.

---

## ⚖️ Legal Disclaimer

League Stat Tracker isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
