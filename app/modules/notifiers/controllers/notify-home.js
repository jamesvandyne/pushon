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

            $scope.modalShowing = false;
            var pushHandler = function () {
                if ($scope.modalShowing) {
                    return
                }
                if ($rootScope.newMessages === undefined) {
                    $rootScope.newMessages = [];
                }
                var message = $rootScope.newMessages.pop();

                if (message !== null && message !== undefined) {
                    $scope.$apply(function () {
                        $scope.newMessage = message;
                    });
                    $scope.modalShowing = true;
                    gotPushModal.$promise.then(function() {
                        // need to do this in a timeout because
                        // the scope object update needs to happen
                        // with the above changes before the show
                        // method gets called. $scope.$apply won't do it
                        // cause it calls digest after the op, not before
                        $timeout(function () {
                            gotPushModal.show();
                        }, 1000);
                    });
                    $timeout(function () {
                        $scope.get_messages();
                    }, 0);
                }
            }

            var gotPushModal = $modal({scope: $scope,
                title: "New push arrived",
                template: "modules/notifiers/views/newMessageModal.html",
                show: false,
                animation: "am-fade-and-scale"
            });

            $rootScope.$on('modal.hide', function () {
                console.log('hide');
                $scope.modalShowing = false;
                if ($rootScope.newMessages.length > 0) {
                    // must have had modal up when a message came in
                    $timeout(function () {
                        pushHandler()
                    }, 0);
                }
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
                        if (typeof saved_msg.extras.form === 'undefined') {
                            saved_msg.form = "short";
                        } else {
                            saved_msg.form = saved_msg.extras.form;
                        }
                        var msg = {
                            storageIndex: i,
                            message: saved_msg.message,
                            form: saved_msg.form,
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
            $scope.$on("$viewContentLoaded", function (event) {
                console.log('view content load captured');
                var p = pushService.dbSetup();
                p.then(function (value) {
                    $scope.get_messages();
                    $timeout(pushHandler);
                });
            });
        }
    ]);
