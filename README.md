pushon
======

Urban Airship push testing cordova app


Rationale:

The Urban Airship (UA) push altert support being added to medley
presents some barriers to the standard development and QA workflow,
and this app is designed to overcome those barriers.

When the UA support is in production, the API that is used to trigger
a push notification from a breaking news alert requires credentials
and application key information. This is supplied to the UA push
service to validate the UA account, and to identify the specific
devices that will be targeted.

These production credentials will (according to the current plan) be
owned by the individual media properties (are the normal same market
group of properties) rather than by CMG Digital. These credentials
and need to be controlled by the media property personnel, rather
than by CMG Digital personnel. That makes it difficult to create
a reliable plan for ensuring that test messages can be sent to
test devices without any risk of sending test alerts to production
end users.

Another point is the difficulty of using the production mobile
app to test the medley UA integration feature. The app will have
its own production lifecycle with new version coming out
periodically. It is also not designed to provide simple validation
of push messages. Also, using test apps for iOS can be tricky and
maintenance prone.

This app was built to avoid or mitigate these factors. It provides a
simple and direct validation that push messages arrive and a visual
mechanism for inspecting the full contents of the messages.  It can be
used under UA with a different US credential set and app ID than any
production versions. This will allow the development and testing of
push API integration features in medley without any danger of
accidentally messaging end users, and without the need for CMG Digital
personnel to have access to production credentials owned by media
properties.

The simplest use case for this app is for the develper or QA person
who needs to test UA push to load it on an Android device that is
in their physical posession. Any messages sent using the development/QA
credentials will reach this device.

In order to simplify the process of testing that the test app itself
is working, there is a python push sender in "push.py". When supplied
with the right credentials, this simple python script will create a
simulated medley alert message and sending it usign the UA push service
API (emulating the medley functionality). If this works, i.e. if running
it delivers a push to the device on which the test client was installed,
then the test client is working and the credentials and app ID are
correct. Any failure to deliver from medley is therefore likely to
be a problem with the medley integration (or usual problems such as no
celery queue workers running).

A further feature is avaiable that may be of use for various testing
scenarios. There is a companion web service designed to accept forwarded
records of the delivered push messages. The app has a "bounce server"
feature that allows the user to enter the address of a server of this
kind and enable forwarding to it. If the user does this, then leaves the
app running on the device, then any subsequent push messages will be
forwarded to all configured bounce servers. By configuring a test
device and leaving it plugged in to a charger, it would be possible
for anyone to then use that device to perform either manual or
automated testing of the push feature by monitoring the delivery
of push messages to the "bounce server(s)".

The bounce server is an extremely simple django app that was developed
with heroku hosting in mind, which is free at the scale level required
by this app. It is available at https://github.com/dlparker/pushmirror
