import asyncio
import sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True, channel="chrome")
        page = await browser.new_page()
        
        # Capture console messages
        def handle_console(msg):
            print(f"[Console] {msg.type}: {msg.text}")
            if msg.location:
                print(f"          at {msg.location.get('url')}:{msg.location.get('lineNumber')}")
                
        page.on("console", handle_console)
        page.on("pageerror", lambda err: print(f"[PageError]: {err}", file=sys.stderr))
        
        print("Navigating to http://localhost:5173 ...")
        await page.goto("http://localhost:5173")
        await page.wait_for_timeout(1000)
        
        # Wait for login screen and click 游客登录
        print("Clicking 游客登录...")
        await page.click("text=游客登录")
        await page.wait_for_timeout(1000)
        
        # Click 开启单人练习赛
        print("Clicking 开启单人练习赛...")
        await page.click("text=开启单人练习赛")
        await page.wait_for_timeout(1000)
        
        # Run for up to 15 days
        for day in range(1, 16):
            print(f"\n--- Starting Day {day} Automation ---")
            
            # 1. Dismiss morning brief if present
            brief_locator = page.locator("text=盘前推演晨报")
            if await brief_locator.count() > 0:
                print(f"Day {day}: Dismissing morning brief...")
                await page.click("text=确认，开始操盘")
                await page.wait_for_timeout(500)
            
            # 2. Wait for the tick timer to progress (wait about 5-6 seconds)
            # We can also buy/sell some stocks to simulate active trading
            print(f"Day {day}: Waiting for ticks to progress and trading...")
            try:
                # Click on the first stock in WatchList to select it
                await page.click("text=消费-01")
                await page.wait_for_timeout(500)
                # Let's try to buy 100 shares if button is enabled
                buy_btn = page.locator("button:has-text('买入')").first
                if await buy_btn.count() > 0 and await buy_btn.is_enabled():
                    await page.click("button:has-text('买入')")
                    print(f"Day {day}: Attempted to buy stock")
            except Exception as e:
                print(f"Day {day}: Trading action failed/skipped: {e}")
                
            # Let it tick for a few seconds
            await page.wait_for_timeout(5000)
            
            # Check if page crashed (blank page check)
            main_element_count = await page.locator("id=root").count()
            if main_element_count == 0:
                print("CRASH DETECTED: #root element is missing or page is blank!")
                break
                
            # 3. Click "操盘完毕，进入盘后"
            print(f"Day {day}: Clicking '操盘完毕，进入盘后'...")
            end_btn = page.locator("text=操盘完毕，进入盘后")
            if await end_btn.count() > 0:
                await page.click("text=操盘完毕，进入盘后")
                await page.wait_for_timeout(1000)
            else:
                print(f"WARNING: '操盘完毕，进入盘后' button not found! Page may have crashed.")
                break
                
            # 4. In NIGHT phase, select a scene
            print(f"Day {day}: In NIGHT phase, selecting a scene...")
            # We look for a scene button like "回家吃泡面"
            scene_btn = page.locator("text=回家吃泡面")
            if await scene_btn.count() > 0:
                await page.click("text=回家吃泡面")
                await page.wait_for_timeout(1000)
            else:
                # Try selecting any available scene button
                scene_btns = page.locator("button:has-text('花费')")
                if await scene_btns.count() > 0:
                    await scene_btns.first.click()
                    await page.wait_for_timeout(1000)
                else:
                    print(f"WARNING: No scene buttons found in NIGHT phase! Page may have crashed.")
                    break
                    
            # 5. In DECISION phase, confirm the scene selection
            print(f"Day {day}: In DECISION phase, confirming scene...")
            confirm_btn = page.locator("text=确认选择并继续")
            if await confirm_btn.count() > 0:
                await page.click("text=确认选择并继续")
                await page.wait_for_timeout(1000)
            else:
                print(f"WARNING: '确认选择并继续' button not found!")
                break
                
            # 6. Handle random life events if any popped up (phase = 'LIFE_EVENT')
            life_event_locator = page.locator("text=盘后场景事件") # Wait, is it "盘后场景事件" or "突发生活随机事件" or "🔔"?
            # Actually, activeLifeEvent renders with "🔔" and options:
            life_event_btn = page.locator("div[style*='position: fixed'] button")
            if await life_event_btn.count() > 0:
                print(f"Day {day}: Random Life Event detected, selecting first option...")
                await life_event_btn.first.click()
                await page.wait_for_timeout(1000)
                
            # 7. Handle liquidation report if any popped up
            liq_btn = page.locator("text=确认并返回大厅")
            if await liq_btn.count() > 0:
                print(f"Day {day}: Liquidation report detected, dismissing...")
                await page.click("text=确认并返回大厅")
                await page.wait_for_timeout(1000)
                
        print("\nMulti-day automation completed.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
