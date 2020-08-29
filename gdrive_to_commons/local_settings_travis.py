# Fetch the following GOOGLE_* from https://console.developers.google.com
import os

from gdrive_to_commons.settings import BASE_DIR

GOOGLE_API_DEV_KEY = "<Google API Dev Key>"
GOOGLE_CLIENT_ID = "<Your Google app client id>"
GOOGLE_APP_ID = "<Your Google APP ID>"

# Generate a Mediawiki OAuth consumer using
# https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
SOCIAL_AUTH_MEDIAWIKI_KEY = "<OAuth consumer client id>"
SOCIAL_AUTH_MEDIAWIKI_SECRET = "<OAuth consumer client secret>"
SOCIAL_AUTH_MEDIAWIKI_URL = "<Wiki to authenticate to>"
SOCIAL_AUTH_MEDIAWIKI_CALLBACK = "oob"

WIKI_URL = "https://test.wikipedia.org/w/api.php"
STATIC_URL_DEPLOYMENT = "/static/"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "%5r@$^)+$$#$%ˆˆ123fasdfSDFFSDF1234asdfasfd$@#DSSFDZzzzSAe3n%fm_"

# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "travis_ci_db",
        "USER": "travis",
        "PASSWORD": "",
        "HOST": "127.0.0.1",
    }
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/
STATIC_URL = "/google-drive-photos-to-commons/static/"
