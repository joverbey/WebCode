app.controller('MainController', ['$scope', '$http', '$route', '$window',
        function($scope, $http, $route, $window) {
    $scope.socket = new Socket('ws://' + $window.location.host + '/websocket');
    $scope.isAdmin = false;
    $scope.$route = $route;
    $scope.isOpen = false;
    $scope.templates = [];
    $scope.projects = [];
    $scope.selectedProject = 1;

    var closeDropdown = function() {
        $scope.isOpen = false;
    };

    var getTemplates = function() {
        $http.get('/api/templates')
                .then(function(response) {
                    $scope.templates = response.data.data;
                },
                function(error) {
                    console.log(error);
                });

    };

    var getProjects = function() {
        $http.get('/api/projects')
                .then(function(response) {
                    $scope.projects = response.data.data;
                    $scope.selectedProject = $scope.projects[1].project_id;
                    for (var project in $scope.projects) {
                        $scope.projects[project].editSession =
                                ace.createEditSession($scope.projects[project].body, "ace/mode/java");
                    }
                },
                function(error) {
                    console.log(error);
                });
    };

    // Make a /api/me request and set the current user
    $scope.$watch('loggedIn', function(newVal, oldVal) {
        if (newVal) {
            $http.get('/api/me')
                .then(function(response) {
                    $scope.username = response.data.data.username;
                    $scope.displayName = response.data.data.displayName;
                    $scope.isAdmin = response.data.data.isAdmin;
                    $scope.loggedIn = true;
                },
                function(error) {
                    console.log("Error getting current user in MainController");
                });
            getTemplates();
            getProjects();
        } else {
            $scope.username = ''; // clear the username field
            $scope.password = ''; // clear the password field
            $scope.displayName = 'Log in';
            $scope.isAdmin = false;
            $scope.loggedIn = false;
            $scope.templates = [];
            $scope.projects = [];
        }
    });

    $scope.createProject = function(template) {
        var fd = new FormData();
        fd.append('template_id', template.template_id);
        $http({
            method: 'POST',
            url: 'api/projects',
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            console.log(response.data.data);
        }, function(error) {
            console.log('Error updating problem');
            console.log(response);
            console.log(error.data.status + ': ' + error.data.error);
        });
    };

    $scope.logIn = function() {
        // Here, we have the username and password, accessible by
        //     $scope.username and $scope.password. We need to call
        //     the backend to log in.
        var request = {
            'username': $scope.username,
            'password': $scope.password
        };
        $http({
            method: 'POST',
            url: '/api/login',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            transformRequest: function(obj) {
                    var str = [];
                    for(var p in obj)
                        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                    return str.join("&");
            },
            data: request
        }).then(function(response) {
            $scope.loggedIn = true;
            $scope.failedLogin = false;
            closeDropdown();
        }, function(response) {
            $scope.failedLogin = true;
        });
    };

    $scope.logOut = function() {
        $http.get('/api/logout').then(function(response) {
            $scope.loggedIn = false;
            getProblems();
        }, function(response) {
            console.log("error");
        });
    };
}]);
