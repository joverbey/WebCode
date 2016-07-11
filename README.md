# WebCode

WebCode provides the ability to write, edit, and run CUDA and OpenACC programs from a Web browser.  It was used in Auburn University's GPU Programming class during the Spring 2016 semester and is based on [AUACM](https://github.com/AuburnACM/auacm).

It needs a better name.  Sometimes we refer to it affectionately as El Spice (an anagram of ``eclipse''), particularly when it is sluggish or we discover a bug.

## Setup Instructions

### Prerequisites

Install Python 3

Install VirtualEnv (using python3) - see https://virtualenv.pypa.io/en/latest/installation.html

Install LibFFI - ftp://sourceware.org/pub/libffi/libffi-3.2.tar.gz - make and put into C_INCLUDE_PATH and LD_LIBRARY_PATH

Install Node (and NPM) - https://nodejs.org/en/

Install MySQL (MariaDB on CentOS).

By default, MySQL connections time out after a short period of time.  This needs to be changed.  In /etc/my.cnf:
```
[mysqld]
wait_timeout = 31536000
interactive_timeout = 31536000
```

### Setting Up WebCode
From the WebCode directory:
```
cd webcode
mkdir app/data/submits
npm install bower
virtualenv -p python3 flask
./flask/bin/pip install -r requirements.txt
    # If you get "failed building wheel", no problem; just make sure success at end
node_modules/bower/bin/bower install
```
Then create webcode/app/config.py, including the MySQL password.

Finally, follow the instructions at the top of ```webcode/run_as_nobody.c``` to
compile run_as_nobody and install it in /usr/bin or another directory on the PATH.

### Database Creation
From the WebCode directory:
```
cd setup
mysql < webcode.sql
```

### User Creation
From the WebCode directory:
```
cd webcode
flask/bin/python3 make_user.py
```

### Running the Server
From the WebCode directory:
```
cd webcode
./run.py
```
Then browse to http://localhost:8000

## Miscellaneous Notes

To recreate webcode.sql (i.e., dump database structure):
```
mysqldump -u root -p -d --add-drop-database --result-file=webcode.sql --databases webcode
```
