from flask import Flask, Response
import time

# Create the God-objects to be used everywhere
app = Flask(__name__)
app.config.from_pyfile('config.py')

# Initialize handler functions.
from app import util
from app import views
