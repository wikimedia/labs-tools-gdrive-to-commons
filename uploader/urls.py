from django.urls import path

from uploader.views import FileUploadViewSet

urlpatterns = [path(r"", FileUploadViewSet.as_view(), name="file_upload")]
