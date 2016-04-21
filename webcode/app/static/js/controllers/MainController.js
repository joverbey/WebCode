app.controller('MainController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.loggedIn = false;
    $scope.isAdmin = false;
    $scope.isOpen = false;
    $scope.templates = [];
    $scope.projects = {};
    $scope.showTree = true;
    $scope.isEditing = true;
    $scope.prefs = { // have some defaults in case the preferences haven't loaded yet
        theme: 'ace/theme/twilight',
        fontSize: 12
    };
    var username;

    $scope.EDIT_SESSION_TYPES = {
        oacc: 'ace/mode/c_cpp',
        cuda: 'ace/mode/c_cpp'
    };
    $scope.TYPE_TO_EXT = {
        oacc: '.c',
        cuda: '.cu'
    };

    $scope.reconnectToSocket = function() {
        $scope.socket.refresh();
    };

    $scope.toggleFileTree = function() {
        $scope.showTree = !$scope.showTree;
    };

    var connectToSocket = function() {
        $scope.socket = new Socket('ws://' + $window.location.host + '/websocket');
        $scope.socket.on('close', function() {
            $scope.$broadcast('closeSocket');
        });

        $scope.socket.on('open', function() {
            $scope.$broadcast('openSocket', $scope.socket);
        });
    };

    var disconnectFromSocket = function() {
        if ($scope.socket) {
            $scope.socket.close();
        }
    };

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
                    $scope.projects = response.data.data.projects;
                    $scope.selectedProject = response.data.data.selected;
                    for (var project in $scope.projects) {
                        var session = ace.createEditSession(
                            $scope.projects[project].body, "ace/mode/c_cpp");
                        $scope.projects[project].editSession = session;
                        session.projectId = project;
                    }
                },
                function(error) {
                    console.log(error);
                });
    };

    var getSubmissions = function() {
        $http.get('/api/submissions')
            .then(function(response) {
                    $scope.submissions = response.data.data.submissions;
                },
                function(error) {
                    console.log(error);
                });
    };

    // Make a /api/me request and set the current user
    $scope.$watch('loggedIn', function(newVal) {
        if (newVal) {
            $http.get('/api/me')
                .then(function(response) {
                    username = response.data.data.username;
                    $scope.username = response.data.data.username;
                    $scope.displayName = response.data.data.displayName;
                    $scope.isAdmin = response.data.data.isAdmin;
                    $scope.prefs.fontSize = response.data.data.fontSize;
                    $scope.prefs.theme = response.data.data.theme;
                    $scope.loggedIn = true;
                    connectToSocket();
                },
                function() {
                    console.log("Error getting current user in MainController");
                });
            getTemplates();
            getProjects();
            getSubmissions();
        } else {
            $scope.username = ''; // clear the username field
            $scope.password = ''; // clear the password field
            $scope.displayName = 'Log in';
            $scope.isAdmin = false;
            $scope.loggedIn = false;
            $scope.templates = [];
            $scope.projects = [];
            $scope.submissions = [];
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
            $scope.projects.append(response.data.data);
        }, function(error) {
            console.log('Error updating problem');
            console.log(response);
            console.log(error.data.status + ': ' + error.data.error);
        });
    };

    $scope.createEmptyProject = function() {
        $scope.projects.blank = {
            body: '',
            cursor_x: 0,
            cursor_y: 0,
            type: '',
            project_id: 'blank',
            last_edited: Date.now() / 1000,
            title: 'Blank Project',
            editSession: ace.createEditSession('', "ace/mode/c_cpp")
        };
    };

    $scope.increaseFontSize = function() {
        $scope.prefs.fontSize += 1
    };

    $scope.decreaseFontSize = function() {
        $scope.prefs.fontSize -= 1
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
            $scope.$broadcast('loggedIn');
            closeDropdown();
        }, function(response) {
            $scope.failedLogin = true;
        });
    };

    $scope.logOut = function() {
        $http.get('/api/logout').then(function(response) {
            $scope.loggedIn = false;
            $scope.$broadcast('loggedOut');
            disconnectFromSocket();
        }, function(response) {
            console.log("error");
        });
    };

    $scope.compileAndRun = function(run) {
        $scope.$broadcast('execute', run);
    };

    $scope.logEvent = function(type, details) {
        if (!$scope.loggedIn || !$scope.socket) {
            console.error('Could not log event:', type, details);
            return;
        }
        $scope.socket.send('event', {
            type: type,
            username: username,
            details: typeof details === 'undefined' ? 'None' : JSON.stringify(details)
        });
    };

    $scope.updatePreferences = function() {
        $scope.socket.send('preferences', {
            theme: $scope.prefs.theme,
            fontSize: $scope.prefs.fontSize,
            username: username
        });
    };

    $scope.$on('isEditing', function(scope, value) {
        $scope.isEditing = !!value;
    });

    $scope.$on('selectedProject', function(scope, value) {
        $scope.selectedProject = value;
    });

    window.addEventListener('online', function() {
        $scope.$broadcast('onlineChange', true);
        $scope.reconnectToSocket();
    });
    window.addEventListener('offline', function() {
        $scope.$broadcast('onlineChange', false);
    });

    $scope.$on('requestSocket', function() {
        if ($scope.socket) {
            $scope.$broadcast('openSocket', $scope.socket);
        }
    });
}]);
