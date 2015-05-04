npm install;
grunt build;
cordova plugins add https://github.com/urbanairship/phonegap-ua-push.git
cordova restore plugins --experimental;
if [[ -n $1 ]] && [[ $1 == "ios" ]]
then
    cordova platform add ios;
    cordova run ios
else
    cordova platform add android;
    cordova run android
fi
