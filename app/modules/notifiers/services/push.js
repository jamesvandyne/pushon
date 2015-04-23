'use strict';


/**
 * @ngdoc service
 * @name notifiers.Services.Push
 * @description Push Service
 */
angular
    .module('notifiers')
    .service('Push',
    ['$q', '$http', '$rootScope',
        function ($q, $http, $rootScope) {
            this.registered = false;
            this.push_type = "web_sockets";
            this.dbFileName = "noticeDB"
            this.db = null;
            this.tracking_alerts = false;
            this.ready = false;
            this.bounceServers = [];
            //this.fileSystem = null;
            var that = this;

            this.init = function () {
                var deferred = $q.defer();
                var intId = null;
                var setupAll = function () {
                    var finish = function () {
                        that.registerForPush();
                        deferred.resolve(true)
                        $rootScope.searchUrl = "http://search.tie.cmgdigital.com/v2/guid/?g=";
                        that.ready = true;
                    }
                    if (window.deviceReadyCalled === true) {
                        var promises = [];
                        clearInterval(intId, 100);
                        if (that.db === null) {
                            that.db = openDatabase(that.dbFileName, '0.1', that.dbFileName, 512 * 1024)
                            promises.push(that.createMessageTable());
                            promises.push(that.createServerTable());
                            $q.all(promises).then(finish)
                        } else {
                            finish();
                        }
                    }
                }
                if (that.ready) {
                    setTimer(deferred.resolve(true), 1)
                } else {
                    intId = setInterval(setupAll, 10);
                }
                return deferred
            }
            this.dbSetup = function () {
                var deferred = $q.defer();
                var intId = null;
                var intFunction = function () {
                    if (window.deviceReadyCalled === true) {
                        var p = null;
                        clearInterval(intId, 100);
                        if (that.db === null) {
                            that.db = openDatabase(that.dbFileName, '0.1', that.dbFileName, 512 * 1024)
                            p = that.createMessageTable();
                            p.then(deferred.resolve(true));
                        } else {
                            deferred.resolve(true);
                        }
                    }
                }
                intId = setInterval(intFunction, 10)
                return deferred.promise;
            }
            this.dropMessageTable = function () {
                var sql = "DROP TABLE IF EXISTS messages;";
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    transaction.executeSql(sql, [],
                        function (transaction) {
                            deferred.resolve('dropped');
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        }
                    );
                });
                return deferred.promise;
            }
            this.createMessageTable = function () {
                var sql = "CREATE TABLE IF NOT EXISTS messages (";
                sql += "msg_number INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT";
                sql += ", time timestamp";
                sql += ", message_json";
                sql += ");";
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    transaction.executeSql(sql, [],
                        function (transaction) {
                            deferred.resolve('messages table ready');
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        }
                    );
                });
                return deferred.promise;
            }
            this.dropServerTable = function () {
                var sql = "DROP TABLE IF EXISTS servers;";
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    transaction.executeSql(sql, [],
                        function (transaction) {
                            deferred.resolve('dropped');
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        }
                    );
                });
                return deferred.promise;
            }
            this.createServerTable = function () {
                var sql = "CREATE TABLE IF NOT EXISTS servers (";
                sql += "time timestamp";
                sql += ", active boolean";
                sql += ", url text OT NULL PRIMARY KEY";
                sql += ");";
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    transaction.executeSql(sql, [],
                        function (transaction) {
                            deferred.resolve('servers table ready');
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        }
                    );
                });
                return deferred.promise;
            }
            this.saveMessage = function (event) {
                var sql = "insert into messages (time, message_json) values (?,?)";
                var deferred = $q.defer();
                if (event.message === undefined) {
                    alert('undefined message!');
                }
                that.db.transaction(function (transaction) {
                    var now = new Date();
                    var dstring = now.toISOString();
                    var msg_obj = {message: event.message};
                    if (event.extras !== undefined) {
                        msg_obj.extras = event.extras;
                    }
                    transaction.executeSql(sql, [dstring, JSON.stringify(msg_obj)],
                        function (transaction) {
                            deferred.resolve('message saved');
                        },
                        function (trannsaction, error) {
                            deferred.reject(error);
                        }
                    );
                });
                return deferred.promise;
            }
            this.forwardPushMessage = function (event) {
                var deferred = $q.defer();
                var now = new Date();
                var dstring = now.toISOString();
                var msg_obj = {message: event.message};
                var data = {saved_time: dstring, message: msg_obj.message,
                    extras: JSON.stringify(event.extras)};
                // work around concat bug

                that.getBounceServers().then(function (servers) {
                    var headers = {'Content-Type': 'application/x-www-form-urlencoded'};
                    for (var i = 0; i < servers.length; i++) {
                        var spec = servers[i];
                        if (!spec.active) {
                            continue;
                        }
                        $http({
                            method: 'POST',
                            url: spec.url,
                            headers: headers,
                            transformRequest: function (obj) {
                                var str = [];
                                for (var p in obj)
                                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                                return str.join("&");
                            },
                            data: data
                        }).success(function (data, status, headers, config) {
                            if (that.tracking_alerts) {
                                alert('posted!');
                            }
                            deferred.resolve('sent');
                            $rootScope.$emit('pushForwared', spec.url, msg_obj);
                        }).error(function (data, status, headers, config) {
                            deferred.reject("log push got error " + status);
                        });
                    }
                });
                return deferred.promise;
            }
            this.gotPush = function (event) {
                that.saveMessage(event);
                if ($rootScope.newMessages === undefined) {
                    $rootScope.newMessages = [];
                }
                $rootScope.newMessages.push(event);
                $rootScope.$emit('pushReceived', event);
                that.forwardPushMessage(event);
            }
            this.clearMessageHistory = function () {
                that.dropMessageTable()
                    .then(that.createMessageTable());
            }
            this.registerForPush = function () {
                if (window.deviceReadyCalled !== true) {
                    return;
                }
                /* var onFSError = function(error) {
                 alert('got file system init error' + error);
                 }
                 var onFSSuccess= function(fileSystem)  {
                 that.fileSystem = fileSystem;
                 alert('got file system !');
                 }
                 var gotQuota = function(bytes) {
                 window.webkitRequestFileSystem(window.PERSISTENT, bytes, onFSSuccess, onFSError);
                 }
                 if (window.runningInBrowser) {
                 window.navigator.webkitPersistentStorage.requestQuota(51*1024*1024, gotQuota, onFSError);
                 } else {
                 window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onFSError);
                 }
                 */


                if (!window.runningInBrowser) {
                    document.addEventListener("urbanairship.registration", function (event) {
                        if (event.error) {
                            console.log('there was an error registering for push notifications');
                        } else {
                            console.log("Registered with ID: " + event.pushID);
                            if (that.tracking_alerts) {
                                alert('registered!');
                            }
                            that.push_type = "urban airship";
                        }
                    }, false)

                    document.addEventListener("urbanairship.push", function (event) {
                        if (that.tracking_alerts) {
                            alert("Incoming push: " + event.message);
                        }
                        console.log("Urban airship push: " + event.message);
                        that.gotPush(event);
                        /* var new_li = document.createElement("LI");
                         var html = event.message;
                         if (event.extras !== "") {
                         if (event.extras.url !== "") {
                         html += "<a href=\"" + event.extras.url + "\">Here!</a>"
                         }
                         }
                         new_li.innerHTML = html
                         document.getElementById('push').appendChild(new_li);
                         */

                    }, false)

                    // Set tags on a device, that you can push to
                    // https://docs.urbanairship.com/display/DOCS/Server%3A+Tag+API

                    var tags = [
                        "www.ajc.com", "www.local.ajc.com:8000",
                        "www.tie1.ajc.com", "www.tie2.ajc.com", "www.tie3.ajc.com",
                        "www.ajc.com", "www.local.ajc.com:8000",
                        "www.tie1.ajc.com", "www.tie2.ajc.com", "www.tie3.ajc.com"
                    ];
                    for (var i = 1; i < 200; i++) {
                        tags.push("www.fe" + i + ".ajc.com");
                    }
                    PushNotification.setTags(tags, function () {
                        PushNotification.getTags(function (obj) {
                            obj.tags.forEach(function (tag) {
                                console.log("Tag: " + tag);
                            });
                        });
                    });

                    // Set an alias, this lets you tie a device to a user in your system
                    // https://docs.urbanairship.com/display/DOCS/Server%3A+iOS+Push+API#ServeriOSPushAPI-Alias

                    PushNotification.setAlias("test_user_1", function () {
                        PushNotification.getAlias(function (alias) {
                            console.log("The user formerly known as " + alias)
                        });
                    });

                    // Check if push is enabled

                    PushNotification.isPushEnabled(function (enabled) {
                        if (enabled) {
                            console.log("Push is enabled! Fire away!");
                            that.push_type = "urban airship";
                            that.registered = true;
                        }
                    });
                    PushNotification.getIncoming(function (message) {
                        if (message !== null && message !== undefined
                            && message.message != '') {
                            // app was opened by push, so get the message
                            alert('incoming!');
                            that.dbSetup().then(function () {
                                that.getStoredMessages().then(function (result) {
                                    var found = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (message.extras['com.urbanairship.push.PUSH_ID']
                                            === result[i].extras['com.urbanairship.push.PUSH_ID']) {
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (!found) {
                                        that.gotPush(message);
                                    }
                                });
                            });
                        }
                    });
                    PushNotification.enablePush();
                }
            };

            /**
             * @ngdoc function
             * @name notifiers.Services.Push#getStoredMessages
             * @methodOf notifiers.Services.Push
             * @param {int} count max number of items to return
             * @param {int} offset index into total set of saved message at which to start list
             * @return {messages} Returns a promise to return list of previous messages, up to
             */

            this.getStoredMessages = function (count, offset) {
                count = count || 10;
                offset = offset || 0;
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    var sql = "select message_json, time from messages order by time desc limit ? offset ?"
                    transaction.executeSql(sql, [count, offset],
                        function (transaction, result) {
                            var msgs = [];
                            for (var i = 0; i < result.rows.length; i++) {
                                var row = result.rows.item(i);
                                var message = JSON.parse(row['message_json']);
                                message.save_time_string = row['time'];
                                message.save_time = Date.parse(message.save_time_string)
                                msgs.push(message);
                            }
                            deferred.resolve(msgs);
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        });
                });
                return deferred.promise;
            };
            this.getStoredMessage = function (index) {
                var offset = index -1;
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    var sql = "select message_json, time from messages order by time desc limit 1 offset ?"
                    transaction.executeSql(sql, [offset],
                        function (transaction, result) {
                            var msgs = [];
                            if (result.rows.length === 1) {
                                var row = result.rows.item(0);
                                var message = JSON.parse(row['message_json']);
                                message.save_time_string = row['time'];
                                message.save_time = Date.parse(message.save_time_string)
                                deferred.resolve(message);
                            } else {
                                deferred.resolve(null);
                            }
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        });
                });
                return deferred.promise;
            };
            this.addBounceServer = function (url, active) {
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    var now = new Date();
                    var dstring = now.toISOString();
                    var sql = "insert or replace into servers (time, url, active) values (?,?,?)"
                    transaction.executeSql(sql, [dstring, url, active],
                        function (transaction) {
                            deferred.resolve('server saved');
                            $rootScope.$emit('bounceServerSaved', {url: url, time: now, active: active});
                        },
                        function (trannsaction, error) {
                            deferred.reject(error);
                        }
                    );
                });

                return deferred.promise;
            }
            this.deleteBounceServer = function (url) {
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    var sql = "delete from servers where url = ?"
                    transaction.executeSql(sql, [url],
                        function (transaction) {
                            deferred.resolve('server deleted');
                            $rootScope.$emit('bounceServerDeleted', {url: url});
                        },
                        function (trannsaction, error) {
                            deferred.reject(error);
                        }
                    );
                });

                return deferred.promise;
            }
            this.getBounceServers = function () {
                var deferred = $q.defer();
                that.db.transaction(function (transaction) {
                    var sql = "select url, active, time from servers"
                    transaction.executeSql(sql, [],
                        function (transaction, result) {
                            var servers = [];
                            for (var i = 0; i < result.rows.length; i++) {
                                var spec = {};
                                var row = null;
                                row = result.rows.item(i);
                                spec.url = row['url'];
                                spec.time_string = row['time'];
                                spec.time = Date.parse(spec.time_string)
                                spec.active = row['active'];
                                if (spec.active == "true") {
                                    spec.active = true;
                                }
                                if (spec.active == "false") {
                                    spec.active = false;
                                }
                                servers.push(spec);
                            }
                            deferred.resolve(servers);
                        },
                        function (transaction, error) {
                            deferred.reject(error);
                        });
                });
                return deferred.promise;
            }
            this.init();
        }
    ]);
