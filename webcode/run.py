#!flask/bin/python
from __future__ import print_function
from tornado.wsgi import WSGIContainer
from tornado.web import Application, FallbackHandler
from tornado.ioloop import IOLoop

from app import app
from app.modules.sockets.socket_handler import SocketHandler

if __name__ == "__main__":
    def main():
        container = WSGIContainer(app)
        server = Application([
            (r'/websocket', SocketHandler),
            (r'.*', FallbackHandler, dict(fallback=container))
        ])
        server.listen(8000, '0.0.0.0')
        IOLoop.instance().start()

    if app.config['DEBUG']:
        from reloader import run_with_reloader
        run_with_reloader(main)
    else:
        main()
