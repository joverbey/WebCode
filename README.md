# WebCode

## Essential
* Log in (we can create credentials in advance, if it's easier)
* Select a project to open (we can create and set up projects on the server in advance)
* Edit code - cf. http://ace.ajax.org
  * Log if the user is active (editing/scrolling/etc.) or inactive once every 30 seconds/minute (with timestamp)
  * Automatically save the user's code to the server once every 30 seconds/minute
  * Warn (lock editor?) if the connection is lost
* Compile code, displaying warnings/errors
  * Log that the user compiled the code together with a timestamp and whether errors/warnings produced
  * Save the code so we can view that version
* Run and display the program's output
  * Log that the user ran the code together with a timestamp, the exit code, and what output was produced

## High Priority
* Put compilations and runs in a queue since we only have one PGCC license and one GPU, and we don't want jobs affecting each other's runtimes
* Allow the user to view (or revert to?) a previous version of the code

## Low Priority
* Allow the user to view an older version of the code (from previous compile)
