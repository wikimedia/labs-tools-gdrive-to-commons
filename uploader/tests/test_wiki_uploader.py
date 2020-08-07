import io
from unittest import mock

import mwclient
from django.test import TestCase, tag

from uploader.wiki_uploader import get_initial_page_text, WikiUploader


class WikiUploaderTest(TestCase):
    @mock.patch("mwclient.Site")
    @tag("wiki_uploader")
    def test_successful_upload(self, Site):
        Site.return_value.upload.return_value = {
            "result": "Success",
            "imageinfo": "IMAGE INFO",
        }
        object = WikiUploader()

        status, info = object.upload_file(
            file_name="file_name", file_stream=io.BytesIO(), description="description",
        )
        self.assertTrue(status)
        self.assertEqual(info, "IMAGE INFO")
        self.assertTrue(Site.called)

    @mock.patch("mwclient.Site")
    @tag("wiki_uploader")
    def test_unsuccessful_type_error(self, Site):
        Site.upload.return_value.raiseError.side_effect = TypeError("Missing Filename")
        object = WikiUploader()

        status, info = object.upload_file(
            file_name="file_name", file_stream=io.BytesIO(), description="description"
        )

        self.assertFalse(status)
        self.assertEqual(info, {})
        self.assertTrue(Site.called)

    @mock.patch("mwclient.Site")
    @tag("wiki_uploader")
    def test_unsuccessful_permission_error(self, Site):
        Site.upload.return_value.raiseError.side_effect = (
            mwclient.errors.InsufficientPermission
        )
        object = WikiUploader()

        status, info = object.upload_file(
            file_name="file_name", file_stream=io.BytesIO(), description="description"
        )
        self.assertFalse(status)
        self.assertEqual(info, {})
        self.assertTrue(Site.called)
