# OS-RECON

A local desktop reconnaissance and asset-auditing dashboard. It takes a target handle or link, queries public networks, runs custom evaluation logic on the data, and splits the findings into prioritized risks vs. general logs.
Right now, it's a working MVP focused on GitHub infrastructure.

## FEATURES ATM: (readme last updated on May 30 2026)
- A small minimal dashboard UI for testing.
- FastAPI server backend running asynchronous, fetching with httpx.
- One filter that parses github repositories and lists the most "interesting" ones based on criteria.


## Current Project Layout
```text
OS-RECON/
├── backend/                  # The backend server folder, handles scraping & processing.
│   ├── engines/              # Isolated scrapers and parsers depending on the input link
│   └── main.py               # Server main point
└── frontend/                 # React TS + Vite
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
