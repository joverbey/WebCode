/*
 * Executes a child process under a new UID
 * J. Overbey (3/31/16)
 *
 * To compile and install this in /usr/bin (to ensure it is on the PATH):
 *
 * gcc -o run_as_nobody run_as_nobody.c
 * sudo mv run_as_nobody /usr/bin
 * sudo chown nobody:nobody /usr/bin/run_as_nobody
 * sudo setcap cap_setuid,cap_setgid,cap_dac_override=+ep /usr/bin/run_as_nobody
 */
#include <errno.h>
#include <pwd.h>
#include <stdio.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

/* Username under which the child process will execute */
#define USERNAME "nobody"

int main(int argc, char **argv) {
    struct passwd *passwd;
    pid_t child_pid;
    int status = 1;

    if (argc < 2) {
        fprintf(stderr, "Usage: run_as_nobody path [arg ...]\n");
        return 2;
    }

    /* Lookup the UID of the user */
    errno = 0;
    if ((passwd = getpwnam(USERNAME)) == NULL) {
        perror("getpwnam");
        return 1;
    }

    /* Change the (real and effective) UID of this process */
    if (setgid(passwd->pw_gid)) {
        perror("setgid");
        return 1;
    }
    if (setuid(passwd->pw_uid)) {
        perror("setuid");
        return 1;
    }

    /* Fork so the child process will not inherit our capabilities */
    switch (child_pid = fork()) {
    case -1:
        perror("fork");
        return 1;

    case 0:
        /* Execute the child process under the new UID */
        execvp(argv[1], &argv[1]);
        perror(argv[1]);
        return 1;

    default:
        do {
            if (waitpid(child_pid, &status, WUNTRACED | WCONTINUED) < 0) {
                perror("wait");
                return 1;
            }
            if (WIFEXITED(status)) {
                return WEXITSTATUS(status);
            } else if (WIFSIGNALED(status)) {
                printf("Program killed by signal %d\n", WTERMSIG(status));
                return 128+status;
            } else if (WIFSTOPPED(status)) {
                printf("Program stopped by signal %d\n", WSTOPSIG(status));
            } else if (WIFCONTINUED(status)) {
                printf("Program continued\n");
            }
        } while (!WIFEXITED(status) && !WIFSIGNALED(status));
    }
}
