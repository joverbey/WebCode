"""Reflection and utilities for the events database table."""

from app.database import Base, session
import time


class Event(Base):
    """Model object for entries in the templates database table."""

    __tablename__ = 'events'

    @classmethod
    def log(cls, username, type, details=None):
        """
        Logs an event and stores it in the database.

        :param username: the username of the person that made the event
        :param type: the type of event
        :param details: any extra information that we might want to log
        :return: None
        """
        event = Event(username=username, event_type=type, details=details, timestamp=int(time.time()))
        event.commit_to_session()

    def commit_to_session(self):
        """Commit this problem to the database as a new template."""
        session.add(self)
        session.flush()
        session.commit()
        session.refresh(self)
