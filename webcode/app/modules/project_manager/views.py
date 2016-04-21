# pylint: disable=no-name-in-module, f0401
from flask import request
from flask.ext.login import login_required, current_user
from app import app
from app.database import session
from app.util import serve_response, serve_error
from app.modules.project_manager.models import Project
from app.modules.sockets.socket_handler import SocketHandler
import time


@app.route('/api/projects')
@login_required
def get_projects():
    projects = session.query(Project).filter(Project.username == current_user.username).all()
    ret = dict()
    for project in projects:
        if project.hide > 0:
            continue
        ret[repr(project.project_id)] = project.to_dict()
    return serve_response({
        'selected': repr(projects[0].project_id) if len(projects) > 0 else -1,
        'projects': ret
    })


@app.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    try:
        project = Project(
                username=current_user.username,
                body=request.form['body'],
                cursor_x=0,
                cursor_y=0,
                type=request.form['type'],
                title=request.form['title'],
                last_edited=int(time.time()),
                template_id=int(request.form['template_id']),
                hide=0
        )
    except KeyError as error:
        return serve_error('Form field not found: ' + error[0])

    project.commit_to_session()
    return serve_response(project.to_dict())


@app.route('/api/projects/<int:project_id>', methods=['GET'])
@login_required
def download_project(project_id):
    project = session.query(Project).filter(Project.project_id == project_id).first()
    return project.body, 200


@app.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def edit_project(project_id):
    project = session.query(Project).filter(Project.project_id == project_id).first()
    if 'title' in request.form:
        project.title = request.form['title']
    if 'type' in request.form:
        project.type = request.form['type']
    if 'delete' in request.form:
        project.hide = int(request.form['delete'])

    project.commit_to_session()
    return serve_response(project.to_dict())


@SocketHandler.on('save')
def on_save(conn, data, username):
    """Save the project"""
    project = (session.query(Project)
               .filter(Project.project_id == data['project_id'] and
                       Project.username == data['username']).first())
    project.body = data['body']
    project.cursor_x = data['cursor_x']
    project.cursor_y = data['cursor_y']
    project.last_edited = int(time.time())
    project.commit_to_session()
    SocketHandler.send(conn, 'saved', {
        'project_id': str(project.project_id),
        'save_time': project.last_edited
    })
