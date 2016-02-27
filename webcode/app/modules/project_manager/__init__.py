from app.modules.sockets.socket_handler import SocketHandler

@SocketHandler.on('save')
def on_save(data):
    print(data['body'])
