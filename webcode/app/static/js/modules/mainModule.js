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
