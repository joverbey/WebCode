import os
import os.path
import shlex
import subprocess
import threading
import time

from app import app
from app.modules.sockets.socket_handler import SocketHandler


ALLOWED_EXTENSIONS = ['java', 'c']
COMPILE_COMMAND = {
    'oacc': 'gcc {0}.c -o {0}',
    'cuda': 'gcc {0}.c -o {0}',
    # 'oacc': 'pgcc -ta=nvidia -Minfo=accel -o {0} {0}.c',
    # 'cuda': 'nvcc -o {0} {0}.cu'
}
RUN_COMMAND = {
    'oacc': '{0}/{1}',
    'cuda': '{0}/{1}'
}
FILE_EXTENSIONS_FROM_TYPE = {
    'cuda': '.cu',
    'oacc': '.c'
}
DB_STATUS = ['success', 'compile', 'compsucc', 'runtime', 'timelimit']

NO_ERRORS = 0
COMPILATION_ERROR = 1
COMPILATION_SUCCESS = 2
RUNTIME_ERROR = 3
TIMELIMIT_EXCEEDED = 4

TIME_LIMIT = 120

OUT_FILE_NAME = 'out.txt'
ERR_FILE_NAME = 'error.txt'

COMPILE_PART = 'compile'
EXECUTE_PART = 'execute'


def allowed_filetype(filename):
    """Check to see if the filename is an allowed type or not"""
    return ('.' in filename and
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS)


class RunnerQueueThread(threading.Thread):

    def __init__(self):
        threading.Thread.__init__(self)
        self.runners = []

    def run(self):
        while True:
            if len(self.runners) == 0:
                time.sleep(.1)
            else:
                runner = self.runners.pop(0)
                runner.run()

    def add(self, runner):
        self.runners.append(runner)


class Runner:
    """A container for a judging instance. It contains the submission, the
    source code that goes along with the submission, and the time limit of the
    problem.
    """

    runner_thread = RunnerQueueThread()

    def __init__(self, submission, uploaded_file_name):
        """Create a new Judgement instance.

        :param submission: the submission to be judged
        :param uploaded_file_name: the source code file name
        :param time_limit: the time limit for execution
        """
        self.submission = submission
        self.uploaded_file_name = uploaded_file_name
        self.submission_path = (os.path.join(
            app.config['DATA_FOLDER'], 'submits', str(self.submission.job)))

    def run_queued(self):
        try:
            if not Runner.runner_thread.is_alive():
                Runner.runner_thread.start()
        except RuntimeError:  # something bad happened; we need to restart the queue thread. TODO: look more into this
            Runner.runner_thread = RunnerQueueThread()
            Runner.runner_thread.start()

        Runner.runner_thread.add(self)

    def run(self):
        """Attempts to compile then execute a given file if the run flag is set.

        :return: one of the status constants representing the success
        """
        status, result_code = self._compile_submission()
        self._update_status(status, COMPILE_PART, result_code)

        if status == COMPILATION_SUCCESS and self.submission.run == 1:
            status, max_time = self._execute_submission()
            self._update_status(status, EXECUTE_PART, result_code)
        else:
            max_time = -1

        return status, max_time

    def _update_status(self, status, part, exit_code):
        """Updates the status of the submission and notifies the clients that
        the submission has a new status.
        """
        self.submission.update_status(exit_code, DB_STATUS[status])
        try:
            directory = self.submission_path
            stdout = open(os.path.join(directory, part + OUT_FILE_NAME)).read()
            stderr = open(os.path.join(directory, part + ERR_FILE_NAME)).read()

            SocketHandler.emit('submit', {
                'job': self.submission.job,
                'part': part,
                'stderr': self._sanitize_output(stderr),
                'stdout': self._sanitize_output(stdout),
                'exit_code': exit_code
            })
        except:
            SocketHandler.emit('submit', {
                'error': 'something went horribly wrong'
            })

    def _sanitize_output(self, output):
        """Remove any instances of the actual run location from the output"""
        directory = os.path.join(app.config['DATA_FOLDER'], 'submits',
                str(self.submission.job))
        return output.replace(directory + '/', '')

    def _compile_submission(self):
        """Compile the submission if it needs compilation. A programming
        language that does not need compilation will return COMPILATION_SUCCESS.
        """
        directory = self.submission_path
        filename = self.uploaded_file_name
        name, _ = filename.rsplit('.', 1)

        result = subprocess.call(
            shlex.split(COMPILE_COMMAND[self.submission.type].format(os.path.join(directory, name))),
            stderr=open(os.path.join(directory, COMPILE_PART + ERR_FILE_NAME), 'w'),
            stdout=open(os.path.join(directory, COMPILE_PART + OUT_FILE_NAME), 'w')
        )

        if result == 0:
            return COMPILATION_SUCCESS, result
        else:
            return COMPILATION_ERROR, result

    def _execute_submission(self):
        """Run the submission.

        This method:
            1. detects all the input files associated with this problem.
            2. runs the submission with each input file
            3. checks the performance of the submission for errors
            4. compares the output against correct test output
        """
        # Iterate over all the input files.

        start_time = time.time()
        process = self._create_process()
        try:
            # Set a time limit for the process's execution and wait for
            # it to terminate.
            process.communicate(timeout=TIME_LIMIT)
        except subprocess.TimeoutExpired:
            # If the process times out, then we will kill it outselves
            process.kill()
            return TIMELIMIT_EXCEEDED, TIME_LIMIT

        end_time = time.time()
        total_time = end_time - start_time

        if process.poll() != 0:
            # If the process's exit code was nonzero, then it had a
            # runtime error.
            return RUNTIME_ERROR, total_time

        # The answer is correct if all the tests complete without any failure.
        return NO_ERRORS, total_time

    def _create_process(self):
        """Run the program as a subprocess.

        Creates a process with the correct handlers to route the output to
        /data/submits/<job>/out.

        :param out_file: the output file that is going to be written to
        """

        # Configure all of the directories and input/output files
        name, _ = self.uploaded_file_name.rsplit('.', 1)
        directory = self.submission_path

        # Create the subprocess
        process = subprocess.Popen(
            shlex.split(RUN_COMMAND[self.submission.type].format(self.submission_path, name)),
            stdout=open(os.path.join(directory, EXECUTE_PART + OUT_FILE_NAME), 'w'),
            stderr=open(os.path.join(directory, EXECUTE_PART + ERR_FILE_NAME), 'w'))

        return process
