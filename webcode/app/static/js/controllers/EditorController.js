app.controller('EditorController', ['$scope', '$http', '$window',
        '$routeParams',
        function($scope, $http, $window, $routeParams) {
    if ($routeParams.project) {
        console.log($routeParams.project);
    }
    $scope.template = {};
    $scope.editor = ace.edit(document.getElementById('editor'));
    $scope.editor.$blockScrolling = Infinity; // hide error message
    // $scope.editor.setTheme('ace/theme/tomorrow_night');
    $scope.editor.getSession().setMode('ace/mode/java');
    $scope.editor.getSession().setValue('public class Test {\n    public ' +
            'static void main(String[] args) {\n        System.out.println' +
            '("Hello, world!");\n    }\n}\n');
    $scope.editor.on('change', function(e) {

    });
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
            console.log('Error updating problem');
            console.log(response);
            console.log(error.data.status + ': ' + error.data.error);
        });
    };
    $scope.printAllToConsole = function() {
        console.log($scope.editor.getSession().getValue());
    };
}]);
