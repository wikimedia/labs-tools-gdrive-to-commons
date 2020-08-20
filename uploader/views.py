import io

from django.conf import settings
from django.db.models import Sum
from django.views.generic import TemplateView
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from rest_framework import views, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from uploader.models import FileUpload
from uploader.serializers import GooglePhotosUploadInputSerializer
from uploader.wiki_uploader import WikiUploader, get_initial_page_text


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

    def get_google_drive_service(self, access_token):
        credentials = Credentials(token=access_token)
        service = build("drive", "v3", credentials=credentials)
        return service

    def post(self, request, format=None, *args, **kwargs):
        serializer = GooglePhotosUploadInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        file_list = validated_data.get("fileList", None)

        drive_service = self.get_google_drive_service(
            access_token=validated_data.get("token", None)
        )
        social_auth = self.request.user.social_auth.get(
            provider="mediawiki"
        ).extra_data["access_token"]
        wiki_uploader = WikiUploader(
            host=settings.WIKI_URL,
            consumer_secret=settings.SOCIAL_AUTH_MEDIAWIKI_SECRET,
            consumer_token=settings.SOCIAL_AUTH_MEDIAWIKI_KEY,
            access_token=social_auth.get("oauth_token", None),
            access_secret=social_auth.get("oauth_token_secret", None),
        )

        upload_responses = []

        file_upload_log = FileUpload(username=request.user.username)

        count = 0
        for file in file_list:
            request = drive_service.files().get_media(fileId=file["id"])
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False

            while done is False:
                download_status, done = downloader.next_chunk()

            page_text = get_initial_page_text(
                description=file["description"],
                license=file["license"],
                date_created=file["date_created"],
                author=file["author"],
                source=file["source"],
                location=file["location"],
                categories=file["categories"],
            )

            uploaded, image_info = wiki_uploader.upload_file(
                file_name=file["name"], file_stream=fh, description=page_text
            )

            upload_status = {
                "details": image_info,
                "name": file["name"],
                "id": file["id"],
            }

            if uploaded:
                upload_status.update({"status": "SUCCESS"})
                count += 1
            else:
                upload_status.update({"status": "ERROR"})

            upload_responses.append(upload_status)

        file_upload_log.number_of_files = count
        file_upload_log.save()

        return Response(data=upload_responses, status=status.HTTP_200_OK)
