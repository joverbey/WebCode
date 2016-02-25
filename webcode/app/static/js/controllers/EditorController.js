app.controller('EditorController', ['$scope', '$http', '$window', '$document',
        function($scope, $http, $window, $document) {
    $scope.editor = ace.edit(document.getElementById('editor'));
    // editor.setTheme('ace/theme/monokai');
    $scope.editor.getSession().setMode('ace/mode/java');
    $scope.editor.on('change', function(e) {
        console.log(e);
    });

    $scope.printAllToConsole = function() {
        console.log($scope.editor.getSession().getValue());
    };
}]);
