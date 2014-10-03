        'use strict';

        /**
         * @ngdoc object
         * @name notifiers.Controllers.NotifyMgmtController
         * @description NotifyMgmtController
         * @requires ng.$scope
         */
        angular
            .module('notifiers')
            .controller('NotifyMgmtController', [
                '$rootScope',
                '$scope',
                'Push',
                '$modal',
                '$location',
                function ($rootScope, $scope, pushService, $modal, $location) {
                    $scope.registered = function () {
                        return pushService.registered;
                    }
                    $scope.push_type = function () {
                        return pushService.push_type;
                    }
                    $scope.fakeMessageText = {
                      text: "This is a fake message",
                      guid: "http:/" + "/bit.ly/1pLV3UO"
                    };

                    var fakePushModal = $modal({scope: $scope,
                        title: "Fake a push message",
                        template: 'modules/notifiers/views/fakeModal.html',
                        show: false,
                        animation: "am-fade-and-scale",
                        prefixEvent: "pushFake"
                    });
                    $scope.showFakePushModal = function () {
                        fakePushModal.$promise.then(fakePushModal.show);
                    };
                    $scope.sendFake = function () {
                        fakePushModal.hide();
                        pushService.gotPush({message: $scope.fakeMessageText.text,
                            extras: {guid: $scope.fakeMessageText.guid,
                                'com.urbanairship.push.APID': "c7a31fe2-11ba-41e2-b28e-05a3e7d7dcfb",
                                'com.urbanairship.push.PUSH_ID': "6ec99680-47e7-11e4-b417-90e2ba027a20"
                            }
                        });
                    };
                    $scope.cancelSendFake = function () {
                        fakePushModal.hide();
                    };
                    var clearHistoryModal = $modal({scope: $scope,
                        title: "Clear Message History",
                        template: 'modules/notifiers/views/clearHistoryModal.html',
                        show: false,
                        animation: "am-fade-and-scale",
                        prefixEvent: "clearHistory"
                    });
                    $scope.showClearHistoryModal = function () {
                        clearHistoryModal.$promise.then(clearHistoryModal.show);
                    };
                    $scope.clearHistory = function () {
                        clearHistoryModal.hide();
                        pushService.clearMessageHistory();
                    };
                    $scope.cancelClearHistory = function () {
                        clearHistoryModal.hide();
                    };
                    var pushListenerDereg = $rootScope.$on('pushReceived',
                        function(event, messageEvent) {
                            var path = $location.path()
                            if (path[path.length -1] !== "/") {
                                // force the loading of this page if a new message comes in
                                $location.path("/");
                            }
                        }
                    );
                    $scope.$on('$destroy', function() {
                        pushListenerDereg();
                    });
                }
            ]);
