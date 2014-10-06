npm install;
grunt build;
cordova plugins add https://github.com/urbanairship/phonegap-ua-push.git
cordova restore plugins --experimental;
cordova platform add android;
cordova run android
