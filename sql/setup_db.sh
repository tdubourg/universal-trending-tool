#!/bin/sh

echo "Removing former ../db.db..."
rm -vf ../db.db
echo "Recreating the db..."
sqlite3 ../db.db < db_init.txt
