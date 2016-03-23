from app import app
from app.modules.event_manager.models import Event
from flask.sessions import SecureCookieSessionInterface
import tornado.websocket
from json import loads


class SocketHandler(tornado.websocket.WebSocketHandler):
    """ A class for handling sockets

    This class acts as a singleton that contains all of the websocket clients
    that are currently connected to the server.
    """

    # Client connection pool
    clients = []

    # Callback dictionary for receiving messages
    callbacks = dict()

    def __init__(self, *args, **kwargs):
        tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)
        self.username = None

    @classmethod
    def emit(cls, event_type, data):
        """
        Send a message to all clients currently connected

        :param event_type: the name of the message to send
        :param data: the dictionary of data to send
        :return: None
        """
        for client in cls.clients:
            client.write_message(SocketHandler._message(event_type, data))

    @classmethod
    def send(cls, conn, event_type, data):
        """
        Send a message directly to a specific client

        :param conn: the Flasknado instance to send to
        :param event_type: the name of the event type
        :param data: the dictionary of data to pass
        :return: None
        """
        conn.write_message(SocketHandler._message(event_type, data))

    @classmethod
    def on(self, message):
        """
        Decorator to register a callback function when receiving a message
        from the client.

        :param message: the name of the message to register the callback for
        """
        def wrapped(function):
            if message not in self.callbacks:
                self.callbacks[message] = function
        return wrapped

    def open(self):
        """Add a client to the connection pool"""
        SocketHandler.clients.append(self)
        try:
            cookie = self.request.cookies['session'].value
            session = SecureCookieSessionInterface().open_session(
                    app,
                    FakeRequest(cookie)
            )
            self.username = session['user_id']
            Event.log(self.username, 'start')
        except:
            pass

    def on_close(self):
        """Remove a client from the connection pool"""
        SocketHandler.clients.remove(self)
        Event.log(self.username, 'finish')

    def on_message(self, message):
        """
        Recieve a message from the client and call the registered callback, if
        any

        :param message: The message name the callback is registered under
        """
        try:
            messageDict = loads(message)
            if messageDict['eventType'] in self.callbacks:
                self.callbacks[messageDict['eventType']](messageDict['data'], self.username)
            else:
                print('not in callbacks: ' + messageDict['eventType'])
        except Exception as e:
            print(e)
            app.logger.error('Could not parse JSON from socket message: ' +
                             message)

    def data_received(self, data):
        pass

    @staticmethod
    def _message(event, data):
        """Helper method to wrap a message for sending"""
        return {
            'eventType': event,
            'data': data
        }


class FakeRequest:

    def __init__(self, cookie):
        self.cookies = {
            app.session_cookie_name: cookie
        }
