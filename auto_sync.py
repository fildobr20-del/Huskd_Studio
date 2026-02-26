"""
Husk Label — Auto Sync Script
==============================
Открывает каждый Chrome профиль по очереди со страницами статистики.
Расширение автоматически собирает данные и отправляет в админ-панель.
Запускать можно вручную или через Планировщик задач Windows.

НАСТРОЙКА:
1. Убедись что CHROME_PATH указывает на правильный путь к chrome.exe
2. Укажи правильные URL страниц статистики для каждой платформы
3. Запусти: python auto_sync.py
"""

import subprocess
import time
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# ============================================================
# НАСТРОЙКИ — редактируй здесь
# ============================================================

# Путь к chrome.exe (проверяется автоматически)
CHROME_PATHS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]

# Папка с профилями Chrome
USER_DATA_DIR = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")

# Страницы статистики для каждой платформы
# Расширение сработает автоматически когда страница откроется
STATS_URLS = [
    "https://xmodels.com/earnings",                       # XModels
    "https://www.skyprivate.com/account/transactions",    # SkyPrivate
    "https://fansly.com/account/earnings",                # Fansly
]

# Сколько секунд ждать после открытия страниц (время для сбора данных)
WAIT_SECONDS = 50

# Профили которые пропускать (например "Default" — твой личный профиль)
SKIP_PROFILES = ["Default"]

# Если задано — обрабатывать только эти профили (пусто = все)
# Пример: ONLY_PROFILES = ["Profile 1", "Profile 5", "Profile 12"]
ONLY_PROFILES = []

# ============================================================

def find_chrome():
    for path in CHROME_PATHS:
        if os.path.exists(path):
            return path
    print("❌ Chrome не найден! Укажи путь вручную в CHROME_PATHS")
    sys.exit(1)

def get_profiles(user_data_dir):
    """Возвращает список папок профилей Chrome с именами моделей"""
    profiles = []
    data_path = Path(user_data_dir)

    if not data_path.exists():
        print(f"❌ Папка профилей не найдена: {user_data_dir}")
        sys.exit(1)

    for item in sorted(data_path.iterdir()):
        if not item.is_dir():
            continue
        name = item.name
        # Берём только Profile N и Default
        if not (name.startswith("Profile ") or name == "Default"):
            continue
        if name in SKIP_PROFILES:
            continue
        if ONLY_PROFILES and name not in ONLY_PROFILES:
            continue

        # Пробуем прочитать имя профиля из Preferences
        display_name = name
        prefs_file = item / "Preferences"
        if prefs_file.exists():
            try:
                with open(prefs_file, "r", encoding="utf-8") as f:
                    prefs = json.load(f)
                display_name = prefs.get("profile", {}).get("name", name)
            except Exception:
                pass

        profiles.append((name, display_name))

    return profiles

def open_and_sync(chrome_path, user_data_dir, profile_dir, display_name, urls):
    """Открывает Chrome с профилем, ждёт сбора данных, закрывает"""
    print(f"\n  🌐 Открываю {display_name} ({profile_dir})...")

    cmd = [
        chrome_path,
        f"--user-data-dir={user_data_dir}",
        f"--profile-directory={profile_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        "--no-restore-last-session",
        "--disable-session-crashed-bubble",
        "--new-window",
    ] + urls

    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Ждём пока расширение соберёт данные
    for i in range(WAIT_SECONDS, 0, -5):
        print(f"    ⏳ {i} сек...", end="\r")
        time.sleep(5)
    print(f"    ✅ Готово!              ")

    # Закрываем Chrome (весь процесс с дочерними)
    try:
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
            capture_output=True
        )
    except Exception:
        pass

    time.sleep(2)  # Небольшая пауза перед следующим профилем

def main():
    print("=" * 55)
    print("   Husk Label — Auto Sync")
    print(f"   {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    print("=" * 55)

    chrome = find_chrome()
    print(f"✓ Chrome: {chrome}")
    print(f"✓ Профили: {USER_DATA_DIR}")

    profiles = get_profiles(USER_DATA_DIR)
    if not profiles:
        print("❌ Профили не найдены!")
        sys.exit(1)

    print(f"✓ Найдено профилей: {len(profiles)}")
    print(f"✓ Платформы: {len(STATS_URLS)} URL(ов)")
    print(f"✓ Ожидание на профиль: {WAIT_SECONDS} сек")

    total_time = len(profiles) * (WAIT_SECONDS + 5) // 60
    print(f"✓ Примерное время: ~{total_time} мин")
    print()

    for i, (profile_dir, display_name) in enumerate(profiles, 1):
        print(f"[{i}/{len(profiles)}] {display_name}")
        open_and_sync(chrome, USER_DATA_DIR, profile_dir, display_name, STATS_URLS)

    print()
    print("=" * 55)
    print(f"✅ Синхронизация завершена! ({len(profiles)} профилей)")
    print("=" * 55)

if __name__ == "__main__":
    main()
