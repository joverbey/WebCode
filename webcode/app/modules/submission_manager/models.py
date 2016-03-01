"""Reflection and utilities for the submissions database table."""

from app.database import Base, session

class Submission(Base):
    """Model object for entries in the submissions database table."""

    __tablename__ = 'submissions'

    def commit_to_session(self):
        """Commit this problem to the database as a new submission."""
        session.add(self)
        session.flush()
        session.commit()
        session.refresh(self)

    def to_dict(self):
        return {
            'job': self.job,
            'username': self.username,
            'submit_time': self.submit_time,
            'type': self.type,
            'project_id': self.project_id,
            'run': self.run
        }
