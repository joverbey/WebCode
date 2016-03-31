"""Database handlers."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.automap import automap_base
from app import app

# Create global database variables
Base = automap_base()
engine = create_engine('mysql+pymysql://root:' + app.config['PASSWORD'] + '@localhost/webcode?charset=utf8')
Session = sessionmaker()
Session.configure(bind=engine)
session = Session()

# Import all the ORM classes
# TODO: make ORM classes
from app.modules.user_manager.models import User
from app.modules.template_manager.models import Template
from app.modules.project_manager.models import Project
from app.modules.submission_manager.models import Submission
from app.modules.event_manager.models import Event

Base.prepare(engine, reflect=True)
