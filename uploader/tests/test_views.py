from unittest import mock

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, Client, tag
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from social_django.models import UserSocialAuth

from uploader.models import FileUpload


class HomePageViewTest(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        FileUpload.objects.create(number_of_files=3, username="USERNAME")
        FileUpload.objects.create(number_of_files=2, username="USERNAME2")

    @tag("views")
    def test_context_data(self):
        url = reverse("home_page")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["count"], 5)


class UploadPageViewTest(TestCase):
    def setUp(self) -> None:
        self.client = Client()

    @tag("views")
    def test_context_data(self):
        url = reverse("upload_page")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["developer_key"], settings.GOOGLE_API_DEV_KEY)
        self.assertEqual(response.context["client_id"], settings.GOOGLE_CLIENT_ID)
        self.assertEqual(response.context["google_app_id"], settings.GOOGLE_APP_ID)


class FileUploadViewSetTest(APITestCase):
    def setUp(self) -> None:
        self.client = APIClient()

        user = User.objects.create(username="username", password="password")
        UserSocialAuth.objects.create(provider="mediawiki", user=user)
        user.social_auth.get(provider="mediawiki").set_extra_data(
            {"access_token": {"oauth_token": "foobar", "oauth_token_secret": "foobar"}}
        )

        self.client.force_authenticate(user)

    @tag("views")
    def test_get_method(self):
        url = reverse("file_upload")
        response = self.client.get(url, {})
        self.assertEqual(response.status_code, 405)

    @mock.patch("mwclient.Site")
    @mock.patch("googleapiclient.http.MediaIoBaseDownload.next_chunk")
    @tag("views")
    def test_valid_data(self, mock_downloader, Site):
        Site.return_value.upload.return_value = {
            "result": "Success",
            "imageinfo": "IMAGE INFO",
        }
        mock_downloader.return_value = ("foo", True)

        url = reverse("file_upload")
        data = {
            "token": "STRING",
            "fileList": [
                {
                    "name": "STRING",
                    "id": "STRING",
                    "date_created": "1970-01-01",
                    "description": "STRING",
                    "license": "STRING",
                    "author": "STRING",
                    "source": "STRING",
                    "location": {"latitude": "10", "longitude": "10", "heading": "10",},
                }
            ],
        }
        response = self.client.post(url, data=data, format="json")

        self.assertTrue(Site.called)
        self.assertTrue(mock_downloader.called)
        self.assertEqual(response.status_code, 200)

    @mock.patch("mwclient.Site")
    @mock.patch("googleapiclient.http.MediaIoBaseDownload.next_chunk")
    @tag("views")
    def test_invalid_data(self, mock_downloader, Site):
        Site.return_value.upload.return_value = {
            "result": "Success",
            "imageinfo": "IMAGE INFO",
        }
        mock_downloader.return_value = ("foo", True)

        url = reverse("file_upload")
        data = {
            "token": "",
            "fileList": [
                {
                    "name": "STRING",
                    "id": "STRING",
                    "date_created": "STRING",
                    "description": "STRING",
                    "license": "STRING",
                    "author": "STRING",
                    "source": "STRING",
                    "location": {"latitude": "10", "longitude": "10", "heading": "",},
                }
            ],
        }
        response = self.client.post(url, data=data, format="json")
        self.assertEqual(response.status_code, 400)
