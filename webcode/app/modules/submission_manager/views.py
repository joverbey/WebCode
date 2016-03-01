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


def directory_for_submission(submission):
    return os.path.join(
        app.config['DATA_FOLDER'], 'submits', str(submission.job))


@app.route('/api/submissions', methods=['POST'])
@login_required
def create_submission():
    try:
        project = (session.query(Project).filter(
            Project.project_id == int(request.form['project_id'])
                and Project.username == current_user.username).first())

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

    directory = directory_for_submission(submission)
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
