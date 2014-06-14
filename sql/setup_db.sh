#!/bin/sh

echo "Removing former ../database.db..."
rm -vf ../database.db
echo "Recreating the db..."
sqlite3 ../database.db < db_init.txt