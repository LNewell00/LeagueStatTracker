# League Stat Tracker (Tauri v2 + React + TypeScript + Tailwind CSS)

A sleek, native desktop League of Legends tracker inspired by Blitz.gg and U.gg, engineered with **Tauri v2**, **React 18**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Features

- **Summary Header**: Dynamic win rate gauge, total games counter, and average KDA ratio with top champions showcase.
- **Riot API Match-V5 Service**: Resolves Riot ID (e.g. `Faker#KR1`) into PUUID, then fetches match history (KDA, Champion played, CS, Win/Loss, Items, Damage, Vision Score).
- **Live Client Poller**: Connects to the local League of Legends game client (`https://127.0.0.1:2999/liveclientdata/allgamedata`) during an active match with native TLS self-signed cert bypass in Rust.
- **Local Caching**: Stores parsed match history in a local JSON cache to prevent hitting Riot API rate limits (100 req/2 min).
- **Dark-Mode Gaming UI**: Dark zinc/slate aesthetic with Hextech cyan accents and neon emerald/rose win-loss badges.
- **Built-in Mock Fallback**: Includes demo matches and live game simulation so you can explore the UI immediately before setting up your Riot API key.

---

## 📁 Project Structure

```text
LeagueStatTracker/
├── src-tauri/                       # Native Rust Backend (Tauri v2)
│   ├── capabilities/
│   │   └── default.json             # Tauri security capabilities & permissions
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── riot_api.rs          # Riot API endpoints (Account-v1 & Match-v5)
│   │   │   ├── live_client.rs       # Insecure TLS local client poller (127.0.0.1:2999)
│   │   │   └── storage.rs           # Local JSON match cache read/write
│   │   ├── lib.rs                   # Tauri handler registration & plugin setup
│   │   └── main.rs                  # Native executable entry point
│   ├── Cargo.toml                   # Rust dependencies (reqwest, serde, tauri v2)
│   ├── tauri.conf.json              # Tauri v2 window and build settings
│   └── build.rs                     # Tauri build script
├── src/                             # Frontend (React + Vite + TypeScript)
│   ├── components/
│   │   ├── Header.tsx               # Riot ID search, region selector & client status
│   │   ├── StatsOverview.tsx        # Win rate ring, total games, avg KDA & top champs
│   │   ├── LiveGameCard.tsx         # Active game radar & live in-match stats card
│   │   ├── MatchHistoryTable.tsx    # Filterable scrollable match list
│   │   ├── MatchRow.tsx             # Single match row with Data Dragon icons & neon badges
│   │   └── SettingsModal.tsx        # API key & cache settings modal
│   ├── services/
│   │   ├── ddragon.ts               # Riot Data Dragon CDN URLs (items, champions, spells)
│   │   ├── liveClient.ts            # Live client poller subscription service
│   │   ├── mockData.ts              # Authentic demo matches for instant preview
│   │   ├── riotApi.ts               # Frontend API client & stat computation logic
│   │   └── storage.ts               # Cache & local storage bridge
│   ├── types/
│   │   ├── live.ts                  # Live Client Data API schema
│   │   └── riot.ts                  # Match-V5 and Account-V1 schemas
│   ├── App.tsx                      # Main application orchestrator
│   ├── index.css                    # Tailwind directives & custom neon scrollbars
│   └── main.tsx                     # React DOM entry point
├── .env.example                     # Environment variables template
├── index.html                       # HTML shell
├── package.json                     # Node dependencies & scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.js               # Gaming palette & neon shadow configuration
├── tsconfig.json                    # TypeScript compiler configuration
└── vite.config.ts                   # Vite bundler tailored for Tauri
```

---

## 🛠️ Prerequisites

Before running the application, make sure you have installed:

1. **Node.js (v18 or higher)**:
   - Download from [nodejs.org](https://nodejs.org/), or via winget:
     ```powershell
     winget install OpenJS.NodeJS.LTS
     ```

2. **Rust & Cargo**:
   - Install using [rustup.rs](https://rustup.rs/), or via winget:
     ```powershell
     winget install Rustlang.Rustup
     ```
   - Make sure you also have the **C++ Build Tools** installed (via Visual Studio Installer or `winget install Microsoft.VisualStudio.2022.BuildTools`).

---

## ⚙️ Setup & Installation

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Open `.env` and set your Riot Developer API key:
```env
VITE_RIOT_API_KEY=RGAPI-your-actual-riot-api-key
VITE_DEFAULT_GAME_NAME=Faker
VITE_DEFAULT_TAG_LINE=KR1
VITE_DEFAULT_REGION=kr
```
> **Note**: You can also enter and update your API key directly inside the app using the **Settings** modal at runtime without editing `.env`.

### 2. Install Frontend Dependencies
```powershell
npm install
```

---

## 🖥️ Running the Application

### Option A: Native Desktop App (Recommended)
Launches the full Tauri v2 desktop application with the native Rust backend:
```powershell
npm run tauri dev
```
*On the first run, Cargo will download and compile Rust crates (reqwest, serde, tauri), which takes ~1-2 minutes.*

### Option B: Fast Web Development Preview
If you want to quickly preview and tweak UI styles in a standard web browser:
```powershell
npm run dev
```
Open `http://localhost:1420` in your browser. (The app will automatically use simulated mock data and browser storage fallbacks).

---

## 🔌 Riot API & Live Client Architecture

1. **Account-V1 (`/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`)**:
   Translates modern Riot IDs with taglines into a unique `puuid`.

2. **Match-V5 (`/lol/match/v5/matches/...`)**:
   - Pulls recent match IDs: `/by-puuid/{puuid}/ids`
   - Pulls comprehensive game info: `/{matchId}` (champion, spells, kills, deaths, assists, items 0–6, damage dealt, vision score, and win outcome).

3. **Live Client Data (`https://127.0.0.1:2999/liveclientdata/allgamedata`)**:
   - Polled every 3 seconds while League of Legends is running.
   - Handled inside Rust via `reqwest::Client::builder().danger_accept_invalid_certs(true)` to bypass the self-signed certificate used by the League game client.

---

## ⚖️ Legal Disclaimer

League Stat Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

