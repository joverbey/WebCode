# WebCode

## Essential
- [x] Log in (we can create credentials in advance, if it's easier)
- [x] Select a project to open (we can create and set up projects on the server in advance)
- [x] Edit code - cf. http://ace.ajax.org
  - [x] Log if the user is active (editing/scrolling/etc.) or inactive once every 30 seconds/minute (with timestamp)
  - [x] Automatically save the user's code to the server once every 30 seconds/minute
  - [x] Warn (lock editor?) if the connection is lost
- [ ] Compile code, displaying warnings/errors
  - [ ] Compile CUDA code
  - [ ] Compile OpenACC code
  - [x] Compile basic C code
  - [x] Display warnings/errors from compilation
  - [x] Log that the user compiled the code together with a timestamp and whether errors/warnings produced
  - [x] Save the code so we can view that version
- [x] Run and display the program's output
  - [x] Log that the user ran the code together with a timestamp, the exit code, and what output was produced

## High Priority
- [x] Put compilations and runs in a queue since we only have one PGCC license and one GPU, and we don't want jobs affecting each other's runtimes
- [x] Allow the user to view (or revert to?) a previous version of the code
- [ ] We might have the user's code output a SVG image (we can use a fixed filename, like output.svg) -- if the code outputs this file, display the image along with the output
- [ ] For OpenACC projects, provide an option to compile and run /without/ OpenACC enabled (i.e., without -ta=nvidia)

## Post-Release Bug Fixes/Feature Additions
- [x] Allow user to change theme/font size (student suggestion)
- [x] Add button to download source code as .c/.cu file (student suggestion)
- [x] Bind key to run?  Ctrl+R
- [ ] Automatically switch to project after closing the Create dialog
- [ ] Show list of control keys somewhere - Ctrl+L, Ctrl+F (twice to replace), Ctrl+R
- [ ] Code cleanup
- [ ] Integrate refactorings (CLI) into WebCode - put this on a separate branch

## Setup Instructions

Install Python 3

Install VirtualEnv (using python3) - see https://virtualenv.pypa.io/en/latest/installation.html

Install LibFFI - ftp://sourceware.org/pub/libffi/libffi-3.2.tar.gz - make and put into C_INCLUDE_PATH and LD_LIBRARY_PATH

Install Node (and NPM) - https://nodejs.org/en/

Install Bower:
```
npm install bower
```

Install MySQL. By default, MySQL connections time out after a short period of time.  This needs to be changed.  In /etc/my.cnf:
```
[mysqld]
wait_timeout = 31536000
interactive_timeout = 31536000
```

Finally:
```
virtualenv -p python3 flask
cd setup
/usr/local/mysql/bin/mysql < webcode.sql
cd ../webcode
./flask/bin/pip install -r requirements.txt
    # Failed building wheel — not a problem - just make sure success at end
node_modules/bower/bin/bower install
./run.py
```
