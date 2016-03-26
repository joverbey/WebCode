app.controller('EditorController', ['$scope', '$http', '$window', '$interval', '$sce', '$compile', '$uibModal', '$timeout', function($scope, $http, $window, $interval, $sce, $compile, $uibModal, $timeout) {
    var saveTimer;
    var inactiveTimer;
    var disconnectedModal;
    var active = false;
    var socket;
    $scope.saving = false;
    $scope.showConsole = true;
    $scope.status = 'Saving…';
    $scope.template = {};
    $scope.jobs = [];
    $scope.consoleOutput = '';

    $scope.editor = ace.edit(document.getElementById('editor'));
    $scope.editor.setTheme('ace/theme/twilight');
    $scope.editor.commands.addCommand({
        name: 'Save',
        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
        exec: function() {
            sendSave($scope.selectedProject);
        },
        readOnly: false
    });

    // Lock editor if user is logged out or the socket is disconnected
    var enableEditor = function() {
        var isConnectedToSocket = socket && socket.isConnected();
        $scope.editor.setReadOnly(!$scope.loggedIn || !isConnectedToSocket || !navigator.onLine);
    };
    enableEditor();

    var resetTimeout = function() {
        active = true;
        if (inactiveTimer) {
            $timeout.cancel(inactiveTimer);
        } else {
            // send active
            $scope.logEvent('active');
        }
        inactiveTimer = $timeout(function() {
            active = false;
            $scope.logEvent('inactive');
            inactiveTimer = undefined;
        }, 30000, false);
    };
    resetTimeout();

    $scope.editor.on('change', resetTimeout);
    $scope.editor.on('changeSelectionStyle', resetTimeout);
    $scope.editor.on('copy', resetTimeout);
    $scope.editor.on('focus', resetTimeout);
    $scope.editor.on('paste', function(o1) {
        $scope.logEvent('paste', {
            inserted: o1.text.length,
            newSize: $scope.editor.getSession().getValue().length,
            activePrior: active
        });
        resetTimeout();
    });
    $scope.editor.on('changeSession', function(o) {
        resetTimeout();

        o.session.getSelection().on('changeSelection', resetTimeout);
        o.session.getSelection().on('changeCursor', resetTimeout);
        o.session.on('change', resetTimeout);
        o.session.on('changeScrollTop', resetTimeout);
        o.session.on('changeScrollLeft', resetTimeout);
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

    var resizeEditor = function() {
        $scope.editor.renderer.onResize(true);
    };

    var lockEditor = function(bool) {
        $scope.editor.setReadOnly(bool);
    };

    var hideConsole = function(bool) {
        $scope.showConsole = !bool;
        $interval(resizeEditor, 0, 1);
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

    $scope.$on('angular-resizable.resizing', function (event, args) {
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
        sendSave(old.projectId);
    });

    var hideDisconnectedModal = function() {
        if (navigator.onLine && disconnectedModal) {
            disconnectedModal.dismiss('open');
            disconnectedModal = undefined;
        }
    };

    var showDisconnectedModal = function() {
        disconnectedModal = $uibModal.open({
            templateUrl: 'disconnectModal.html',
            controller: 'DisconnectModalController',
            size: 'sm',
            scope: $scope,
            backdrop: 'static',
            keyboard: false
        });
    };

    $scope.$on('openSocket', function(scope, s) {
        socket = s;
        enableEditor();
        hideDisconnectedModal();
        socket.on('submit', function(data) {
            if ($scope.jobs.indexOf(data.job) > -1) {
                var console = document.getElementById('console');
                $scope.consoleOutput = $sce.trustAsHtml($scope.consoleOutput + '<p>' + data.stdout + '</p>' +
                    '<p class="warning">' + data.stderr + '</p>');
                $scope.$apply();
                console.scrollTop = console.scrollHeight;
            }
        });
    });

    $scope.$on('closeSocket', function() {
        enableEditor();
        if (saveTimer) {
            $interval.cancel(saveTimer);
        }
        if ($scope.loggedIn && disconnectedModal === undefined) {
            showDisconnectedModal();
        }
    });

    $scope.$on('loggedIn', function() {
        $scope.loggedIn = true;
        enableEditor();
    });

    $scope.$on('loggedOut', function() {
        $scope.loggedIn = false;
        enableEditor();
    });

    $scope.$on('onlineChange', function(scope, isOnline) {
        console.log('got online change', isOnline);
        if (isOnline) {
            hideDisconnectedModal();
        } else {
            showDisconnectedModal();
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
            socket.send('save', {
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
        var status = 'Last save was ';
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

    $scope.toggleConsole = function() {
        hideConsole($scope.showConsole);
    };

    $scope.showTemplate = function(template) {
        if ($scope.isEditing) {
            sendSave();
        }
        lockEditor(true);
        hideConsole(true);
        $scope.isEditing = false;
        $scope.isShowingTemplate = true;
        $scope.showBanner = true;
        $scope.editor.setSession(ace.createEditSession(template.body, 'ace/mode/c_cpp'));
        $scope.status = 'Viewing template (Read only)';
        $scope.template = template;
        $scope.logEvent('showtemp', template.template_id);
    };

    $scope.selectProject = function(project) {
        $scope.selectedProject = project.project_id;
        $scope.$emit('selectedProject', project.project_id);
        lockEditor(false);
        hideConsole(false);
        $scope.isEditing = true;
        $scope.showBanner = false;
        $scope.editor.setSession(project.editSession);
        setStatus();
        $scope.logEvent('switch', project.project_id);
    };

    $scope.showCreateProjectModal = function(template) {
        $uibModal.open({
            templateUrl: '/static/html/new-project.html',
            controller: 'CreateProjectModalController',
            size: 'sm',
            scope: $scope,
            resolve: {template: template}
        });
    };

    $scope.toggleShowProjects = function() {
        $scope.showProjects = !$scope.showProjects;
    };

    $scope.toggleShowTemplates = function() {
        $scope.showTemplates = !$scope.showTemplates;
    };

    $scope.showEditProjectModal = function(project) {
        $uibModal.open({
            templateUrl: '/static/html/edit-project.html',
            controller: 'EditProjectModalController',
            size: 'sm',
            scope: $scope,
            resolve: {project: project}
        });
    };

    $scope.$watch('isEditing', function(newValue) {
        $scope.$emit('isEditing', newValue);
    });
}]);
