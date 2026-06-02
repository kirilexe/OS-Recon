import asyncio
import json
import re
import nodriver as uc
from pydantic import BaseModel
from typing import List, Optional

CONCURRENCY_SEMAPHORE = asyncio.Semaphore(2)

class TargetProfile(BaseModel):
    url: str
    site: str
    username: str
    category: str

class PryMetrics(BaseModel):
    display_name: str
    avatar_url: Optional[str] = ""
    bio: Optional[str] = ""
    external_links: List[str] = []
    platform_specific: dict = {}

class PryResult(BaseModel):
    url: str
    site: str
    username: str
    status: str
    metrics: Optional[PryMetrics] = None
    error: Optional[str] = None


async def _execute_stealth_browser(profile: TargetProfile) -> PryResult:
    browser = None
    try:
        # Launch Chromium with anti-fingerprinting / stealth arguments
        browser = await uc.start(
            headless=True,
            browser_args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--window-size=1920,1080",
                "--lang=en-US,en"
            ]
        )
    except Exception as e:
        return PryResult(
            url=profile.url, site=profile.site, username=profile.username,
            status="Failed", error=f"Failed to initialize browser context: {repr(e)}"
        )
    
    try:
        page = await browser.get(profile.url)
        await page.wait_for('body', timeout=12)
        # Give heavy client-side SPAs time to hydrate state objects
        await page.sleep(3)
        
        # Inject platform-targeted data mining routines
        raw_payload = await page.evaluate("""
            (() => {
                let url = window.location.href.toLowerCase();
                let docText = document.documentElement.innerHTML;
                
                let extracted = {
                    display_name: "",
                    avatar_url: "",
                    bio: "",
                    external_links: [],
                    platform_specific: {}
                };

                // Helper to safely harvest outbound pivot links
                let grabOutboundLinks = () => {
                    let found = [];
                    let host = window.location.hostname.replace('www.', '');
                    document.querySelectorAll("a[href]").forEach(a => {
                        let href = a.href;
                        if (href && href.startsWith("http") && !href.includes(host)) {
                            if (!href.includes("terms") && !href.includes("privacy") && !found.includes(href)) {
                                found.push(href);
                            }
                        }
                    });
                    return found.slice(0, 5);
                };

                // ==========================================================
                // TARGET ROUTE: TIKTOK (Extracting from structural engine states)
                // ==========================================================
                if (url.includes("tiktok.com")) {
                    try {
                        let stateEl = document.querySelector("#__UNIVERSAL_DATA_FOR_WEB_TAG__") || document.querySelector("#SIGI_STATE");
                        if (stateEl) {
                            let rawJson = JSON.parse(stateEl.textContent);
                            let userModule = rawJson.__DEFAULT_SCOPE__?.["webapp.user-detail"]?.userInfo;
                            
                            if (userModule) {
                                extracted.display_name = userModule.user.nickname;
                                extracted.avatar_url = userModule.user.avatarLarger || userModule.user.avatarThumb;
                                extracted.bio = userModule.user.signature;
                                extracted.platform_specific = {
                                    followers: userModule.stats.followerCount,
                                    following: userModule.stats.followingCount,
                                    likes: userModule.stats.heartCount,
                                    videos: userModule.stats.videoCount,
                                    verified: userModule.user.verified ? "Yes" : "No"
                                };
                                extracted.external_links = grabOutboundLinks();
                                return JSON.stringify(extracted);
                            }
                        }
                    } catch(e) {}
                }

                // ==========================================================
                // TARGET ROUTE: GITHUB (DOM Mining Object Definitions)
                // ==========================================================
                if (url.includes("github.com")) {
                    try {
                        let nameEl = document.querySelector(".p-name");
                        let bioEl = document.querySelector(".p-note");
                        let avatarEl = document.querySelector(".avatar-user");
                        
                        extracted.display_name = nameEl ? nameEl.innerText.trim() : "";
                        extracted.bio = bioEl ? bioEl.innerText.trim() : "";
                        extracted.avatar_url = avatarEl ? avatarEl.src : "";
                        
                        let followersEl = document.querySelector("a[href*='tab=followers'] .Counter");
                        let followingEl = document.querySelector("a[href*='tab=following'] .Counter");
                        let reposEl = document.querySelector("span[data-org-item='repos_count'], .Counter[data-view-component='true']");
                        
                        extracted.platform_specific = {
                            followers: followersEl ? followersEl.innerText.trim() : "0",
                            following: followingEl ? followingEl.innerText.trim() : "0",
                            repositories: reposEl ? reposEl.innerText.trim() : "0"
                        };
                        extracted.external_links = grabOutboundLinks();
                        return JSON.stringify(extracted);
                    } catch(e) {}
                }

                // ==========================================================
                // TARGET ROUTE: REDDIT (Shreddit UI Analytics Parsing)
                // ==========================================================
                if (url.includes("reddit.com")) {
                    try {
                        let profileData = document.querySelector("shreddit-profile-info");
                        if (profileData) {
                            extracted.display_name = profileData.getAttribute("username") || "";
                        }
                        
                        let metaImg = document.querySelector('meta[property="og:image"]');
                        if (metaImg) extracted.avatar_url = metaImg.getAttribute("content");
                        
                        let bioEl = document.querySelector('div[data-testid="profile-bio"], #profile-bio-id');
                        extracted.bio = bioEl ? bioEl.innerText.trim() : "";
                        
                        // Parse counts straight out of the structural shadow DOM / element variables
                        let karmaEl = document.querySelector("#profile-karma-id") || document.querySelector("[karma]");
                        extracted.platform_specific = {
                            karma: karmaEl ? karmaEl.innerText.trim() : "N/A",
                        };
                        return JSON.stringify(extracted);
                    } catch(e) {}
                }

                // ==========================================================
                // FALLBACK ROUTE: JSON-LD & META HARVESTER (Instagram, Pinterest, etc.)
                // ==========================================================
                try {
                    let ldJsonEl = document.querySelector('script[type="application/ld+json"]');
                    if (ldJsonEl) {
                        let data = JSON.parse(ldJsonEl.textContent);
                        let mainObj = Array.isArray(data) ? data[0] : data;
                        if (mainObj && (mainObj.name || mainObj.alternativeName)) {
                            extracted.display_name = mainObj.name || mainObj.alternativeName;
                            extracted.avatar_url = mainObj.image || "";
                            extracted.bio = mainObj.description || "";
                            
                            if (mainObj.interactionStatistic) {
                                let stats = Array.isArray(mainObj.interactionStatistic) ? mainObj.interactionStatistic : [mainObj.interactionStatistic];
                                stats.forEach(s => {
                                    let type = s.interactionType?.toLowerCase() || "";
                                    if (type.includes("userinteraction")) {
                                        extracted.platform_specific["engagement_count"] = s.userInteractionCount;
                                    }
                                });
                            }
                            if (extracted.display_name) {
                                extracted.external_links = grabOutboundLinks();
                                return JSON.stringify(extracted);
                            }
                        }
                    }
                } catch(e) {}

                // Pure legacy HTML fallback fallback if metadata engines miss
                let ogTitle = document.querySelector('meta[property="og:title"]');
                let ogImg = document.querySelector('meta[property="og:image"]');
                let ogDesc = document.querySelector('meta[property="og:description"]');

                extracted.display_name = ogTitle ? ogTitle.getAttribute("content") : document.title;
                extracted.avatar_url = ogImg ? ogImg.getAttribute("content") : "";
                extracted.bio = ogDesc ? ogDesc.getAttribute("content") : "";
                extracted.external_links = grabOutboundLinks();

                return JSON.stringify(extracted);
            })()
        """)

        # Parse transmission payload safely
        payload = {}
        if isinstance(raw_payload, str):
            payload = json.loads(raw_payload)
        elif isinstance(raw_payload, dict):
            payload = raw_payload

        if not payload:
            raise Exception("Stealth engine failed to map target footprint layers safely.")

        # Instantiate formatted Pydantic telemetry models
        metrics = PryMetrics(
            display_name=payload.get("display_name") or profile.username,
            avatar_url=payload.get("avatar_url") or "",
            bio=payload.get("bio") or "",
            external_links=payload.get("external_links") or [],
            platform_specific=payload.get("platform_specific") or {}
        )

        # Polish branding strings out of display outputs
        name = metrics.display_name
        for trim_target in [" • Instagram", " - YouTube", " | Pinterest", " - Profile", " photos and videos", " on Pinterest", " - Wikipedia"]:
            if trim_target in name:
                name = name.split(trim_target)[0].strip()
        if "增" in name or "(@" in name:
            name = re.split(r' \(@| 增', name)[0].strip()
        metrics.display_name = name

        # Deep regex extraction block if data ended up falling back to standard description fields
        if metrics.bio and not metrics.platform_specific:
            bio_str = metrics.bio
            f_match = re.search(r"([\d,.\wKMB]+)\s*Followers", bio_str, re.IGNORECASE)
            f_ing_match = re.search(r"([\d,.\wKMB]+)\s*Following", bio_str, re.IGNORECASE)
            p_match = re.search(r"([\d,.\wKMB]+)\s*(?:Posts|Videos)", bio_str, re.IGNORECASE)
            
            if f_match: metrics.platform_specific["followers"] = f_match.group(1).strip()
            if f_ing_match: metrics.platform_specific["following"] = f_ing_match.group(1).strip()
            if p_match: metrics.platform_specific["posts"] = p_match.group(1).strip()

        # Clean structural system lines out of profiles
        if "See Instagram photos and videos" in metrics.bio:
            metrics.bio = metrics.bio.split("-")[-1].replace("See Instagram photos and videos from our profiles", "").strip()
        elif "Watch the latest video" in metrics.bio:
            metrics.bio = metrics.bio.split("|")[-1].strip()

        return PryResult(
            url=profile.url, site=profile.site, username=profile.username, status="Verified", metrics=metrics
        )

    except Exception as e:
        return PryResult(
            url=profile.url, site=profile.site, username=profile.username,
            status="Error", error=f"Error extracting target metrics: {str(e)}"
        )
        
    finally:
        if browser:
            try:
                await browser.stop()
                print(f"[+] Core execution environment successfully terminated for: {profile.url}")
            except Exception:
                pass


async def scrape_isolated_session(profile: TargetProfile) -> PryResult:
    async with CONCURRENCY_SEMAPHORE:
        print(f"[*] Dispatching core platform-aware execution threads for: {profile.url}")
        return await _execute_stealth_browser(profile)