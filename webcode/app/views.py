from app import app
from flask import render_template

@app.route('/')
def home():
    return render_template('index.html', display_name='William Hester',
                           logged_in='false')
