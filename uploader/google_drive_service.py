import io
import typing
from dataclasses import dataclass

from google.oauth2.credentials import Credentials

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload


@dataclass
class GoogleDriveService:
    access_token: str
    _service = None

    def __post_init__(self):
        self._service = build(
            "drive", "v3", credentials=Credentials(token=self.access_token)
        )

    def get_download_file_stream(
        self, file: typing.Dict[typing.Any, typing.Any]
    ) -> io.BytesIO:
        download_request = self._service.files().get_media(fileId=file["id"])
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, download_request)
        download_done = False
        while not download_done:
            _, download_done = downloader.next_chunk()
        return fh
