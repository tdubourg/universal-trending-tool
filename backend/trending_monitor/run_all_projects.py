#!/usr/bin/python
import sys
from subprocess import Popen

def exec_and_output(shell_command, args_list):
    print "Executing:", shell_command, args_list
    command = ["time", shell_command]  # TIME ALL THE THINGS!
    command.extend([str(_) for _ in args_list])
    # There is a known deadlock bug with PIPE in case output is more than 64k
    # It will likely be here, but as I am printing stdout on the spot, hopefully the bug won't trigger
    # as I should be emptying the bugger.
    # As for stderr, there should not be any info there, hopefully everything'll be fine
    Popen(command, stdout=sys.stdout, stderr=sys.stderr) #.communicate() # we do not want it blocking, this time

def init_db():
    import sqlite3
    return sqlite3.connect("../../database.db")

def main():
    c = init_db()
    r = c.execute('SELECT id FROM search').fetchall()
    for pid in r:
        pid = pid[0]
        exec_and_output(
            "/usr/bin/scrapy", 
            [
                "crawl", 
                "trending_monitor",
                "-a",
                "db_path=../../database.db", 
                "-a",
                "pid=%d" % pid
            ]
        )

if __name__ == '__main__':
    main()
