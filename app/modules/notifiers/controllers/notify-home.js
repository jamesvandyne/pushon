'use strict';

/**
 * @ngdoc object
 * @name notifiers.Controllers.NotifyHomeController
 * @description NotifyHomeController
 * @requires ng.$scope
 */
angular
    .module('notifiers')
    .controller('NotifyHomeController', [
        '$rootScope',
        '$scope',
        'Push',
        'News',
        '$modal',
        '$location',
        '$timeout',
        '$stateParams',
        function ($rootScope, $scope, pushService, newsService, $modal, $location, $timeout, $stateParams) {

            var pushHandler = function () {
                if ($rootScope.newMessages === undefined) {
                    $rootScope.newMessages = [];
                }
                var message = $rootScope.newMessages.pop();
                if (message !== null && message !== undefined) {
                    $scope.newMessage = message;
                    gotPushModal.$promise.then(gotPushModal.show);
                    $timeout(function () {
                        gotPushModal.hide();
                    }, 5000);
                    $timeout(function () {
                        $scope.get_messages();
                    });
                }
            }

            $scope.$on("$viewContentLoaded", function (event) {
                console.log('view content load captured');

                var p = pushService.dbSetup();
                p.then(function (value) {
                    $scope.get_messages();
                    $timeout(pushHandler);
                });
            });
            $scope.newMessage = null;
            var gotPushModal = $modal({scope: $scope,
                title: "New push arrived",
                template: "modules/notifiers/views/newMessageModal.html",
                show: false,
                animation: "am-fade-and-scale"
            });
            var pushListenerDereg = $rootScope.$on('pushReceived',
                function (event, messageEvent) {
                    var path = $location.path()
                    if (path[path.length - 1] !== "/") {
                        // force the loading of this page if a new message comes in
                        $location.path("/");
                    } else {
                        pushHandler();
                    }
                }
            );
            $scope.$on('$destroy', function () {
                pushListenerDereg();
            });
            $scope.closeNewMessageModal = function () {
                gotPushModal.hide();
            };
            $scope.get_messages = function () {
                var p = pushService.getStoredMessages(10);
                p.then(function (result) {
                    $scope.last_ten_messages = [];
                    for (var i = 0; i < result.length; i++) {
                        var saved_msg = result[i];
                        if (saved_msg.extras.search === undefined) {
                            saved_msg.extras.search = $rootScope.searchUrl + saved_msg.extras.guid;
                        }
                        var msg = {
                            storageIndex: i,
                            message: saved_msg.message,
                            extras: saved_msg.extras,
                            save_time: saved_msg.save_time,
                            save_time_string: saved_msg.save_time_string,
                            newsItem: null
                        };
                        msg.getNewsItem = function (msg) {
                            newsService.getContentUrl(msg.extras.search).
                                then(function (search_result) {
                                    var ents = search_result.entities;
                                    if (ents.length > 0) {
                                        var story = ents[0];
                                        var url = story.canonical_url;
                                        var headline = story.headline;
                                        console.log('story ' + headline + " at " + url);
                                        if (url.indexOf("http") !== 0) {
                                            url = "http://" + url
                                        }
                                        story.fetch_url = url;
                                        msg.newsItem = story;
                                        msg.searchResult = "ok";
                                    }
                                }).catch(
                                function (error) {
                                    msg.newsItemError = error;
                                    msg.searchResult = "failed";
                                });
                        }
                        $scope.last_ten_messages.push(msg);
                    }
                    $timeout(function () {
                        for (var i = 0; i < $scope.last_ten_messages.length; i++) {
                            var msg = $scope.last_ten_messages[i];
                            msg.getNewsItem(msg);
                        }
                    });
                }).catch(function(error) {
                    alert(' error' + error);
                });
                return "none";
            }
        }
    ]);
