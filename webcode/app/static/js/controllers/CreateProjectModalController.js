app.controller('CreateProjectModalController', ['$scope', '$http', 'template', function($scope, $http, template) {
    if (typeof template === 'undefined') {
        $scope.template = {
            type: 'oacc',
            title: '',
            body: ''
        };
        console.log('went here');
    } else {
        $scope.template = {
            type: template.type,
            title: template.title,
            body: template.body,
            template_id: template.template_id
        };
    }

    $scope.createNewProject = function() {
        var fd = new FormData();
        fd.append('type', $scope.template.type);
        fd.append('title', $scope.template.title);
        fd.append('body', $scope.template.body);
        fd.append('template_id', $scope.template.template_id ? $scope.template.template_id : -1);
        $http({
            method: 'POST',
            url: 'api/projects',
            headers: {'Content-type': undefined},
            transformRequest: angular.identity,
            data: fd
        }).then(function(response) {
            var project = response.data.data;
            $scope.projects[project.project_id] = project;
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
