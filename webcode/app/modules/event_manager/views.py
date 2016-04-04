from app.database import session
from app.modules.event_manager.models import Event
from app.modules.sockets.socket_handler import SocketHandler
from app.modules.user_manager.models import User


@SocketHandler.on('event')
def log_event(data, username):
    user = session.query(User).filter(User.username == username).first()
    if user is not None:  # Ensure that the user exists to prevent crashes
        Event.log(user.username, data['type'], data['details'])
    else:
        print('Attempting to log event where username is None')


@SocketHandler.on('preferences')
def log_event(data, username):
    user = session.query(User).filter(User.username == username).first()
    if user is not None:  # Ensure that the user exists to prevent crashes
        user.font_size = int(data['fontSize'])
        user.theme = data['theme']
        user.commit_to_session()
    else:
        print('Attempting to log event where username is None')
