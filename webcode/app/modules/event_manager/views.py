from app.modules.event_manager.models import Event
from app.modules.sockets.socket_handler import SocketHandler


@SocketHandler.on('event')
def log_event(data, username):
    Event.log(username, data['type'], data['details'])
