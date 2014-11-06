#!/usr/bin/env python
import requests
from pprint import pprint
from bitlyapi import BitLy
from bitlyapi.bitly import APIError
import urbanairship as ua

# these four credentials values should be correct to have
# real values, then placed in creds.py in this directory
#
BITLY_SMS_USERNAME = ""
BITLY_SMS_TOKEN = ""
app_key = ""
master_secret = ""
from creds import *



real_url = "http://search.prod.cmgdigital.com/v2/guid/?g=https://identifiers.cmgdigital.com/medley/prod/news.medleystory/2632030/"
only_guid = "https://identifiers.cmgdigital.com/medley/prod/news.medleystory/2632030/"

use_bitly = False
if use_bitly:
    with open('bitly_url.txt', 'r') as f:
        buff = f.read().split('\n')
        bitly_url = buff[0].strip()

        #bitly_url = 'http://bit.ly/1x4fa6y'
        still_good = False
        r = requests.get(bitly_url,  allow_redirects=False)

    if r.status_code == 301:
        new = r.headers['location']
        if new == real_url:
            print "bitly url is still working"
            still_good = True
    if not still_good:
        print "bitly url no longer works, making a new one"
        username = BITLY_SMS_USERNAME
        token = BITLY_SMS_TOKEN
        bitly = BitLy(username.strip(), token.strip())
        result = bitly.shorten(longUrl=real_url)
        bitly_url = result['url']
    with open('bitly_url.txt', 'w+') as f:
        f.write(bitly_url + "\n")
        f.write('# generated by req.py\n')

airship = ua.Airship(app_key, master_secret)

push = airship.create_push()
push.audience = ua.all_
text="Snakey!"

if use_bitly:
    data = {'search': bitly_url}
else:
    data = {'guid': only_guid}
push.notification = ua.notification(alert=text,
                                    ios=ua.push.payload.ios(alert=text, extra=data),
                                    android=ua.push.payload.android(alert=text, extra=data),
)

push.device_types = ua.all_
push.send()
