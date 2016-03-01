app.controller('EditorController', ['$scope', '$http', '$window', '$interval',
        '$routeParams', '$location', '$uibModal',
        function($scope, $http, $window, $interval, $routeParams, $location, $uibModal) {
    var saveTimer;
    var oldValue = '';
    var modalInstance;
    $scope.saving = false;

    $scope.editor = ace.edit(document.getElementById('editor'));
    $scope.editor.setTheme("ace/theme/twilight");
    $scope.editor.$blockScrolling = Infinity; // hide error message
    $scope.status = 'Saving…';
    $scope.template = {};
    $scope.jobs = [];
    $scope.consoleOutput = '';

    $scope.editor.on('change', function(e) {
        $scope.saving = true;
        $scope.$apply();
        resetTimer();
    });
    $scope.editor.on('changeSession', function(object) {
        var old = object.oldSession;
        if (old.getValue() !== oldValue) {
            sendSave(old.projectId);
        }
    });

    $scope.socket.on('close', function(event) {
        $scope.editor.setReadOnly(true);
        if (saveTimer) {
            $interval.cancel(saveTimer);
        }
        if (modalInstance === undefined) {
            modalInstance = $uibModal.open({
                templateUrl: 'disconnectModal.html',
                controller: 'DisconnectModalController',
                size: 'sm',
                scope: $scope,
                backdrop: 'static',
                keyboard: false
            });
        }
    });

    $scope.socket.on('open', function(event) {
        $scope.editor.setReadOnly(false);
        modalInstance.dismiss('open');
        modalInstance = undefined;
    });

    $scope.$watch('selectedProject', function(newValue, oldValue) {
        if (newValue in $scope.projects) {
            $scope.editor.setSession($scope.projects[newValue].editSession);
            setStatus();
        }
    });

    var sendSave = function(projectId) {
        if (projectId === undefined) {
            projectId = $scope.selectedProject;
        }
        var project = $scope.projects[projectId];
        var newValue= project.editSession.getValue();
        if (newValue !== project.body) {
            var curPos = $scope.editor.getCursorPosition();
            project.body = newValue;
            project.last_edited = Date.now() / 1000;
            $scope.socket.send('save', {
                username: $scope.username,
                project_id: projectId,
                body: newValue,
                cursor_x: curPos.column,
                cursor_y: curPos.row
            });
            saveTimer = undefined;
        }
        setStatus();
    };

    var setStatus = function() {
        var project = $scope.projects[$scope.selectedProject];
        var date = new Date(project.last_edited * 1000);
        var now = new Date();
        var status = 'Last edit was ';
        if (date.toDateString() !== now.toDateString()) {
            status = status + 'on ' + date.toLocaleDateString() + ' ';
        }
        status = status + 'at ' + date.toLocaleTimeString() + '.';
        $scope.status = status;
    };

    var resetTimer = function() {
        cancelTimer();
        saveTimer = $interval(sendSave, 3000, 1, true, $scope.selectedProject);
    };

    var cancelTimer = function() {
        if (saveTimer) {
            $interval.cancel(saveTimer);
        }
    };

    $scope.showSaveTemplate = function(show) {
        $scope.isSavingTemplate = !!show;
    };

    $scope.selectProject = function(project) {
        $scope.selectedProject = project.project_id;
    };

    $scope.saveTemplate = function() {
        var curPos = $scope.editor.getCursorPosition();
        var fd = new FormData();
        fd.append('title', $scope.template.title);
        fd.append('body', $scope.editor.getSession().getValue());
        fd.append('cursor_x', curPos.column);
        fd.append('cursor_y', curPos.row);
        fd.append('type', $scope.template.type);
        $http({
            method: 'POST',
            url: 'api/templates',
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            // Redirect to the new problem page
            // NOTE: Global problem list in client may be invalid now
            $scope.showSaveTemplate(false);
        }, function(error) {
            console.error(error.data.status + ': ' + error.data.error);
        });
    };

    $scope.compileAndRun = function() {
        if ($scope.isSavingTemplate) {
            // uhh... solve this
        }
        var fd = new FormData();
        fd.append('run', 1);
        fd.append('project_id', $scope.selectedProject);
        $http({
            method: 'POST',
            url: 'api/submissions',
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            $scope.jobs.push(response.data.data.job);
        }, function(error) {
            console.error(error.data.status + ': ' + error.data.error);
        });
    };

    $scope.compileOnly = function() {
        if ($scope.isSavingTemplate) {
            // uhh... solve this
        }
        var fd = new FormData();
        fd.append('run', 0);
        fd.append('project_id', $scope.selectedProject);
        $http({
            method: 'POST',
            url: 'api/submissions',
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            $scope.jobs.push(response.data.data.job);
        }, function(error) {
            console.error(error.data.status + ': ' + error.data.error);
        });
    };

    $scope.socket.on('submit', function(data) {
        if ($scope.jobs.indexOf(data.job) > -1) {
            $scope.consoleOutput = $scope.consoleOutput + data.stdout +
                    data.stderr;
            $scope.$apply();
        }
    });
}]);
