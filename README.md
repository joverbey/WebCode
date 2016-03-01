# WebCode

## Essential
- [x] Log in (we can create credentials in advance, if it's easier)
- [x] Select a project to open (we can create and set up projects on the server in advance)
- [x] Edit code - cf. http://ace.ajax.org
  - [ ] Log if the user is active (editing/scrolling/etc.) or inactive once every 30 seconds/minute (with timestamp)
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
- [ ] Allow the user to view (or revert to?) a previous version of the code
- [ ] We might have the user's code output a SVG image (we can use a fixed filename, like output.svg) -- if the code outputs this file, display the image along with the output
- [ ] For OpenACC projects, provide an option to compile and run /without/ OpenACC enabled (i.e., without -ta=nvidia)

## Low Priority
- [ ] Allow the user to view an older version of the code (from previous compile)
