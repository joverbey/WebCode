from app import app
from app.modules.event_manager.models import Event
from flask.sessions import SecureCookieSessionInterface
import tornado.websocket
from json import loads
import threading
import time


class SocketHandler(tornado.websocket.WebSocketHandler):
    """ A class for handling sockets

    This class acts as a singleton that contains all of the websocket clients
    that are currently connected to the server.
    """

    # Client connection dictionary
    clients = {}

    # Callback dictionary for receiving messages
    callbacks = dict()

    def __init__(self, *args, **kwargs):
        tornado.websocket.WebSocketHandler.__init__(self, *args, **kwargs)
        self.username = None
        self.kill = False

    @classmethod
    def emit(cls, event_type, data):
        """
        Send a message to all clients currently connected

        :param event_type: the name of the message to send
        :param data: the dictionary of data to send
        :return: None
        """
        for client in cls.clients:
            SocketHandler.clients[client][0].write_message(SocketHandler._message(event_type, data))

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
        """Add a client to the connection pool. Only one socket per user is allowed; all others will be closed"""
        try:
            cookie = self.request.cookies['session'].value
            session = SecureCookieSessionInterface().open_session(
                    app,
                    FakeRequest(cookie)
            )
            self.username = session['user_id']
            if self.username is not None:
                self._check_for_multiple_clients()
                SocketHandler.clients[self.username].append(self)
        except:
            self.close()

    def _check_for_multiple_clients(self):
        if self.username in SocketHandler.clients:
            Event.log(self.username, 'restart')
            try:
                SocketHandler.send(SocketHandler.clients[self.username][0], 'multiple_clients', '')
                SocketHandler.clients[self.username][0].close()
            except:
                pass  # well, we tried.
        else:
            SocketHandler.clients[self.username] = list()
            Event.log(self.username, 'start')

    def on_close(self):
        """Remove a client from the connection pool"""
        SocketHandler.clients[self.username].pop(0)
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
                self.callbacks[messageDict['eventType']](messageDict['data'], messageDict['data']['username'])
            else:
                print('not in callbacks: ' + messageDict['eventType'])
        except Exception as e:
            print(e)
            app.logger.error('Could not parse JSON from socket message: ' +
                             message)

    def on_pong(self, data):
        self.kill = False

    def data_received(self, data):
        pass

    @staticmethod
    def _message(event, data):
        """Helper method to wrap a message for sending"""
        return {
            'eventType': event,
            'data': data
        }


class ClientWatcherDaemon(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self)
        self.runners = []

    def run(self):
        while True:
            time.sleep(15)
            for username in SocketHandler.clients:
                for client in SocketHandler.clients[username]:
                    try:
                        if client.kill:
                            Event.log(username, 'finish', 'lost connection')
                            client.close()
                            SocketHandler.clients[username].remove(client)
                            continue
                        client.ping(b'test')
                        client.kill = True
                    except tornado.websocket.WebSocketClosedError:
                        SocketHandler.clients[username].remove(client)

daemon = ClientWatcherDaemon()
daemon.start()


class FakeRequest:

    def __init__(self, cookie):
        self.cookies = {
            app.session_cookie_name: cookie
        }
