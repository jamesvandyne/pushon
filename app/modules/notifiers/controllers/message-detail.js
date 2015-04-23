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
                    $scope.message = result;
                    $scope.message.storageIndex = $stateParams.storageIndex;
                    $scope.extras = [];
                    for (var property in result.extras) {
                        if (result.extras.hasOwnProperty(property)) {
                            $scope.extras.push({name: property, value: result.extras[property]})
                        }
                    }
                }).catch(function (error) {
                    alert(' error' + error);
                });
            });
        }
    ]);
