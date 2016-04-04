from app import app
from app.database import session
from app.modules.event_manager.models import Event
from app.modules.user_manager.models import User
from app.util import serve_response, serve_error, load_user, bcrypt
from flask import render_template, request
from flask.ext.login import login_user, logout_user, current_user, login_required


@app.route('/')
def home():
    logged_in = not current_user.is_anonymous
    display_name = (current_user.display if logged_in else 'Log in')
    logged_in_string = 'true' if logged_in else 'false'
    return render_template('index.html', display_name=display_name,
                           logged_in=logged_in_string)


@app.route('/api/users')
def get_users():
    users = session.query(User).all()
    ret = list()
    for user in users:
        ret.append({
            'username': user.username,
            'displayName': user.display
        })
    return serve_response(ret)


@app.route('/api/login', methods=['POST'])
def log_in():
    username = request.form['username']
    password = request.form['password']
    user = load_user(username)
    if user:
        hashed = user.password
        if bcrypt.check_password_hash(hashed, password):
            # everything's gucci
            login_user(user)
            Event.log(username, 'login')
            return serve_response({})
    return serve_error('invalid username or password', 401)


@app.route('/api/logout')
@login_required
def log_out():
    Event.log(current_user.username, 'logout')
    logout_user()
    return serve_response({})

@app.route('/api/me')
@login_required
def get_me():
    return serve_response({
        'username': current_user.username,
        'displayName': current_user.display,
        'isAdmin': current_user.admin,
        'fontSize': current_user.font_size,
        'theme': current_user.theme
    })
