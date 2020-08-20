import io
import logging
from typing import List

import mwclient


class WikiUploader(object):
    mw_client = None

    def __init__(
        self,
        host: str = None,
        consumer_secret: str = None,
        consumer_token: str = None,
        access_token: str = None,
        access_secret: str = None,
    ) -> None:
        self.mw_client = mwclient.Site(
            host=host,
            consumer_secret=consumer_secret,
            consumer_token=consumer_token,
            access_token=access_token,
            access_secret=access_secret,
        )

    def upload_file(
        self, file_name: str, file_stream: io.BytesIO, description: str
    ) -> (bool, dict):
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
            return False, e.info

        upload_response = "Error"
        if "result" in upload_result:
            upload_response = upload_result.get("result")
        elif "upload" in upload_result:
            upload_response = upload_result.get("upload").get("result")
            upload_result = upload_result.get("upload")

        if upload_response == "Success":
            debug_information = f"Uploaded: {file_name} to: {self.mw_client.host}, more information: {upload_result}"
            logging.debug(debug_information)
            return True, upload_result["imageinfo"]
        else:
            logging.debug(
                f"Failed to upload: {file_name} to: {self.mw_client.host}, more information: {upload_result}"
            )
            return False, upload_result


def get_initial_page_text(
    license: str,
    description: str,
    date_created: str,
    source: str,
    author: str,
    location: dict,
    categories: List[str] = None,
) -> str:
    """
    Function used to generate wiki text for the page of the uploaded image
    """

    description = f"|description={description}\n"
    date_created = f"|date={date_created}\n"
    source = f"|source={source}\n"
    author = f"|author={author}\n"

    if not categories:
        categories_string = ""
    else:
        formatted_category_list = [f"[[{category}]]" for category in categories]
        categories_string = "\n".join(formatted_category_list)

    latitude = "" if not location["latitude"] else f"|{location['latitude']}\n"
    longitude = "" if not location["longitude"] else f"|{location['longitude']}\n"
    heading = "" if not location["heading"] else f"heading:|{location['heading']}\n"

    location_string = (
        ""
        if not (latitude and longitude)
        else f"{{{{Location{latitude}{longitude}{heading}}}}}"
    )

    return f"""=={{{{int:filedesc}}}}==
{{{{Information
{description}{date_created}{source}{author}
}}}}
{location_string}

=={{{{int:license-header}}}}==
{{{{{license}}}}}

{categories_string}
"""
