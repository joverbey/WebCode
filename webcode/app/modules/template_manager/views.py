# pylint: disable=no-name-in-module, f0401
from flask import request
from app import app
from app.util import serve_response, serve_error, admin_required
from app.modules.template_manager.models import Template

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
