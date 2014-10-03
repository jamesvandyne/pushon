'use strict';

describe('Controller: notify-mgmtController', function () {

    beforeEach(module('notifiers'));

    var notify
    -mgmtController,
        scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        notify - mgmtController = $controller('notify-mgmtController', {
            $scope: scope
        });
    }));

    it('should ...', function () {

    });
});
