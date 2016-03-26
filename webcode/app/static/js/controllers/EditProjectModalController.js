app.controller('EditProjectModalController', ['$scope', '$http', 'project', '$uibModal', function($scope, $http, project, $uibModal) {
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

    $scope.deleteProject = function() {
        var deleteModal = $uibModal.open({
            templateUrl: '/static/html/delete-modal.html',
            controller: 'DeleteModalController',
            size: 'sm',
            scope: $scope,
            backdrop: 'static',
            keyboard: false
        });

        deleteModal.result.then(function(result) {
            if (!result) {
                return;
            }
            var fd = new FormData();
            fd.append('delete', 1);
            $http({
                method: 'PUT',
                url: 'api/projects/' + $scope.project.project_id,
                headers: {'Content-type': undefined},
                transformRequest: angular.identity,
                data: fd
            }).then(function(response) {
                var project = response.data.data;
                delete $scope.projects[project.project_id];
                $scope.$close('delete');
            }, function(error) {
                console.log('Error deleting project');
                console.log(error.data.status + ': ' + error.data.error);
            });
        }, function(reason) {

        });
    };

    $scope.editProject = function() {
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
