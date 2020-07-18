from django.shortcuts import reverse
from django.test import SimpleTestCase, tag
from django.urls import resolve

from gdrive_to_commons.views import PrivacyPolicyTemplateView, UserLogoutView
from uploader.views import HomePageView, UploadPageView


class URLTest(SimpleTestCase):
    @tag("urls")
    def test_privacy_policy_page_url(self):
        url = reverse("privacy_policy")
        self.assertEqual(url, "/privacy-policy/")
        self.assertEqual(resolve(url).func.view_class, PrivacyPolicyTemplateView)

    @tag("urls")
    def test_home_page_url(self):
        url = reverse("home_page")
        self.assertEqual(url, "/")
        self.assertEqual(resolve(url).func.view_class, HomePageView)

    @tag("urls")
    def test_upload_page_url(self):
        url = reverse("upload_page")
        self.assertEqual(url, "/upload/")
        self.assertEqual(resolve(url).func.view_class, UploadPageView)

    @tag("urls")
    def test_logout_page_url(self):
        url = reverse("logout")
        self.assertEqual(url, "/logout/")
        self.assertEqual(resolve(url).func.view_class, UserLogoutView)
