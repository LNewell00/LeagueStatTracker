# 🚀 Release & Update Workflow Guide

This guide documents the standard workflow for making changes, committing updates, and publishing new installer releases for **League Stat Tracker**.

---

## 1. Routine Development & Code Updates
For everyday improvements, bug fixes, and feature progress:

```powershell
# 1. Stage modified files
git add .

# 2. Commit with a meaningful message
git commit -m "Describe what was added or fixed"

# 3. Push to GitHub
git push origin main
```

---

## 2. Publishing a New Release to Players (e.g. v0.1.1 or v0.2.0)

When a milestone or new feature is ready for players to download:

### Step 1: Bump Version Numbers
Update the version string across all 3 project configuration files:
- **`src-tauri/tauri.conf.json`** ➔ `"version": "0.1.1"`
- **`package.json`** ➔ `"version": "0.1.1"`
- **`src-tauri/Cargo.toml`** ➔ `version = "0.1.1"`

### Step 2: Build the Production Windows Installers
Make sure any running instance of the app is closed, then run:
```powershell
npm run tauri build
```
This produces the new Windows setup executable in:
`src-tauri\target\release\bundle\nsis\LeagueStatTracker_<version>_x64-setup.exe`

*(Copy it to the `installers/` folder for convenience)*:
```powershell
Copy-Item "src-tauri\target\release\bundle\nsis\*" -Destination "installers\" -Force
```

### Step 3: Commit and Push Code
```powershell
git add .
git commit -m "Release v0.1.1"
git push origin main
```

### Step 4: Publish on GitHub Releases
1. Navigate to your repository's **Releases** ➔ **Draft a new release**.
2. **Tag**: Create a new tag matching the version (e.g. `v0.1.1`).
3. **Target**: `main`.
4. **Title**: `League Stat Tracker v0.1.1`.
5. **Notes**: Summarize new features and bug fixes.
6. **Binaries**: Attach `LeagueStatTracker_<version>_x64-setup.exe`.
7. Click **Publish release**.

---

## 🏷️ Versioning Convention (Semantic Versioning)
- **Patch (`0.1.0` ➔ `0.1.1`)**: Bug fixes, minor UI tweaks, telemetry adjustments.
- **Minor (`0.1.1` ➔ `0.2.0`)**: Major new features (e.g. Game Video Recording, Replay Viewer).
- **Major (`0.9.0` ➔ `1.0.0`)**: Complete public release ready for general production use.
