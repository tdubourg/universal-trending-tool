#!/bin/sh

echo "Removing former ../db.db..."
rm -vf ../Database.db
echo "Recreating the db..."
sqlite3 ../database.db < db_init.txt