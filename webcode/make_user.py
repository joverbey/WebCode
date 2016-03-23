#!flask/bin/python
import getpass
import bcrypt
from app.modules.user_manager.models import User

username = input('Username: ')
display = input('Display Name: ')
admin = ''
while admin.lower() != 'y' and admin.lower() != 'n':
    admin = input('Admin? (Y/n): ')

admin = 1 if admin.lower() == 'y' else 0
password = getpass.getpass('Password: ')

user = User(username=username,
            display=display,
            password=bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()),
            admin=admin,
            last_project=-1
            )
user.commit_to_session()
