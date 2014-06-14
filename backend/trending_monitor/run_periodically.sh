#!/bin/sh

echo "Running all projects every "$1" seconds"

while true; do python run_all_projects.py && sleep $1; done