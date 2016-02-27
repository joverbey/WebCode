# pylint: disable=no-name-in-module, f0401
from flask import request
from flask.ext.login import login_required, current_user
from app import app
from app.database import session
from app.util import serve_response
from app.modules.project_manager.models import Project
from app.modules.template_manager.models import Template
import time

@app.route('/api/projects')
@login_required
def get_projects():
    projects = session.query(Project).all()
    ret = dict()
    for project in projects:
        ret[project.project_id] = project.to_dict()
    return serve_response(ret)


@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    try:
        template = (session.query(Template)
                .filter(Template.template_id ==
                        int(request.form['template_id']))).first()
        project = Project(
            username=current_user.username,
            body=template.body,
            cursor_x=template.cursor_x,
            cursor_y=template.cursor_y,
            type=template.type,
            last_edited=int(time.time()),
            template_id=template.template_id
        )
    except KeyError as error:
        return serve_error('Form field not found: ' + error[0])
    project.commit_to_session()
    return serve_response(project.to_dict())