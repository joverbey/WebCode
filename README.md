# WebCode

## Essential
- [x] Log in (we can create credentials in advance, if it's easier)
- [x] Select a project to open (we can create and set up projects on the server in advance)
- [x] Edit code - cf. http://ace.ajax.org
  - [x] Log if the user is active (editing/scrolling/etc.) or inactive once every 30 seconds/minute (with timestamp)
  - [x] Automatically save the user's code to the server once every 30 seconds/minute
  - [x] Warn (lock editor?) if the connection is lost
- [x] Compile code, displaying warnings/errors
  - [x] Compile CUDA code
  - [x] Compile OpenACC code
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
- [x] In addition to "Compile Only", provide something like "Run in cuda-gdb and backtrace" (for debugging segfaults) that executes
      ```bash -c "yes | cuda-gdb --quiet --eval-command=run --eval-command=backtrace --eval-command=quit --args /path/to/submit"```
- [x] If we're going to add other Run commands anyway, two profiling commands are also useful: "Run with nvprof (summary)"
      ```nvprof --print-gpu-summary /path/to/submit```
      and "Run with nvprof --print-gpu-trace"
      ```nvprof --print-gpu-trace /path/to/submit```
- [ ] Automatically switch to project after closing the Create dialog
- [ ] Show list of control keys somewhere - Ctrl+L, Ctrl+F (twice to replace), Ctrl+R
- [ ] Code cleanup
- [ ] Integrate refactorings (CLI) into WebCode - put this on a separate branch

## Miscellaneous Notes

To recreate webcode.sql (i.e., dump database structure):
```
mysqldump -u root -p -d --add-drop-database --result-file=webcode.sql --databases webcode
```

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
