(function() {'use strict';}());

// Declare app level module which depends on views, and components
var app = angular.module('mainModule',[
    'ngRoute',
    'ui.bootstrap'
]);

// configure our routes
app.config(function($routeProvider) {
    $routeProvider
        .when('/', { // route for the home page
            templateUrl: 'static/html/home.html',
            controller: 'EditorController',
            activetab: 'home'
        })
        .when('/home', { // route for the home page
            templateUrl: 'static/html/home.html',
            controller: 'EditorController',
            activetab: 'home'
        });
});

app.directive('code', function () {
    return {
        restrict: 'A',
        link: function ($scope, element, attrs) {
            $scope.$watch(attrs.code, function(newValue) {
                $scope.editor.insert('test');
            });
        }
    };
});
