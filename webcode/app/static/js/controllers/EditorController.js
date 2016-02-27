app.controller('EditorController', ['$scope', '$http', '$window', '$interval',
        '$routeParams', '$location',
        function($scope, $http, $window, $interval, $routeParams, $location) {
    var SAVING = 'Saving…';
    var projectId;
    if ($routeParams.project) {
        projectId = parseInt($routeParams.project);
    }

    $scope.editor = ace.edit(document.getElementById('editor'));
    $scope.editor.$blockScrolling = Infinity; // hide error message
    // $scope.editor.setTheme('ace/theme/tomorrow_night');
    $scope.editor.getSession().setMode('ace/mode/java');
    $scope.editor.getSession().setValue('public class Test {\n    public ' +
            'static void main(String[] args) {\n        System.out.println' +
            '("Hello, world!");\n    }\n}\n');

    var saveTimer;
    var oldValue = '';
    $scope.status = 'Saving…';
    $scope.template = {};
    $scope.editor.on('change', function(e) {
        $scope.status = 'Saving…';
        $scope.$apply();
        resetTimer();
    });

    $scope.socket.on('close', function(event) {
        $scope.editor.setReadOnly(true);
        if (saveTimer) {
            $interval.cancel(saveTimer);
        }
    });

    $scope.$watch('selectedProject', function(newValue, oldValue) {
        $scope.editor.setSession($scope.projects[newValue].editSession);
        console.log(newValue);
    });

    var resetTimer = function() {
        if (saveTimer) {
            $interval.cancel(saveTimer);
        }
        var sendSave = function() {
            var newValue = $scope.editor.getSession().getValue();
            if (newValue !== oldValue) {
                var curPos = $scope.editor.getCursorPosition();
                $scope.socket.send('save', {
                    username: $scope.username,
                    project_id: projectId,
                    body: $scope.editor.getSession().getValue(),
                    cursor_x: curPos.column,
                    cursor_y: curPos.row
                });
                $scope.status = 'Last edit was ' +
                        new Date().toLocaleTimeString() + '.';
                saveTimer = undefined;
            }
        };
        saveTimer = $interval(sendSave, 3000, 1, true);
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
            console.log('Error updating problem');
            console.log(response);
            console.log(error.data.status + ': ' + error.data.error);
        });
    };
    $scope.printAllToConsole = function() {
        console.log($scope.editor.getSession().getValue());
    };
}]);
