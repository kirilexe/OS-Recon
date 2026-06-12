# OS-RECON
> A local reconnaissance dashboard for digital footprint analysis. Unlike standard username checkers, OS-Recon combines passive social scanning with active deep-profile extraction - spawning isolated stealth browser instances using `nodriver` to bypass anti-scraping walls and pull raw metadata that static scanners can't reach.

[![Python](https://img.shields.io/badge/Python-3.14-3776ab?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![nodriver](https://img.shields.io/badge/nodriver-Stealth_Automation-4285f4?style=flat-square&logo=googlechrome&logoColor=white)](https://github.com/ultrafunkamsterdam/nodriver)
[![HTTPX](https://img.shields.io/badge/HTTPX-Async_HTTP-1f425f?style=flat-square&logo=target&logoColor=white)](https://www.python-httpx.org/)
[![curl-cffi](https://img.shields.io/badge/curl--cffi-Impersonate_TLS-064a6b?style=flat-square&logo=curl&logoColor=white)](https://github.com/lexiforest/curl_cffi)

Built around three engines: a fast async social scanner, a stealth browser orchestration layer (`nodriver`), and a GitHub intelligence module that audits repositories, parses commit history, and extracts developer metadata automatically.

Results are split into prioritized risks and general logs - designed with structured data output in mind for downstream analysis.

> !! Early MVP: expect bugs and unfinished modules.

## DEMO

### Scan & Select
Input one or more usernames and OS-Recon's async scanner probes dozens of platforms concurrently. Found profiles are flagged and queued - ready for deep extraction. If a platform blocks you, it's flagged as blocked for the user to manually check.

<img width="800" height="383" alt="scan" src="https://github.com/user-attachments/assets/acff4b80-9fc4-47be-8a75-0201f6e0efa5" />

---

### Deep Pry
Select your targets and launch the nodriver drones. Isolated stealth Chrome instances bypass anti-scraping walls and pull raw metadata, bios, outbound links, and platform-specific variables that static scanners can't reach. Collects the data for more advanced Analytics.

<img width="800" height="384" alt="deep pry" src="https://github.com/user-attachments/assets/ff11eb78-d9f9-4ee9-b7bb-d91552211612" />

---

### AI Analytics
All harvested telemetry is piped through a prompt-engineered Groq pipeline that strips scraper noise and produces a structured, prioritized risk evaluation report. Designed to detect patterns, username consistency and more. (WIP)

<img width="800" height="384" alt="analytics" src="https://github.com/user-attachments/assets/d77ef5b2-7f7e-4b8a-9f87-13e20a379412" />

---

## FEATURES ATM: (readme last updated on June 8, 2026)
- **DeepPry Launchpad UI:** Profile view tracking target accounts with automatic cross-origin media fallback protocols.
- **Stealth Browser Orchestration:** Advanced deep-recon module (`nodriver`) spawning concurrent, isolated headless Chrome instances to bypass anti-scraping walls.
- **Deep Profile Telemetry Extraction:** Captures metadata blocks including bio extracts, cross-referenced outbound links, and dynamic platform-specific variables.
- **FastAPI Backend Server:** Handles asynchronous tasks, fetching via `httpx` & `curl_cffi` to collect target registry metrics concurrently.
- **Dual-Engine Analytics Tab:** Interface sub-tab selector that separates raw telemetry calculations from synthesized intelligence platforms without state loss.
- **Automated AI Threat Cognition Engine:** Prompt-engineered pipeline powered by Groq (`llama-3.1-8b-instant`) that filters out scraper boilerplate noise and converts raw telemetry dumps into a structured, defensive terminal risk evaluation report.
- **Automatic GitHub Deep Scan:** Intelligence module utilizing the GitHub API to parse repository risks, extract exposed metadata, and flag hidden email addresses in commit histories.

## ROADMAP
Looking to see what's planned next? Check out [issues](https://github.com/ic0e/OS-Recon/issues), the TODOs (bugs to fix & features to add) are tracked there.

## Current Project Layout
```
OS-RECON/
├── backend/                    # The backend server folder, handles scraping & processing.
│   ├── engines/                # Scrapers and parsers depending on input type.
│   │   ├── payloads/           # Javascript payloads used for the pry_engine.
│   │   │   └── payload_store.py
│   │   ├── git_engine.py       # GitHub repository analysis & commit fetching.
│   │   ├── pry_engine.py       # Stealth browser automation engine via nodriver.
│   │   └── social_engine.py    # Asynchronous username check registry & probe logic.
│   └── main.py                 # FastAPI application server.
└── frontend/                   # React TS + Vite frontend UI.
```

## How to Run
> **Disclaimer: This tool is developed strictly for educational, security auditing, and authorized open-source intelligence research. The developer assumes no liability for misuse or violations of third-party terms of service.**

> **⚠️ The backend server is designed for local use only. Never expose it to a public network or the internet.**

Requires Python 3.10+ and Node.js 18+. Chrome must be installed for the stealth browser module.

### Getting Started

> **Non-developers who want to try this out:** OS-Recon runs locally and requires a few tools to set up.
> There's no hosted or deployed version yet, this is early development. You'll need to run it
> through a terminal or an IDE like VS Code. Follow the steps below carefully and
> it should work out of the box.

**Prerequisites:**
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Google Chrome](https://www.google.com/chrome/) (required for the stealth browser module)
- [Git](https://git-scm.com/downloads/) (to clone the repo)

**Clone the repo:**
```bash
git clone https://github.com/ic0e/OS-Recon.git
cd OS-Recon
```

Then follow the Backend and Frontend steps below.

### AI Analysis Activation (Optional)
> The cognitive threat intelligence tab requires a Groq API token. If you choose not to use the AI analysis engine, the core passive scanners, GitHub parsing, and nodriver stealth orchestration layers will still function completely normally without it.

1. Head to the Groq Console.
2. Generate a new API key under the API Keys management dashboard.
3. Create a .env file in the root directory and append your key:

```env
GROQ_API_KEY=gsk_your_high_security_token_here
```

> To start the project you need to turn on the Backend and the Frontend.

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to help.

## License
This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
