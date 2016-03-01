"""Database handlers."""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base

# Create global database variables
Base = automap_base()
engine = create_engine('mysql+pymysql://root@localhost/webcode?charset=utf8')
connection = engine.connect()
session = Session(engine)

# Import all the ORM classes
# TODO: make ORM classes
from app.modules.user_manager.models import User
from app.modules.template_manager.models import Template
from app.modules.project_manager.models import Project
from app.modules.submission_manager.models import Submission

Base.prepare(engine, reflect=True)
