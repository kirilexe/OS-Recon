# OS-RECON

A local desktop reconnaissance and asset-auditing dashboard. It takes a target handle or link, queries public networks, runs custom evaluation logic on the data, and splits the findings into prioritized risks vs. general logs.

## FEATURES ATM: (readme last updated on June 2 2026)
- **DeepPry Launchpad UI:** An interactive dossier view tracking target accounts with automatic cross-origin media fallback protocols for forbidden resource handling.
- **Stealth Browser Orchestration:** Advanced deep-reconnaissance module (`nodriver`) that spawns concurrent, isolated headless Chrome instances to bypass anti-scraping walls.
- **Deep Profile Telemetry Extraction:** Captures un-vetted metadata blocks including biography extracts, cross-referenced outbound links, and dynamic platform-specific variables (karma, followers, post counts, cake days).
- **FastAPI server backend:** Runs asynchronous tasks, used for fetching with httpx & curl_cffi. Collects data on a username(s).
- **More filters for false positives:** lets a user know when the scanner was blocked from a website, allowing human verification to see if a profile exists.
- **Automatic github deep scan:** Uses github's API to gather information on a user's repositories and commit history.

## TODO:
- Improve on the scanner to yield less false positives.
- Implement data analytics.

## FUTURE FEATURES TASKLIST:
- Analytics depth: analyze and find connections between data, names, etc.
- Deep source code scanner looking for secrets inside files.
- Port to electron for easier running.

## Current Project Layout
```
OS-RECON/
├── backend/                  # The backend server folder, handles scraping & processing.
│   ├── engines/              # Scrapers and parsers depending on input type.
│   │   ├── git_engine.py     # GitHub repository analysis & commit fetching.
│   │   ├── pry_engine.py     # Stealth browser automation engine via nodriver.
│   │   └── social_engine.py  # Asynchronous username check registry & probe logic.
│   └── main.py               # FastAPI application server.
└── frontend/                 # React TS + Vite frontend UI.
```

## How to Run

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
