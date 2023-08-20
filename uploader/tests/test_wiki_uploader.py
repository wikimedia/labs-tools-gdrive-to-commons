import io
from unittest import mock

import mwclient
from django.test import TestCase, tag

from uploader.wiki_uploader import WikiUploader


class WikiUploaderTest(TestCase):
    @mock.patch("mwclient.Site")
    @tag("wiki_uploader")
    def test_successful_upload(self, Site):
        Site.return_value.upload.return_value = {
            "upload": {
                "result": "Success",
                "imageinfo": "IMAGE INFO",
            },
        }
        object = WikiUploader(access_token="", access_secret="")

        info = object.upload_file(
            file_name="file_name",
            file_stream=io.BytesIO(),
            description="description",
        )
        self.assertEqual(info, "IMAGE INFO")
        self.assertTrue(Site.called)

    @mock.patch("mwclient.Site")
    @tag("wiki_uploader")
    def test_unsuccessful_api_error(self, Site):
        Site.return_value.upload.side_effect = mwclient.errors.APIError(
            "CODE", "ERROR INFO", {}
        )
        object = WikiUploader(access_token="", access_secret="")

        with self.assertRaises(Exception) as context:
            info = object.upload_file(
                file_name="file_name",
                file_stream=io.BytesIO(),
                description="description",
            )

            self.assertTrue(Site.called)
            self.assertEqual(context, "ERROR INFO")
