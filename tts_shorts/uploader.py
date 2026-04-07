"""Upload finished Shorts to YouTube via the Data API v3."""

import os
import sys
from pathlib import Path

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from config import Config

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
_API_SERVICE = "youtube"
_API_VERSION = "v3"


def _get_credentials() -> Credentials:
    """Return valid OAuth2 credentials, running the browser flow if needed."""
    creds: Credentials | None = None
    token_path = Config.YOUTUBE_CREDENTIALS

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            secrets = Config.YOUTUBE_CLIENT_SECRETS
            if not os.path.exists(secrets):
                print(
                    f"\nError: {secrets} not found.\n"
                    "To enable YouTube uploads:\n"
                    "  1. Go to console.cloud.google.com\n"
                    "  2. Create a project → enable YouTube Data API v3\n"
                    "  3. Create OAuth 2.0 Desktop credentials\n"
                    f"  4. Download and save as {secrets}\n"
                )
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(secrets, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(token_path, "w") as f:
            f.write(creds.to_json())

    return creds


def upload_short(
    video_file: str,
    title: str,
    description: str,
    tags: list[str],
    privacy: str | None = None,
) -> str:
    """
    Upload video_file to YouTube as a Short.

    Returns the full YouTube Shorts URL.
    """
    creds = _get_credentials()
    youtube = build(_API_SERVICE, _API_VERSION, credentials=creds)

    # Ensure the title has the #Shorts marker so YouTube classifies it correctly
    if "#Shorts" not in title and "#shorts" not in title:
        title = title.rstrip() + " #Shorts"

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": Config.YOUTUBE_CATEGORY_ID,
            "defaultLanguage": "en",
        },
        "status": {
            "privacyStatus": privacy or Config.YOUTUBE_PRIVACY,
            "selfDeclaredMadeForKids": False,
            "madeForKids": False,
        },
    }

    media = MediaFileUpload(
        video_file,
        mimetype="video/mp4",
        resumable=True,
        chunksize=4 * 1024 * 1024,  # 4 MB chunks
    )

    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media,
    )

    print(f"Uploading '{title}' …")
    response = None
    while response is None:
        try:
            status, response = request.next_chunk()
        except HttpError as exc:
            print(f"Upload error: {exc}")
            raise
        if status:
            pct = int(status.progress() * 100)
            print(f"  {pct}% uploaded", end="\r", flush=True)

    print()  # newline after progress
    video_id = response["id"]
    url = f"https://youtube.com/shorts/{video_id}"
    return url
