app.controller('EditProjectModalController', ['$scope', '$http', 'project', function($scope, $http, project) {
    if (typeof project === 'undefined') {
        $scope.$close();
    } else {
        var sep = '.';
        var maxsplit = 1;
        var split = project.title.split(sep);
        var title = maxsplit ? [ split.slice(0, -maxsplit).join(sep) ] : split;
        $scope.project = {
            type: project.type,
            title: title,
            project_id: project.project_id
        };
    }

    $scope.createNewProject = function() {
        var fd = new FormData();
        fd.append('type', $scope.project.type);
        fd.append('title', $scope.project.title);
        $http({
            method: 'PUT',
            url: 'api/projects/' + $scope.project.project_id,
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            var project = response.data.data;
            $scope.projects[project.project_id].title = $scope.project.title + $scope.TYPE_TO_EXT[$scope.project.type];
            $scope.projects[project.project_id].type = $scope.project.type;
            var session = ace.createEditSession(project.body, $scope.EDIT_SESSION_TYPES[project.type]);
            project.editSession = session;
            session.projectId = project.project_id;
            $scope.$close();
        }, function(error) {
            console.log('Error creating project');
            console.log(error.data.status + ': ' + error.data.error);
        });
    };
}]);
