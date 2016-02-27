# pylint: disable=no-name-in-module, f0401
from flask import request
from flask.ext.login import login_required
from app import app
from app.database import session
from app.util import serve_response, serve_error, admin_required
from app.modules.template_manager.models import Template


@app.route('/api/templates')
@login_required
def get_templates():
    templates = session.query(Template).all()
    ret = list()
    for template in templates:
        ret.append(template.to_dict())
    return serve_response(ret)


@app.route('/api/templates', methods=['POST'])
@admin_required
def make_template():
    try:
        template = Template(
            title=request.form['title'],
            body=request.form['body'],
            cursor_x=int(request.form['cursor_x']),
            cursor_y=int(request.form['cursor_y']),
            type=request.form['type']
        )
    except KeyError as error:
        return serve_error('Form field not found: ' + error[0])
    template.commit_to_session()
    return serve_response(template.to_dict())
