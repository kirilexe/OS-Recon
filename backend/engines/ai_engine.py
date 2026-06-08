import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

class AIEngine:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is missing from environment variables.")
        
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=self.api_key
        )
        self.default_model = "llama-3.1-8b-instant"
        self.system_prompt = (
            "You are the central cognitive module of OS-Recon, an advanced OSINT and threat intelligence system.\n"
            "Analyze the provided raw telemetry JSON and generate a synthesized OpSec Evaluation Report.\n\n"

            "CRITICAL DIRECTIVES:\n"
            "1. SYNTHESIZE, DO NOT REGURGITATE. Never list raw counts or restate data fields. Interpret what the data implies.\n"
            "2. FILTER SCRAPER NOISE AGGRESSIVELY. Ignore all platform-native domains (github.com, google.com, youtube.com, instagram.com, linkedin.com, etc). "
            "Only surface user-inserted external links — personal domains, Carrd pages, secondary socials, custom infrastructure.\n"
            "3. CORRELATION IS PRIMARY. Your most valuable output is connecting dots across platforms — "
            "same username variants, same email patterns, same repos referenced in multiple profiles. If something appears once, note it. If it appears across platforms, flag it hard.\n"
            "4. EVERY FINDING NEEDS A 'SO WHAT'. After each observation, include one sentence explaining the real-world implication or the next logical OSINT step.\n"
            "5. CONFIDENCE TAGGING. After each finding append a confidence marker: [CONF:HIGH], [CONF:MED], or [CONF:LOW] based on how many data points support it.\n"
            "6. NO FILLER. No conversational openings, no closing summaries, no meta-commentary. Start immediately with Phase 1.\n"
            "7. SIGNAL-TO-NOISE DISCIPLINE. If a phase has no meaningful findings, write one line: '[-] No significant findings in this phase.' Do not pad.\n\n"

            "TERMINAL INDICATORS — USE EXACTLY:\n"
            "   [!] Actionable OpSec vulnerability — exposed PII, credential leakage, real identity linkage, exploitable infrastructure.\n"
            "   [+] High-value intelligence — verified cross-platform links, infrastructure clusters, unique pivot points.\n"
            "   [-] Behavioral/operational note — technical stack inference, activity patterns, tracking recommendations.\n\n"

            "REPORT STRUCTURE:\n"
            "Phase 1: CRITICAL OPSEC EXPOSURES\n"
            "   Only include findings where real risk exists — exposed emails, leaked real names, PII cross-references, "
            "or infrastructure that directly identifies the target. Skip anything a casual profile viewer would already see.\n\n"

            "Phase 2: IDENTITY GRAPH & INFRASTRUCTURE CLUSTERS\n"
            "   Map username consistency or variation across platforms. Identify repos, domains, or assets that act as "
            "connective tissue between profiles. Flag anything that could be used as a pivot to undiscovered accounts.\n\n"

            "Phase 3: TARGET PROFILE & BEHAVIORAL MATRIX\n"
            "   Infer skillset from technical stack and repo activity. Assess operational security awareness based on what "
            "they expose vs. obscure. End with one [-] tracking recommendation — the single most useful next step for continued OSINT on this target.\n"
        )

    def _prune_payload(self, raw_data: dict) -> dict:
        pruned = {
            "social": {
                "username": raw_data.get("social", {}).get("username"),
                "total_found": raw_data.get("social", {}).get("total_found"),
                "total_checked": raw_data.get("social", {}).get("total_checked")
            },
            "github": None,
            "deepPry": []
        }
        
        git = raw_data.get("github")
        if git:
            pruned["github"] = {
                "username": git.get("username"),
                "exposed_emails": git.get("exposed_emails", []),
                "metrics": git.get("metrics", {}),
                "interesting_repos": [
                    {
                        "name": r.get("name"), 
                        "description": r.get("description"), 
                        "language": r.get("language")
                    } for r in git.get("interesting", []) if isinstance(r, dict)
                ],
                "standard_repos": [
                    {
                        "name": r.get("name"), 
                        "language": r.get("language")
                    } for r in git.get("standard", []) if isinstance(r, dict)
                ]
            }
            
        pry = raw_data.get("deepPry")
        if pry:
            for item in pry:
                if not isinstance(item, dict):
                    continue
                metrics = item.get("metrics", {})
                pruned["deepPry"].append({
                    "site": item.get("site"),
                    "username": item.get("username"),
                    "status": item.get("status"),
                    "bio": metrics.get("bio") if isinstance(metrics, dict) else None,
                    "external_links": metrics.get("external_links", []) if isinstance(metrics, dict) else []
                })
                
        return pruned

    def generate_report(self, raw_payload: dict) -> str:
        try:
            clean_data = self._prune_payload(raw_payload)
            json_str = json.dumps(clean_data, default=str)
            
            response = self.client.chat.completions.create(
                model=self.default_model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": json_str}
                ],
                temperature=0.1
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"[AI Engine Error]: Failed to execute pipeline. Details: {str(e)}"

ai_engine = AIEngine()