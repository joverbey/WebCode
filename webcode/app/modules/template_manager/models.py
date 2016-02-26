"""Reflection and utilities for the templates database table."""

from app.database import Base, session

class Template(Base):
    """Model object for entries in the templates database table."""

    __tablename__ = 'templates'


    def commit_to_session(self):
        """Commit this problem to the database as a new template."""
        session.add(self)
        session.flush()
        session.commit()
        session.refresh(self)

    def to_dict(self):
        return {
            'title': self.title,
            'body': self.body,
            'cursor_x': self.cursor_x,
            'cursor_y': self.cursor_y,
            'type': self.type
        }
