"""
StripChat Studio Earnings Scraper
==================================
Автоматически логинится, обновляет куки и отправляет данные на сайт.

Установка:
    pip install selenium requests webdriver-manager

Запуск:
    python stripchat_scraper.py

Cron (каждые 15 минут):
    */15 * * * * cd /path/to/scraper && python stripchat_scraper.py
"""

import requests
import pickle
import json
import time
import os
from datetime import datetime, timezone, timedelta

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


# ============================================================
# НАСТРОЙКИ
# ============================================================

STUDIO_LOGIN    = "fildobr20@gmail.com"
STUDIO_PASSWORD = "scZ7YbC8qrG6"
STUDIO_USER_ID  = "236996434"

COOKIES_FILE    = "stripchat_cookies.pkl"
COOKIES_MAX_AGE = 6 * 3600  # 6 часов

# Твой сайт
MY_SITE_URL     = "https://huskdlabl.site/api/scraper"
MY_SITE_SECRET  = "huskd-admin-2026"


# ============================================================
# SELENIUM — логин и куки
# ============================================================

def create_driver(headless=True):
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) "
                         "Chrome/121.0.0.0 Safari/537.36")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver


def login_and_save_cookies():
    print("🔐 Логинимся на StripChat...")
    driver = create_driver(headless=False)
    wait = WebDriverWait(driver, 20)
    try:
        driver.get("https://ru.stripchat.com/")
        time.sleep(3)
        driver.get("https://ru.stripchat.com/login")
        time.sleep(2)

        login_field = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "input[name='username'], input[type='text']")
        ))
        login_field.clear()
        login_field.send_keys(STUDIO_LOGIN)
        time.sleep(0.5)

        password_field = driver.find_element(By.CSS_SELECTOR, "input[name='password'], input[type='password']")
        password_field.clear()
        password_field.send_keys(STUDIO_PASSWORD)
        time.sleep(0.5)

        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']")
        submit_btn.click()
        time.sleep(5)

        if "login" in driver.current_url:
            print("❌ Ошибка логина — проверь логин/пароль")
            driver.quit()
            return False

        driver.get("https://ru.stripchat.com/studio-earnings")
        time.sleep(3)

        cookies = driver.get_cookies()
        cookie_data = {"cookies": cookies, "saved_at": time.time()}
        with open(COOKIES_FILE, "wb") as f:
            pickle.dump(cookie_data, f)

        print(f"✅ Куки сохранены ({len(cookies)} шт.)")
        driver.quit()
        return True
    except Exception as e:
        print(f"❌ Ошибка при логине: {e}")
        driver.quit()
        return False


def cookies_are_fresh():
    if not os.path.exists(COOKIES_FILE):
        return False
    with open(COOKIES_FILE, "rb") as f:
        data = pickle.load(f)
    age = time.time() - data.get("saved_at", 0)
    return age < COOKIES_MAX_AGE


def get_cookie_string():
    if not os.path.exists(COOKIES_FILE):
        return None
    with open(COOKIES_FILE, "rb") as f:
        data = pickle.load(f)
    return "; ".join([f"{c['name']}={c['value']}" for c in data.get("cookies", [])])


def ensure_fresh_cookies():
    if cookies_are_fresh():
        print("✅ Куки свежие")
        return True
    print("⏰ Куки протухли, обновляем...")
    return login_and_save_cookies()


# ============================================================
# ПОЛУЧЕНИЕ ДАННЫХ
# ============================================================

def format_date(dt):
    return dt.strftime("%Y-%m-%dT02:33:45Z")


def get_earnings():
    """Получаем данные за текущий месяц — ТОЛЬКО current_month"""
    if not ensure_fresh_cookies():
        raise Exception("Не удалось получить куки")

    cookie_string = get_cookie_string()
    now = datetime.now(timezone.utc)
    from_date = now.replace(day=1, hour=0, minute=0, second=0)

    url = f"https://ru.stripchat.com/api/front/users/{STUDIO_USER_ID}/earnings"
    params = {
        "from": format_date(from_date),
        "until": format_date(now),
        "uniq": "rdu2wgxfyj08ih5n",
    }
    headers = {
        "authority": "ru.stripchat.com",
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "ru-RU,ru;q=0.9",
        "referer": "https://ru.stripchat.com/studio-earnings",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "cookie": cookie_string,
    }

    response = requests.get(url, headers=headers, params=params, timeout=15)

    # Куки протухли — перелогиниваемся
    if response.status_code in (401, 403):
        print("⚠️ Сессия истекла, перелогиниваемся...")
        login_and_save_cookies()
        headers["cookie"] = get_cookie_string()
        response = requests.get(url, headers=headers, params=params, timeout=15)

    response.raise_for_status()
    return response.json()


# ============================================================
# ОТПРАВКА НА САЙТ
# ============================================================

def send_to_my_site(earnings_data):
    """
    Отправляем данные на сайт.
    API сам считает дельту — сравнивает usdTotal с уже записанным за месяц.
    Матчит username модели через platform_nicks в профиле.
    """
    try:
        resp = requests.post(
            MY_SITE_URL,
            json={
                "platform": "stripchat",
                "data": earnings_data,  # {"earnings": [{username, usdTotal, ...}]}
            },
            headers={
                "x-scraper-secret": MY_SITE_SECRET,
                "Content-Type": "application/json",
            },
            timeout=15
        )

        if resp.ok:
            result = resp.json()
            print(f"✅ Отправлено на сайт: {result.get('processed', 0)} моделей")
            for r in result.get("results", []):
                if "delta" in r:
                    print(f"   💰 {r['username']}: +${r['delta']} (всего ${r['total']})")
                elif "error" in r:
                    print(f"   ❌ {r['username']}: {r['error']}")
                else:
                    print(f"   ⏸️  {r['username']}: {r.get('note', 'ok')}")
        else:
            print(f"❌ Ошибка {resp.status_code}: {resp.text[:300]}")

    except Exception as e:
        print(f"❌ Ошибка отправки: {e}")


# ============================================================
# ЗАПУСК
# ============================================================

if __name__ == "__main__":
    try:
        print(f"\n📊 StripChat Scraper — {datetime.now().strftime('%d.%m.%Y %H:%M')}")
        print("=" * 50)

        data = get_earnings()
        earnings = data.get("earnings", [])

        print(f"\n📋 Найдено моделей: {len(earnings)}")
        total_usd = 0
        for m in earnings:
            usd = m.get("usdTotal", 0)
            total_usd += usd
            print(f"   👤 {m['username']}: ${usd:.2f} ({m.get('total', 0)} tokens)")

        print(f"\n💰 Итого по студии: ${total_usd:.2f}")
        print("-" * 50)

        # Отправляем на сайт
        send_to_my_site(data)

        print("\n✅ Готово!\n")

    except Exception as e:
        print(f"\n❌ Ошибка: {e}\n")
