app.controller('DeleteModalController', ['$scope', function($scope) {
    $scope.confirm = function() {
        $scope.$close(true);
    };

    $scope.cancel = function() {
        $scope.$close();
    };
}]);
