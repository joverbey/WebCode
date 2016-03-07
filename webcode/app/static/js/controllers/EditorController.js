app.controller('EditorController', ['$scope', '$http', '$window', '$interval', '$sce', '$compile', '$uibModal', function($scope, $http, $window, $interval, $sce, $compile, $uibModal) {
    var saveTimer;
    var oldValue = '';
    var modalInstance;
    $scope.saving = false;
    $scope.showConsole = true;

    $scope.editor = ace.edit(document.getElementById('editor'));
    $scope.editor.setTheme('ace/theme/twilight');
    $scope.editor.commands.addCommand({
        name: 'Save',
        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
        exec: function(editor) {
            sendSave($scope.selectedProject);
        },
        readOnly: false
    });

    var createToolbars = function() {
        var element = document.getElementById('resize-bar-row');
        var toolbar = angular.element(document.createElement('row-toolbar'));
        $compile(toolbar)($scope);
        angular.element(element).append(toolbar);
        element = document.getElementById('resize-bar-column');
        toolbar = angular.element(document.createElement('column-toolbar'));
        $compile(toolbar)($scope);
        angular.element(element).append(toolbar);
    };
    $interval(createToolbars, 0, 1);

    $scope.editor.$blockScrolling = Infinity; // hide error message
    $scope.status = 'Saving…';
    $scope.template = {};
    $scope.jobs = [];
    $scope.consoleOutput = '';

    var resizeEditor = function() {
        $scope.editor.renderer.onResize(true);
    };

    var execute = function(run) {
        var fd = new FormData();
        fd.append('run', run);
        fd.append('project_id', $scope.selectedProject);
        fd.append('body', $scope.editor.getSession().getValue());
        $interval.cancel(saveTimer);
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

    $scope.$on("angular-resizable.resizing", function (event, args) {
        if (args.height) {
            resizeEditor();
        }
    });

    $scope.$on('execute', function(metadata, run) {
        execute(run);
    });

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

    $scope.socket.on('submit', function(data) {
        if ($scope.jobs.indexOf(data.job) > -1) {
            var console = document.getElementById('console');
            $scope.consoleOutput = $sce.trustAsHtml($scope.consoleOutput + '<p>' + data.stdout + '</p>' +
                '<p class="error">' + data.stderr + '</p>');
            $scope.$apply();
            console.scrollTop = console.scrollHeight;
        }
    });

    $scope.toggleConsole = function() {
        $scope.showConsole = !$scope.showConsole;
        $interval(resizeEditor, 0, 1);
    };

    $scope.showSubmission = function(submission) {

    };

    $scope.toggleShowProjects = function() {
        $scope.showProjects = !$scope.showProjects;
    };

    $scope.toggleShowTemplates = function() {
        $scope.showTemplates = !$scope.showTemplates;
    };

    $scope.toggleShowSubmissions = function() {
        $scope.showSubmits = !$scope.showSubmits;
    };
}]);
