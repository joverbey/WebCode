# pylint: disable=no-name-in-module, f0401
from flask import request
from flask.ext.login import login_required, current_user
from app import app
from app.database import session
from app.util import serve_response, serve_error
from app.modules.project_manager.models import Project
from app.modules.submission_manager.models import Submission
from app.modules.submission_manager.runner import Runner
import time
import os


FILE_EXTENSIONS_FROM_TYPE = {
    'cuda': '.cu',
    'oacc': '.c'
}


def directory_for_submission(job):
    return os.path.join(
        app.config['DATA_FOLDER'], 'submits', str(job))


@app.route('/api/submissions', methods=['POST'])
@login_required
def create_submission():
    try:
        project = (session.query(Project).filter(
                    Project.project_id == int(request.form['project_id']) and
                    Project.username == current_user.username).first())

        project.body = request.form['body']
        submission = Submission(
            username=current_user.username,
            submit_time=int(time.time()),
            type=project.type,
            project_id=int(request.form['project_id']),
            run=int(request.form['run'])
        )
    except KeyError:
        return serve_error('Form data missing.')

    submission.commit_to_session()
    project.commit_to_session()

    directory = directory_for_submission(submission.job)
    os.mkdir(directory)
    file_name = 'submit' + FILE_EXTENSIONS_FROM_TYPE[submission.type]
    source_file = open(os.path.join(directory, file_name), 'w')
    source_file.write(project.body)
    source_file.close()

    runner = Runner(submission, file_name)
    runner.run_queued()

    return serve_response({
        'job': submission.job
    })


@app.route('/api/submissions')
@login_required
def get_submissions():
    submissions = session.query(Submission).filter(Submission.username == current_user.username).all()
    subs = list()
    for s in submissions:
        subs.append(s.to_dict())
    return serve_response({'submissions': subs})


@app.route('/api/submissions/<int:job>')
@login_required
def get_submission(job):
    submission = session.query(Submission).filter(Submission.username == current_user.username and
                                                  Submission.job == job).first()
    directory = directory_for_submission(job)
    file_name = 'submit' + FILE_EXTENSIONS_FROM_TYPE[submission.type]
    source_file = open(os.path.join(directory, file_name))
    body = source_file.read()
    return serve_response({
        'body': body
    })
