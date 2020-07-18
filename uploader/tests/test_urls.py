from django.shortcuts import reverse
from django.test import SimpleTestCase, tag
from django.urls import resolve

from uploader.views import FileUploadViewSet


class URLTest(SimpleTestCase):
    @tag("urls")
    def test_api_upload(self):
        url = reverse("file_upload")
        self.assertEqual(url, "/api/v1.0/upload/")
        self.assertEqual(resolve(url).func.view_class, FileUploadViewSet)
