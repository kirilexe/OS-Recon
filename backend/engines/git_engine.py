import httpx
import re

# Refined keywords to find target-rich repositories
CRITICAL_KEYWORDS = re.compile(r'(key|secret|token|config|db|passwd|auth|credential|private|env)', re.IGNORECASE)

async def analyze_github_target(target_input: str):
    username = target_input.split("github.com/")[-1].strip("/")
    api_url = f"https://api.github.com/users/{username}/repos"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OS-RECON-Agent"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(api_url, headers=headers)
            if response.status_code == 404:
                return {"error": f"GitHub user '{username}' not found."}
            elif response.status_code != 200:
                return {"error": f"API Error: {response.status_code}"}
                
            repos = response.json()
            
            interesting_finds = []
            standard_finds = []
            
            for repo in repos:
                repo_name = repo.get("name", "")
                description = repo.get("description", "") or ""
                stars = repo.get("stargazers_count", 0)
                language = repo.get("language", "Unknown")
                html_url = repo.get("html_url", "")
                
                # "POINTS OF INTEREST"
                has_sensitive_name = bool(CRITICAL_KEYWORDS.search(repo_name) or CRITICAL_KEYWORDS.search(description))
                is_popular = stars > 20  # a repo with more stars = more interesting
                is_fork = repo.get("fork", False)
                
                repo_summary = {
                    "name": repo_name,
                    "description": description,
                    "stars": stars,
                    "language": language,
                    "url": html_url,
                    "reasons": []
                }
                
                if has_sensitive_name:
                    repo_summary["reasons"].append("Contains security-sensitive keywords in metadata.")
                if is_popular:
                    repo_summary["reasons"].append(f"High traction asset ({stars} stars).")
                if not is_fork and repo_name.lower() in [username.lower(), "dotfiles", "vault"]:
                    repo_summary["reasons"].append("Potential personal configuration hub or profile vault.")

                # route to appropriate bucket
                if repo_summary["reasons"]:
                    interesting_finds.append(repo_summary)
                else:
                    standard_finds.append(repo_summary)
                    
            return {
                "username": username,
                "profile_url": f"https://github.com/{username}",
                "metrics": {
                    "total": len(repos),
                    "interesting_count": len(interesting_finds),
                    "standard_count": len(standard_finds)
                },
                "interesting": interesting_finds,
                "standard": standard_finds
            }

        except Exception as e:
            return {"error": f"Network analysis failed: {str(e)}"}
        
async def fetch_repo_commits(username: str, repo_name: str):
    # Formulate the correct target GitHub API endpoint
    api_url = f"https://api.github.com/repos/{username}/{repo_name}/commits"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OS-RECON-Agent"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(api_url, headers=headers)
            
            if response.status_code == 404:
                return {"error": f"Repository '{repo_name}' or user '{username}' not found."}
            elif response.status_code != 200:
                return {"error": f"API Error: {response.status_code}"}
                
            raw_commits = response.json()
            parsed_commits = []
            
            # Loop through the raw data array and extract the meaningful info
            for item in raw_commits:
                commit_info = item.get("commit", {})
                author_info = commit_info.get("author", {})
                
                parsed_commits.append({
                    "sha": item.get("sha", "")[:7], # Short commit hash
                    "author": author_info.get("name", "Unknown"),
                    "date": author_info.get("date", ""),
                    "message": commit_info.get("message", "No message provided.")
                })
                
            return {"commits": parsed_commits}

        except Exception as e:
            return {"error": f"Failed to retrieve commit stream: {str(e)}"}