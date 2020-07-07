import logging
import uuid

import mwclient


class WikiUploader(object):
    mw_client = None

    def __init__(
        self,
        host=None,
        consumer_secret=None,
        consumer_token=None,
        access_token=None,
        access_secret=None,
    ):
        self.mw_client = mwclient.Site(
            host=host,
            consumer_secret=consumer_secret,
            consumer_token=consumer_token,
            access_token=access_token,
            access_secret=access_secret,
        )

    def upload_file(
        self,
        file_name,
        file_stream,
        date_created="",
        description="",
        license="",
        author="",
        source="",
        location="",
    ):
        if not description:
            description = file_name

        upload_result = self.mw_client.upload(
            file=file_stream,
            filename=file_name,
            description=get_initial_page_text(
                license=license,
                date_of_creation=date_created,
                summary=description,
                source=source,
                author=author,
                location=location,
            ),
            ignore=True,
            comment="Uploaded using gdrive-to-commons tool",
        )
        debug_information = "Uploaded: {0} to: {1}, more information: {2}".format(
            file_name, self.mw_client.host, upload_result
        )
        logging.debug(debug_information)
        upload_response = upload_result.get("result")
        logging.debug(upload_response)
        if not upload_response == "Success":
            return False, {}
        else:
            return True, upload_result["imageinfo"]


def get_initial_page_text(
    license=None,
    summary=None,
    category=None,
    date_of_creation=None,
    source=None,
    author=None,
    location=None,
):
    description = "" if not summary else "|description={0}\n".format(summary)
    date_of_creation = (
        "" if not date_of_creation else "|date={0}\n".format(date_of_creation)
    )
    source = "" if not source else "|source={0}\n".format(source)
    author = "" if not author else "|author={0}\n".format(author)
    category = "" if not category else "[[Category:{0}]] ".format(category) + "\n"

    latitude = "" if not location["latitude"] else "|{0}\n".format(location["latitude"])
    longitude = (
        "" if not location["longitude"] else "|{0}\n".format(location["longitude"])
    )
    heading = (
        "" if not location["heading"] else "heading:|{0}\n".format(location["heading"])
    )
    location_string = (
        ""
        if not (latitude and longitude)
        else "{{{{Location{0}{1}{2}}}}}".format(latitude, longitude, heading)
    )

    return f"""=={{{{int:filedesc}}}}==
{{{{Information
 {description}{date_of_creation}{source}{author}
}}}}
{location_string}

=={{{{int:license-header}}}}==
{{{{{license}}}}}
{category}
"""
