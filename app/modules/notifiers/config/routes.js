'use strict';

/**
 * @ngdoc object
 * @name notifiers.config
 * @requires ng.$stateProvider
 * @description Defines the routes and other config within the notifiers module
 */
angular
    .module('notifiers')
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('notifyhome', {
                    url: '/',
                    templateUrl: 'modules/notifiers/views/home.html',
                    controller: 'NotifyHomeController'

                });
            $stateProvider
                .state('notifycntl', {
                    url: '/notify-control',
                    templateUrl: 'modules/notifiers/views/notifymgmt.html',
                    controller: 'NotifyMgmtController'
                });
            $stateProvider
                .state('bouncecntl', {
                    url: '/bounce-control',
                    templateUrl: 'modules/notifiers/views/bounce-control.html',
                    controller: 'BounceMgmtController'
                });
        }
    ]);
/*angular
    .module('notifiers')
    .config(function($modalProvider) {
         angular.extend($modalProvider.defaults, {
           html: true
         });
    });*/
