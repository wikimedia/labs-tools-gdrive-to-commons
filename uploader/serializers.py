from rest_framework import serializers, fields
import datetime


class LocationSerializer(serializers.Serializer):
    latitude = fields.CharField(allow_null=True, allow_blank=True)
    longitude = fields.CharField(allow_null=True, allow_blank=True)
    heading = fields.CharField(allow_null=True, allow_blank=True)


class FileSerializer(serializers.Serializer):
    name = fields.CharField(max_length=200)
    id = fields.CharField(max_length=200)
    date_created = serializers.DateField(allow_null=True, default=datetime.date.today)
    description = fields.CharField(max_length=200)
    categories = serializers.ListField(child=fields.CharField(max_length=400))
    license = fields.CharField(max_length=200)
    author = fields.CharField(max_length=200)
    source = fields.CharField(max_length=200)
    location = LocationSerializer()


class GooglePhotosUploadInputSerializer(serializers.Serializer):
    fileList = FileSerializer(many=True)
    token = fields.CharField(required=True)
