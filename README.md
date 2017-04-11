# FT Labs Absorber
It uses RSS feeds to find audio versions of FT articles.

## Description

### In short...
The absorber reads RSS feeds from 3rd party providers of audio versions of the FT. 

A check is run every two minutes.

For each item in the RSS feed, the absorber checks for a copy of the audio file (and an OGG version of it) in an S3 bucket, and for metadata associated with that file in a DynamoDB table.

If no file is found in the S3 bucket, a copy will be retrieved from the source the RSS feed points to, convert it to an OGG version and then upload both the source file and the OGG to the S3 bucket. 

Any metadata contained in the RSS for the file (as query parameters on the audio file URL) will be stored in the DynamoDB table.

A file will only ever be overwritten if the existing file was created using an automated voice, and a new human-read version is available. At this point, all existing metadata and audio files will be replaced with the new human version.

An email will be sent to individuals listed in the `ALERT_MAIL_RECIPIENTS` env var for each human-read audio file that is absorbed.

### Existing items
If a copy of the audio file already exists in the S3 bucket, or an entry exists in the DynamoDB table, it won't be updated. If a newer file exists, the existing MP3 file and database entry must be deleted for the absorber to add them back again.

## Running the app

Clone this repo, set your...

## Environment Variables

Environment variables can be set in a .env file.

The absorber needs the following environment variables to run:

#### AWS_ACCESS_KEY_ID

- An AWS access key tied to an account with S3/DynamoDB read/write permissions

#### AWS_SECRET_ACCESS_KEY

- The secret key for the access key.

#### AUDIO_RSS_ENDPOINTS

- Valid JSON object describing the RSS feeds to parse
Example JSON
```
{
	"data" : [
		{
			"provider" : "third-party",
			"provider_name" : "First 3rd Party Provider"
			"url" : "https://validrssurl.com/feed",
			"type" : "rss"
		}
	]
}
```

The `provider` value is the shortname that will be used to identify providers in the DynamoDB tables. The `provider_name` value is how you wish the 3rd party's name to be displayed on client-side applications.

The type can be either `rss` for a standard RSS feed, or `itunes` for and iTunes XML feed. 

#### AWS_AUDIO_BUCKET

- The name of the S3 bucket that audio will be uploaded to.

#### DELIVERED_MEDIA_FORMAT

- The expected file format of the files described by the RSS feeds

#### AWS_AUDIT_TABLE

- The name of the DynamoDB table for logging the interations the absorber has with the RSS feeds and audio files therein.

#### AWS_METADATA_TABLE

- The name of the DynamoDB table for storing any metadata associated with audio files.

#### AWS_REGION

- The AWS region code for your AWS resources.

#### SENTRY_DSN

- The URL for Sentry error alerts

#### ALERT_MAIL_RECIPIENTS

- The email address of the person who should be notified if the app breaks.

#### MAIL_RECIPIENTS

- A comma separated list of email addresses that will be alerted when a new audio file has been detected and stored.

#### MAIL_POST_AUTH_TOKEN

- A valid auth token for the FTs emailing API.

#### MAIL_FROM_SUBDOMAIN

#### MAIL_FROM_PREFIX

#### MAIL_FROM_NAME

#### MAIL_POST_URL

#### ADMIN_URL

- An absolute URL for the FT Labs Ingestion dashboard that displays the state of audio on the FT.

#### DEBUG_FFMPEG

- Boolean value. `true` if you want the stderr/stdout of the FFMPEG jobs logged to the console. 

#### REQUIRED_METADATA_PARAMETERS
- A comma-separated list of keys that RSS feed item must expose to the absorber to be considered valid.

#### REQUIRED_FEED_ITEMS

- A comma-separated list of keys that RSS feeds must expose to the absorber to be considered valid.

#### FT_AVAILABILITY_SERVICE_URL

- The URL for the [audio-available](https://audio-available.ft.com) service.

#### FT_AVAILABILITY_SERVICE_CACHE_PURGE_KEY

- The key to trigger a cache purge on at the `/purge` endpoint of the availability service when a new item has been absorbed.
