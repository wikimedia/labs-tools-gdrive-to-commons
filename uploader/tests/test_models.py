import datetime

from django.test import TestCase

from uploader.models import FileUpload


class FileUploadModelTest(TestCase):
    def setUp(self):
        self.obj = FileUpload.objects.create(
            number_of_files=10,
            username="test_username",
            uploaded_at=datetime.datetime.now(),
        )

    def test_str_func(self):
        self.assertEqual(
            str(self.obj),
            f"{self.obj.username} : {str(self.obj.number_of_files)} : {str(self.obj.uploaded_at)}",
        )
