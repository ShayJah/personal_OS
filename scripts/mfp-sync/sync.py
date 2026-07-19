"""
Nightly MyFitnessPal -> PersonalOS sync.

Runs only via the GitHub Actions workflow at
.github/workflows/mfp-sync.yml — never inside Vercel (Vercel's Node
runtime doesn't run Python). Uses the unofficial python-myfitnesspal
library, which logs into MFP's website with real credentials; if MFP
changes their site this will break and needs re-checking, but nothing
in the main app is affected when it does.

Required environment variables (set as GitHub Actions repo secrets):
  MFP_USERNAME       - MyFitnessPal login username
  MFP_PASSWORD       - MyFitnessPal login password
  MFP_WEBHOOK_URL    - e.g. https://your-app.vercel.app/api/webhooks/myfitnesspal
  MFP_WEBHOOK_SECRET - shared secret, matches the app's MFP_WEBHOOK_SECRET env var
  MFP_USER_ID        - the PersonalOS User.id to attribute synced data to
"""

import datetime
import os
import sys

import myfitnesspal
import requests


def main() -> int:
    username = os.environ["MFP_USERNAME"]
    password = os.environ["MFP_PASSWORD"]
    webhook_url = os.environ["MFP_WEBHOOK_URL"]
    webhook_secret = os.environ["MFP_WEBHOOK_SECRET"]
    user_id = os.environ["MFP_USER_ID"]

    yesterday = datetime.date.today() - datetime.timedelta(days=1)

    client = myfitnesspal.Client(username, password=password)
    day = client.get_date(yesterday.year, yesterday.month, yesterday.day)
    totals = day.totals

    payload = {
        "userId": user_id,
        "date": yesterday.isoformat(),
        "calories": totals.get("calories"),
        "protein": totals.get("protein"),
        "carbs": totals.get("carbohydrates"),
        "fat": totals.get("fat"),
    }
    payload = {k: v for k, v in payload.items() if v is not None or k in ("userId", "date")}

    response = requests.post(
        webhook_url,
        json=payload,
        headers={"Authorization": f"Bearer {webhook_secret}"},
        timeout=30,
    )
    response.raise_for_status()
    print(f"Synced {yesterday.isoformat()}: {response.json()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
