import io
import logging
from dataclasses import dataclass

import mwclient

from gdrive_to_commons import settings


@dataclass
class WikiUploader:
    access_token: str
    access_secret: str
    host: str = settings.WIKI_URL
    consumer_secret: str = settings.SOCIAL_AUTH_MEDIAWIKI_SECRET
    consumer_token: str = settings.SOCIAL_AUTH_MEDIAWIKI_KEY
    mw_client = None

    def __post_init__(self):
        self.mw_client = mwclient.Site(
            host=self.host,
            consumer_secret=self.consumer_secret,
            consumer_token=self.consumer_token,
            access_token=self.access_token,
            access_secret=self.access_secret,
        )

    def upload_file(
        self, file_name: str, file_stream: io.BytesIO, description: str
    ) -> dict:
        try:
            upload_result = self.mw_client.upload(
                file=file_stream,
                filename=file_name,
                description=description,
                ignore=True,
                comment="Uploaded using gdrive-to-commons tool",
            )
        except mwclient.errors.APIError as e:
            logging.debug(
                f"Failed to upload: {file_name} to: {self.mw_client.host}, more information: {e}"
            )
            raise Exception(e.info)

        upload_response = "Error"
        if "result" in upload_result:
            upload_response = upload_result.get("result", "Error")
        elif "upload" in upload_result:
            upload_response = upload_result.get("upload", {}).get("result", "Error")
            upload_result = upload_result.get("upload")

        if upload_response == "Success":
            logging.debug(
                f"Uploaded: {file_name} to: {self.mw_client.host}, more information: {upload_result}"
            )
            return upload_result["imageinfo"]

        logging.debug(
            f"Failed to upload: {file_name} to: {self.mw_client.host}, more information: {upload_result}"
        )
        raise Exception(upload_result)
