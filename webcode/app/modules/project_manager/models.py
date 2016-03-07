"""Reflection and utilities for the templates database table."""

from app.database import Base, session


TYPE_EXTENSIONS = {
    'oacc': '.c',
    'cuda': '.cu'
}


class Project(Base):
    """Model object for entries in the templates database table."""

    __tablename__ = 'projects'

    def commit_to_session(self):
        """Commit this problem to the database as a new template."""
        session.add(self)
        session.flush()
        session.commit()
        session.refresh(self)

    def to_dict(self):
        return {
            'body': self.body,
            'cursor_x': self.cursor_x,
            'cursor_y': self.cursor_y,
            'type': self.type,
            'project_id': repr(self.project_id),
            'last_edited': self.last_edited,
            'title': self.title + TYPE_EXTENSIONS[self.type]
        }
