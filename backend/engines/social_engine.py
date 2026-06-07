import httpx
import asyncio
import re
from curl_cffi.requests import AsyncSession

# ──────────────────────────────────────────────────────────
# RESTORED & HARDENED SITE REGISTRY
# ──────────────────────────────────────────────────────────
SITES = {
    "GitHub": {
        "url": "https://github.com/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "GitLab": {
        "url": "https://gitlab.com/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "Bitbucket": {
        "url": "https://bitbucket.org/{}/",
        "errorType": "status_code",
        "category": "development",
    },
    "Reddit": {
        "url": "https://www.reddit.com/user/{}/about.json",
        "errorType": "reddit_json",
        "category": "social",
    },
    "X (Twitter)": {
        "url": "https://nitter.privacydev.net/{}",
        "errorType": "message",
        "errorMsg": "User \"",
        "category": "social",
    },
    "Instagram": {
        "url": "https://www.instagram.com/{}/",
        "errorType": "status_code",
        "category": "social",
    },
    "YouTube": {
        "url": "https://www.youtube.com/@{}",
        "errorType": "status_code",
        "category": "media",
    },
    "TikTok": {
        "url": "https://www.tiktok.com/@{}",
        "errorType": "message",
        "errorMsg": "Couldn't find this account",
        "category": "social",
    },
    "Pinterest": {
        "url": "https://www.pinterest.com/{}/",
        "errorType": "message",
        "errorMsg": "User not found",
        "category": "social",
    },
    "Twitch": {
        "url": "https://www.twitch.tv/{}",
        "errorType": "status_code",
        "category": "gaming",
    },
    "Steam": {
        "url": "https://steamcommunity.com/id/{}",
        "errorType": "message",
        "errorMsg": "The specified profile could not be found.",
        "category": "gaming",
    },
    "Spotify": {
        "url": "https://open.spotify.com/user/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "SoundCloud": {
        "url": "https://soundcloud.com/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "Medium": {
        "url": "https://medium.com/@{}",
        "errorType": "status_code",
        "category": "blogging",
    },
    "Dev.to": {
        "url": "https://dev.to/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "Hashnode": {
        "url": "https://hashnode.com/@{}",
        "errorType": "message",
        "errorMsg": "This page no longer exists.",
        "invertMatch": False,
        "category": "development",
    },
    "LinkedIn": {
        "url": "https://www.linkedin.com/in/{}/",
        "errorType": "status_code",
        "category": "professional",
    },
    "Mastodon (mastodon.social)": {
        "url": "https://mastodon.social/@{}",
        "errorType": "status_code",
        "category": "social",
    },
    "Keybase": {
        "url": "https://keybase.io/{}",
        "errorType": "status_code",
        "category": "security",
    },
    "HackerOne": {
        "url": "https://hackerone.com/{}",
        "errorType": "status_code",
        "category": "security",
    },
    "Patreon": {
        "url": "https://www.patreon.com/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "Behance": {
        "url": "https://www.behance.net/{}",
        "errorType": "status_code",
        "category": "design",
    },
    "Dribbble": {
        "url": "https://dribbble.com/{}",
        "errorType": "status_code",
        "category": "design",
    },
    "Gravatar": {
        "url": "https://en.gravatar.com/{}",
        "errorType": "status_code",
        "category": "social",
    },
    "Flickr": {
        "url": "https://www.flickr.com/people/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "Vimeo": {
        "url": "https://vimeo.com/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "About.me": {
        "url": "https://about.me/{}",
        "errorType": "status_code",
        "category": "social",
    },
    "Codecademy": {
        "url": "https://www.codecademy.com/profiles/{}",
        "errorType": "message",
        "errorMsg": "This profile could not be found",
        "category": "development",
    },
    "HackerRank": {
        "url": "https://www.hackerrank.com/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "LeetCode": {
        "url": "https://leetcode.com/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "npm": {
        "url": "https://www.npmjs.com/~{}",
        "errorType": "status_code",
        "category": "development",
    },
    "PyPI": {
        "url": "https://pypi.org/user/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "Docker Hub": {
        "url": "https://hub.docker.com/u/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "Roblox": {
        "url": "https://www.roblox.com/user.aspx?username={}",
        "errorType": "status_code",
        "category": "gaming",
    },
    "Minecraft (NameMC)": {
        "url": "https://namemc.com/profile/{}",
        "errorType": "status_code",
        "category": "gaming",
    },
    "Chess.com": {
        "url": "https://www.chess.com/member/{}",
        "errorType": "status_code",
        "category": "gaming",
    },
    "Lichess": {
        "url": "https://lichess.org/@/{}",
        "errorType": "status_code",
        "category": "gaming",
    },
    "Fiverr": {
        "url": "https://www.fiverr.com/{}",
        "errorType": "status_code",
        "category": "professional",
    },
    "Kaggle": {
        "url": "https://www.kaggle.com/{}",
        "errorType": "status_code",
        "category": "development",
    },
    "Telegram": {
        "url": "https://t.me/{}",
        "errorType": "message",
        "errorMsg": "Telegram – a new era of messaging",
        "invertMatch": False,
        "category": "social",
    },
    "Wattpad": {
        "url": "https://www.wattpad.com/user/{}",
        "errorType": "status_code",
        "category": "blogging",
    },
    "Tumblr": {
        "url": "https://{}.tumblr.com/",
        "errorType": "status_code",
        "category": "blogging",
    },
    "WordPress": {
        "url": "https://{}.wordpress.com/",
        "errorType": "status_code",
        "category": "blogging",
    },
    "Wikipedia": {
        "url": "https://en.wikipedia.org/wiki/Special:CentralAuth/{}?uselang=qqx",
        "errorType": "message",
        "errorMsg": "centralauth-admin-nonexistent:",
        "category": "social",
    },
    "Imgur": {
        "url": "https://imgur.com/user/{}",
        "errorType": "status_code",
        "category": "media",
    },
    "Unsplash": {
        "url": "https://unsplash.com/@{}",
        "errorType": "status_code",
        "category": "media",
    },
}

# ──────────────────────────────────────────────────────────
# CORE UTILITIES & VARIATIONS
# ──────────────────────────────────────────────────────────

PREFIXES = {"the", "real", "iam", "im", "its", "ascended"}
SUFFIXES = {"dev", "code", "coder", "bot", "git", "hub", "web", "app", "ice", "cat", "dog", "king", "lord", "exe"}

def split_camel_case(username: str) -> tuple[str, str] | None:
    if re.search(r'[a-z][A-Z]', username):
        parts = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)', username)
        if len(parts) >= 2:
            return parts[0].lower(), "".join(parts[1:]).lower()
    return None

def find_smart_split(username: str) -> tuple[str, str] | None:
    camel_split = split_camel_case(username)
    if camel_split:
        return camel_split

    base = username.strip().lower()
    best_split = None
    best_score = -1

    for i in range(3, len(base) - 2):
        left = base[:i]
        right = base[i:]
        score = 0
        if left in PREFIXES:
            score += 2
        if right in SUFFIXES:
            score += 2
        if score >= 2 and score > best_score:
            best_score = score
            best_split = (left, right)
    return best_split

def generate_username_variations(base_username: str) -> list[str]:
    base = base_username.strip().lower()
    variations = []

    if any(char in base for char in ["_", "-", "."]):
        blended = re.sub(r"[_\-.]", "", base)
        variations.append(blended)
        variations.append(f"{base}1")
        variations.append(f"{blended}1")
    else:
        split = find_smart_split(base_username)
        if split:
            left, right = split
            split_uname = f"{left}_{right}"
            variations.append(f"{base}1")
            variations.append(split_uname)
            variations.append(f"{split_uname}1")
        else:
            variations.append(f"{base}1")
            variations.append(f"{base}_1")
            variations.append(f"{base}01")

    seen = {base}
    unique_variations = []
    for var in variations:
        var = var.strip()
        if var and var not in seen:
            seen.add(var)
            unique_variations.append(var)
            if len(unique_variations) >= 3:
                break
                
    return [base] + unique_variations

async def _check_site(
    client: httpx.AsyncSession,
    site_name: str,
    site_cfg: dict,
    username: str,
    semaphore: asyncio.Semaphore,
) -> dict | None:
    url = site_cfg["url"].format(username)
    error_type = site_cfg["errorType"]

    async with semaphore:
        try:
            resp = await client.get(url, timeout=12, allow_redirects=True)
            
            is_blocked_status = resp.status_code in [403, 429]
            
            body_lower = resp.text.lower()
            is_blocked_text = (
                "cloudflare" in body_lower or 
                "sucuri" in body_lower or
                "Before you continue" in body_lower
            )
            
            if is_blocked_status or is_blocked_text:
                return {
                    "site": site_name,
                    "url": site_cfg["url"].format(username).replace("/about.json", ""),
                    "category": site_cfg.get("category", "other"),
                    "status": "Blocked", # flags the website as blocked
                    "username": username
                }
            
            exists = False

            if error_type == "status_code":
                exists = resp.status_code == 200

            elif error_type == "message":
                body = resp.text
                error_msg = site_cfg.get("errorMsg", "")
                invert = site_cfg.get("invertMatch", False)
                if invert:
                    exists = error_msg in body
                else:
                    exists = resp.status_code == 200 and error_msg not in body

            elif error_type == "reddit_json":
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        exists = data.get("kind") == "t2"
                    except Exception:
                        exists = False

            if exists:
                return {
                    "site": site_name,
                    "url": site_cfg["url"].format(username).replace("/about.json", ""),
                    "category": site_cfg.get("category", "other"),
                    "status": "Found",
                    "username": username
                }
                
        except (httpx.ConnectTimeout, httpx.ReadTimeout):
            pass
        except Exception:
            pass
            
    return None

async def scan_username(username: str) -> dict:
    
    if ',' in username:
        variations = [u.strip().lstrip("@") for u in username.split(',') if u.strip()]

        if not variations:
            return {"error": "No valid usernames provided."}
        
        # Validate format for each username
        for var in variations:
            if not re.match(r"^[a-zA-Z0-9._-]{1,40}$", var):
                return {"error": f"Invalid username format: '{var}'"}
    else:
        cleaned_username = username.strip().lstrip("@")
        if not cleaned_username or not re.match(r"^[a-zA-Z0-9._-]{1,40}$", cleaned_username):
            return {"error": "Invalid username format."}
        
        # Generate variations if it's a single input
        variations = generate_username_variations(cleaned_username)

    semaphore = asyncio.Semaphore(15)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/json,*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with AsyncSession(impersonate="chrome", timeout=12.0) as client:
        tasks = [
            _check_site(client, name, cfg, variant, semaphore)
            for variant in variations
            for name, cfg in SITES.items()
        ]
        raw_results = await asyncio.gather(*tasks)

    results = [r for r in raw_results if r is not None]

    # Group by category
    categories: dict[str, list[dict]] = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(r)

    github_usernames = [
        r["username"] for r in results if r["site"] == "GitHub"
    ]

    return {
        "username": username,
        "total_found": len(results),
        "total_checked": len(SITES) * len(variations),
        "results": results,
        "categories": categories,
        "github_username": github_usernames,
    }