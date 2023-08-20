from django.conf import settings
from django.db.models import Sum
from django.views.generic import TemplateView
from rest_framework import views, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from uploader.google_drive_service import GoogleDriveService
from uploader.models import FileUpload
from uploader.serializers import GooglePhotosUploadInputSerializer
from uploader.utils import get_initial_page_text
from uploader.wiki_uploader import WikiUploader


class HomePageView(TemplateView):
    template_name = "home.html"

    def get_context_data(self, **kwargs):
        context = super(HomePageView, self).get_context_data(**kwargs)
        context["count"] = FileUpload.objects.aggregate(Sum("number_of_files"))[
            "number_of_files__sum"
        ]
        return context


class UploadPageView(TemplateView):
    template_name = "upload.html"
    extra_context = {
        "developer_key": settings.GOOGLE_API_DEV_KEY,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "google_app_id": settings.GOOGLE_APP_ID,
    }


class FileUploadViewSet(views.APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None, *args, **kwargs):
        serializer = GooglePhotosUploadInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file_list = serializer.validated_data.get("fileList", None)
        if not file_list:
            return Response(
                {"error": "No files found in the request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_drive_service = GoogleDriveService(
            access_token=serializer.validated_data.get("token")
        )
        social_auth = self.request.user.social_auth.get(
            provider="mediawiki"
        ).extra_data["access_token"]

        wiki_uploader = WikiUploader(
            access_token=social_auth.get("oauth_token", None),
            access_secret=social_auth.get("oauth_token_secret", None),
        )

        upload_responses = []
        file_upload_log = FileUpload(username=request.user.username)

        number_of_files_count = 0
        for file in file_list:
            # Download files from Google Drive;
            downloaded_file_stream = google_drive_service.get_download_file_stream(
                file=file
            )
            page_text = get_initial_page_text(
                description=file["description"],
                item_license=file["license"],
                date_created=file["date_created"],
                author=file["author"],
                source=file["source"],
                location=file["location"],
                categories=file["categories"],
            )
            upload_status = {
                "name": file["name"],
                "id": file["id"],
            }
            try:
                image_info = wiki_uploader.upload_file(
                    file_name=file["name"],
                    file_stream=downloaded_file_stream,
                    description=page_text,
                )
                upload_status.update({"status": "SUCCESS", "details": image_info})
                number_of_files_count += 1
            except Exception as ex:
                upload_status.update({"status": "ERROR", "details": ex})

            upload_responses.append(upload_status)

        file_upload_log.number_of_files = number_of_files_count
        file_upload_log.save()

        return Response(data=upload_responses, status=status.HTTP_200_OK)
