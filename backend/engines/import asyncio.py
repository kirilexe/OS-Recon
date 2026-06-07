import asyncio
from curl_cffi.requests import AsyncSession
from re import findall

# Testing a dead/non-existent Telegram handle
URL = "https://t.me/ic0e_this_user_does_not_exist_12345"

async def diagnose_telegram():
    print(f"[*] Fetching Telegram target: {URL}")
    
    async with AsyncSession(impersonate="chrome") as session:
        try:
            response = await session.get(URL, timeout=10)
            html = response.text
            
            print(f"[+] Status Code: {response.status_code}")
            
            # Extract the HTML title tag
            title = findall(r"<title>(.*?)</title>", html)
            print(f"[*] Page Title: {title[0] if title else 'None'}")
            
            # Scan for known internal structural markers Telegram uses for 404s
            print("\n--- Structural Analysis ---")
            markers = {
                "tgme_page_error class": "tgme_page_error",
                "Robot image marker": "tgme_page_icon_robot",
                "Alternative context text": "If you have Telegram, you can contact",
            }
            
            for name, marker in markers.items():
                if marker in html:
                    print(f" MATCH FOUND -> Contains structural marker: '{name}'")
                else:
                    print(f"[-] Missing marker: '{name}'")
            
            # Print the core container block to see exactly what Telegram is rendering
            print("\n[*] Core HTML Body Preview (First 800 chars):")
            print(html[:800])
            
        except Exception as e:
            print(f"[-] Execution error: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose_telegram())