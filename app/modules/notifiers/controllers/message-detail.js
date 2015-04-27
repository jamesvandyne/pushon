'use strict';

/**
 * @ngdoc object
 * @name notifiers.Controllers.NotifyHomeController
 * @description NotifyHomeController
 * @requires ng.$scope
 */
angular
    .module('notifiers')
    .controller('MessageDetailController', [
        '$rootScope',
        '$scope',
        'Push',
        'News',
        '$modal',
        '$location',
        '$timeout',
        '$stateParams',
        function ($rootScope, $scope, pushService, newsService, $modal, $location, $timeout, $stateParams) {

            var id = $stateParams.storageIndex;
            console.log(id);
            var p = pushService.dbSetup();
            p.then(function() {
                var p2 = pushService.getStoredMessage(id);
                p2.then(function (result) {
                    var urlRegEx1 = /^http?:\/\//;
                    var urlRegEx2 = /^https?:\/\//;
                    var xt = {};
                    for ( var key in result.extras) {
                        if (result.extras.hasOwnProperty(key)) {
                            var value = result.extras[key];
                            if(urlRegEx1.test(value) || urlRegEx2.test(value)) {
                                xt[key] = '<a href="' + value + '">' + value + "</a>";
                            } else {
                                xt[key] = value;
                            }
                        }
                    }
                    $scope.extras = xt;
                    $scope.message  = result;
                    $scope.message.storageIndex = $stateParams.storageIndex;
                }).catch(function (error) {
                    alert(' error' + error);
                });
            });
        }
    ]);
