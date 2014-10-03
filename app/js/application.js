'use strict';

angular
    .module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

angular
    .module(ApplicationConfiguration.applicationModuleName)
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.hashPrefix('!');
        }
    ]);

//Then define the init function for starting up the application
angular
    .element(document)
    .ready(function () {
        if (window.location.hash === '#_=_') {
            window.location.hash = '#!';
        }
        document.addEventListener('deviceready', handleDeviceReady, false);
        // timing problems prevent it from being called sometimes.
        setTimeout(handleDeviceReady, 250);
        angular
            .bootstrap(document,
            [ApplicationConfiguration.applicationModuleName])
    });
