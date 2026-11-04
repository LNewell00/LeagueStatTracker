# Security Policy

## Supported Versions

Only the latest active minor release receives regular bug fixes, Riot API compatibility adjustments, and security patches.

| Version | Supported          |
| :------ | :----------------- |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |
| < 0.1   | :x:                |

---

## Architecture & Security Principles

League Stat Tracker is designed with privacy and user data isolation as core principles:

1. **Local Media Isolation**: All screen and game VOD recordings are encoded directly to your local storage (`%USERPROFILE%\Videos\LeagueStatTracker`) using hardware Windows Media Foundation APIs. No video, audio, or recording telemetry is transmitted across the internet.
2. **Read-Only Riot API Communications**: The app only communicates with Riot Games servers via the official developer endpoints (`https://americas.api.riotgames.com`, etc.) and the local Live Client endpoint (`https://127.0.0.1:2999`).
3. **Zero Game Injection**: League Stat Tracker does not inject DLLs, read protected process memory, hook DirectX draw calls, or modify League of Legends game files.
4. **Secure Local Storage**: API keys and summoner profiles are stored locally on your machine and are never shared or collected.

---

## Reporting a Vulnerability

We take the security of League Stat Tracker and our players seriously. If you discover a security flaw, vulnerability, or unexpected data exposure:

1. **Do not create a public GitHub Issue.** Public issues expose the vulnerability before a patch can be rolled out.
2. **Submit a Private Security Advisory**:
   - Go to the [GitHub Security Advisories](https://github.com/LNewell00/LeagueStatTracker/security/advisories/new) page.
   - Describe the vulnerability, provide steps to reproduce, and include any potential impact.
3. **Or Email Directly**:
   - If you cannot use GitHub Advisories, email: **logannewell.ln00@gmail.com** with the subject `[SECURITY] League Stat Tracker Vulnerability`.

### Response Timeline
- **Initial Response**: Within 48 hours of report submission.
- **Triage & Status Update**: Within 5 business days with assessment and mitigation plan.
- **Patch Release**: Critical security fixes will be published in a patch release and highlighted in GitHub Releases.
