(function() {'use strict';}());

// Declare app level module which depends on views, and components
var app = angular.module('mainModule',[
    'ngRoute',
    'ui.bootstrap',
    'angularResizable'
]);

// configure our routes
app.config(function($routeProvider) {
    $routeProvider
        .when('/', { // route for the home page
            templateUrl: 'static/html/home.html',
            controller: 'EditorController',
            activetab: 'home'
        })
        .when('/settings', {
            templateUrl: 'static/html/settings.html',
            controller: 'SettingsController',
            activetab: 'none'
        })
        .when('/projects/:project', { // route for the home page
            templateUrl: 'static/html/home.html',
            controller: 'EditorController',
            activetab: 'home'
        });
});

app.directive('rowToolbar', function() {
    return {
        templateUrl: '/static/html/row-toolbar.html'
    };
});

app.directive('columnToolbar', function() {
    return {
        templateUrl: '/static/html/column-toolbar.html'
    };
});

app.directive('scrollLogger', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('scroll', function () {
                scope.$emit('scrollConsole');
            });
        }
    };
});

app.filter('iif', function () {
    return function(input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
    };
});