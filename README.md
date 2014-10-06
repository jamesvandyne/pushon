pushon
======

Urban Airship push testing cordova app


Rationale:

The Urban Airship (UA) push altert support being added to medley
presents some barriers to the standard development and QA workflow,
and this app is designed to overcome those barriers. When the UA
support is in production, the API that is used to trigger a push
notification from a breaking news alert requires credentials and
application key information. This is supplied to the UA push service
to validate the UA account, and to identify the specific devices
that will be target