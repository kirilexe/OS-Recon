# OS-RECON

A local desktop reconnaissance and asset-auditing dashboard. It takes a target handle or link, queries public networks, runs custom evaluation logic on the data, and splits the findings into prioritized risks vs. general logs.

## FEATURES ATM: (readme last updated on May 31 2026)
- Tabbed dashboard UI with overview and social overview sections.
- FastAPI server backend running asynchronous, fetching with httpx & curl_cffi.
- Username scanner that checks 50+ websites concurrently and groups results by category (development, social, gaming, media, etc.)
- Improved searching and scraping using browser impersonating and error flagging, so the user can know what to verify by hand.
- Automatic GitHub deep scan if a profile is discovered during the social scan, or if a GitHub link is queried directly.
- Risk filter that parses repositories and splits them into "interesting" vs "standard" based on sensitive keywords in metadata, popularity, etc. TO BE IMPROVED
- Asynchronous commit history checker to fetch and audit public commits directly in the accordion UI.

## TODO:
- Improve on the scanner to yield less false positives.
- Implement data analytics.

## FUTURE FEATURES TASKLIST:
- Analytics depth - analyze and find connections between data, names, etc.
- Deep source code scanner looking for secrets inside files.
- Exporting scan results and saving them.
- Port to electron for easier running.

## Current Project Layout
```
OS-RECON/
├── backend/                  # The backend server folder, handles scraping & processing.
│   ├── engines/              # Scrapers and parsers depending on input type.
│   │   ├── git_engine.py     # GitHub repository analysis & commit fetching.
│   │   └── social_engine.py  # Asynchronous username check registry & probe logic.
│   └── main.py               # FastAPI application server.
└── frontend/                 # React TS + Vite frontend UI.
```

## How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend 
```bash
cd frontend
npm install
npm run dev
```
