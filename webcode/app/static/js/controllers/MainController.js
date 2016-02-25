app.controller('MainController', ['$scope', '$http', '$route', '$window',
        function($scope, $http, $route, $window) {
    $scope.socket = new Socket('ws://' + $window.location.host + '/websocket');
}]);
