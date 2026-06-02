import asyncio
import sys
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Resilient Windows subprocess execution configuration for asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Core OSINT Engine Imports
from engines.pry_engine import scrape_isolated_session, TargetProfile, PryResult
from engines.git_engine import analyze_github_target, fetch_repo_commits
from engines.social_engine import scan_username

app = FastAPI()

# Allow the React UI layout layer to bypass cross-origin browser policies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request / Response Validation Schemas ---

class ScanRequest(BaseModel):
    target: str

class CommitRequest(BaseModel):
    target: str
    username: str

class PryRequest(BaseModel):
    targets: List[TargetProfile]

class PryResponse(BaseModel):
    status: str
    engine: str
    data: List[PryResult]


def _is_github_input(text: str) -> bool:
    """Check if the input is specifically targeting GitHub (URL or github-specific format)."""
    return "github.com" in text


# --- Route Implementations ---

@app.post("/api/scan")
async def handle_scan(request: ScanRequest):
    input_data = request.target.strip()

    if not input_data:
        raise HTTPException(status_code=400, detail="Target cannot be empty.")
    
    if _is_github_input(input_data):
        # Direct GitHub URL -> git engine execution path
        git_data = await analyze_github_target(input_data)
        
        # FIXED: Catching execution errors before extracting fields prevents KeyError/500 crashes
        if "error" in git_data:
            raise HTTPException(status_code=400, detail=git_data["error"])
            
        social_result = await scan_username(git_data["username"])
        
        return {
            "status": "completed",
            "engine": "social",
            "data": social_result,
            "git_data": git_data
        }
    
    else:
        # Plain username -> global social media footprint scan
        social_result = await scan_username(input_data)
        
        if "error" in social_result:
            raise HTTPException(status_code=400, detail=social_result["error"])
        
        # Auto-pivot into git data pipeline if a github handle is unearthed
        git_data = None
        if social_result.get("github_username"):
            git_result = await analyze_github_target(social_result["github_username"])
            if "error" not in git_result:
                git_data = git_result
        
        return {
            "status": "completed",
            "engine": "social",
            "data": social_result,
            "git_data": git_data,
        }
    

@app.post("/api/scanCommits")
async def handle_scan_commits(request: CommitRequest):
    repo_name = request.target.strip()
    username = request.username.strip()
    
    if not repo_name or not username:
        raise HTTPException(status_code=400, detail="Repository name and username are required.")
    
    result = await fetch_repo_commits(username, repo_name)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return {
        "status": "completed",
        "data": result["commits"]
    }


@app.post("/api/pry", response_model=PryResponse)
async def handle_deep_pry(request: PryRequest):
    if not request.targets:
        raise HTTPException(status_code=400, detail="Target processing queue stack cannot be empty.")

    print(f"[*] Beginning stealth multi-session execution queue for {len(request.targets)} items...")
    
    # Fire off concurrent tasks across our engine workers
    tasks = [scrape_isolated_session(profile) for profile in request.targets]
    completed_runs = await asyncio.gather(*tasks)
    
    # FastAPI natively handles nested validation models when matching the response_model layout
    return {
        "status": "completed",
        "engine": "nodriver_pry",
        "data": completed_runs
    }