from django.test import TestCase, tag

from uploader.serializers import (
    FileSerializer,
    GooglePhotosUploadInputSerializer,
    LocationSerializer,
)


class GooglePhotosUploadInputSerializerTest(TestCase):
    def setUp(self):
        self.serializer_class = GooglePhotosUploadInputSerializer

    @tag("serializers")
    def test_serializer_fields(self):
        serializer = self.serializer_class()
        self.assertEqual(
            sorted(list(serializer.data.keys())), sorted(["fileList", "token"])
        )

    @tag("serializers")
    def test_valid_serializer_data_single_file(self):
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
                }
            ],
        }
        [
            x.update(
                {
                    "location": {"latitude": "", "longitude": "", "heading": "",},
                    "categories": ["STRING"],
                }
            )
            for x in data["fileList"]
        ]
        serializer1 = self.serializer_class(data=data)
        self.assertTrue(serializer1.is_valid())

        [
            x.update(
                {
                    "location": {"latitude": "10", "longitude": "10", "heading": "",},
                    "categories": ["STRING", "STRING2"],
                }
            )
            for x in data["fileList"]
        ]
        serializer2 = self.serializer_class(data=data)
        self.assertTrue(serializer2.is_valid())

        [
            x.update(
                {
                    "location": {
                        "latitude": "10",
                        "longitude": "20",
                        "heading": "120",
                    },
                    "categories": ["STRING"],
                }
            )
            for x in data["fileList"]
        ]
        serializer3 = self.serializer_class(data=data)
        self.assertTrue(serializer3.is_valid())


class FileSerializerTest(TestCase):
    def setUp(self):
        self.serializer_class = FileSerializer

    @tag("serializers")
    def test_serializer_fields(self):
        serializer = self.serializer_class()
        self.assertEqual(
            sorted(list(serializer.data.keys())),
            sorted(
                [
                    "name",
                    "id",
                    "date_created",
                    "description",
                    "license",
                    "author",
                    "source",
                    "categories",
                    "location",
                ]
            ),
        )

    @tag("serializers")
    def test_valid_serializer_data(self):
        data1 = {
            "name": "STRING",
            "id": "STRING",
            "date_created": "1970-01-01",
            "description": "STRING",
            "license": "STRING",
            "author": "STRING",
            "source": "STRING",
            "categories": ["STRING", "STRING2"],
            "location": {"latitude": "", "longitude": "", "heading": "",},
        }

        data2 = {
            "name": "STRING",
            "id": "STRING",
            "date_created": "1970-01-01",
            "description": "STRING",
            "license": "STRING",
            "author": "STRING",
            "source": "STRING",
            "categories": ["STRING"],
            "location": {"latitude": "10", "longitude": "10", "heading": "",},
        }

        data3 = {
            "name": "STRING",
            "id": "STRING",
            "date_created": "1970-01-01",
            "description": "STRING",
            "license": "STRING",
            "author": "STRING",
            "source": "STRING",
            "categories": ["STRING"],
            "location": {"latitude": "10", "longitude": "10", "heading": "10",},
        }

        serializer1 = self.serializer_class(data=data1)
        serializer2 = self.serializer_class(data=data2)
        serializer3 = self.serializer_class(data=data3)
        self.assertTrue(serializer1.is_valid())
        self.assertTrue(serializer2.is_valid())
        self.assertTrue(serializer3.is_valid())


class LocationSerializerTest(TestCase):
    def setUp(self):
        self.serializer_class = LocationSerializer

    @tag("serializers")
    def test_serializer_fields(self):
        serializer = self.serializer_class()
        self.assertEqual(
            sorted(list(serializer.data.keys())),
            sorted(["latitude", "longitude", "heading"]),
        )

    @tag("serializers")
    def test_valid_serializer_data(self):
        data1 = {
            "latitude": "",
            "longitude": "",
            "heading": "",
        }

        data2 = {
            "latitude": "10",
            "longitude": "10",
            "heading": "",
        }

        data3 = {
            "latitude": "10",
            "longitude": "10",
            "heading": "10",
        }

        serializer1 = self.serializer_class(data=data1)
        serializer2 = self.serializer_class(data=data2)
        serializer3 = self.serializer_class(data=data3)
        self.assertTrue(serializer1.is_valid())
        self.assertTrue(serializer2.is_valid())
        self.assertTrue(serializer3.is_valid())
