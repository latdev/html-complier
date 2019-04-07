const app = angular.module('appmain', []);


app.run(function($rootScope) {

    $rootScope.god = function(method, name, params) {
        console.log(method, name, params);
    };

});
