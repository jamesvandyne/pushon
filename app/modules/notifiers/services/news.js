'use strict';


/**
 * @ngdoc service
 * @name notifiers.Services.News
 * @description News Service
 */
angular
    .module('notifiers')
    .service('News',[
        '$q', '$http', '$rootScope',
        function ($q, $http, $rootScope) {
            this.prefix = "http:/" + "/search.prod.cmgdigital.com/v2/guid/?g=";
            this.getContentUrl = function (inUrl) {
                var deferred = $q.defer();
                $http({
                    method: 'get',
                    url: inUrl
                })
                .success(function (data, status, headers, config) {
                    deferred.resolve(data);
                }).error(function (data, status, headers, config) {
                    deferred.reject("log push got error " + status);
                });
                return deferred.promise;
            }
        }
    ]);
