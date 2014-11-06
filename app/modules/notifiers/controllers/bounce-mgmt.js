    'use strict';

    /**
     * @ngdoc object
     * @name notifiers.Controllers.NotifyMgmtController
     * @description NotifyMgmtController
     * @requires ng.$scope
     */
    angular
        .module('notifiers')
        .controller('BounceMgmtController', [
            '$rootScope',
            '$scope',
            'Push',
            '$modal',
            '$location',
            function ($rootScope, $scope, pushService, $modal, $location) {
                $scope.$on("$viewContentLoaded", function(event, viewConfig) {
                    console.log('view content load captured');
                    var p = pushService.dbSetup();
                    p.then(function(value) {$scope.getServers();});
                });
                $rootScope.$on('bounceServerSaved', function(event) {
                    $scope.getServers();
                });
                $rootScope.$on('bounceServerDeleted', function(event) {
                    $scope.getServers();
                });
                $scope.getServers = function() {
                    var p = pushService.getBounceServers()
                    p.then(function (result) {
                        $scope.servers = result;
                    }).catch(function (error) {
                        alert('getServers got error' + error);
                    });
                    return "none";
                };
                $scope.addServerData = {
                  url: "http://blooming-beach-4353.herokuapp.com/log_push.html",
                  active: true
                };
                var addServerModal = $modal({scope: $scope,
                    title: "Add a bounce server",
                    template: 'modules/notifiers/views/addServerModal.html',
                    show: false,
                    animation: "am-fade-and-scale",
                    prefixEvent: "addServerModal"
                });
                $scope.showAddServerModal = function () {
                    addServerModal.$promise.then(addServerModal.show);
                };
                $scope.addServer = function () {
                    addServerModal.hide();
                    pushService.addBounceServer($scope.addServerData.url,
                                                $scope.addServerData.active);
                };
                $scope.cancelAddServer = function () {
                    addServerModal.hide();
                };
                var deleteServerModal = $modal({scope: $scope,
                    title: "Delete a bounce server",
                    template: 'modules/notifiers/views/deleteServerModal.html',
                    show: false,
                    animation: "am-fade-and-scale",
                    prefixEvent: "deleteServerModal"
                });
                $scope.deleteServerData = {
                  url: null
                };

                $scope.showDeleteServerModal = function (url) {
                    $scope.deleteServerData.url = url
                    deleteServerModal.$promise.then(deleteServerModal.show);
                };
                $scope.deleteServer = function () {
                    deleteServerModal.hide();
                    pushService.deleteBounceServer($scope.deleteServerData.url)
                };
                $scope.cancelDeleteServer = function () {
                    deleteServerModal.hide();
                };

                $scope.editServerData = {
                  url: null,
                  active: null
                };

                var editServerModal = $modal({scope: $scope,
                    title: "Edit bounce server record",
                    template: 'modules/notifiers/views/editServerModal.html',
                    show: false,
                    animation: "am-fade-and-scale",
                    prefixEvent: "editServerModal"
                });
                $scope.showEditServerModal = function (url) {
                    for (var i = 0; i < $scope.servers.length; i++) {
                        var spec = $scope.servers[i];
                        if (spec.url === url) {
                             $scope.editServerData.url = spec.url;
                             $scope.editServerData.active = spec.active;
                             break;
                        }
                    }
                    editServerModal.$promise.then(editServerModal.show);
                };
                $scope.editServer = function () {
                    editServerModal.hide();
                    // add does the update
                    pushService.addBounceServer($scope.editServerData.url,
                                                $scope.editServerData.active);
                };
                $scope.cancelEditServer = function () {
                    editServerModal.hide();
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
