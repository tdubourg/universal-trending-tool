DROP TABLE IF EXISTS SEARCH;
DROP TABLE IF EXISTS RESULT;

CREATE TABLE SEARCH(
 ID INTEGER PRIMARY KEY AUTOINCREMENT,
 XPATH varchar(4000) NOT NULL,
 NAME varchar(100) NOT NULL,
 PATTERN varchar(4000) NOT NULL
);

CREATE TABLE RESULT(
 ID INTEGER PRIMARY KEY AUTOINCREMENT,
 SEARCH_ID INTEGER,
 PAGE varchar(100),
 SCORE INTEGER,
 TIMESTAMP DATETIME,
 FOREIGN KEY(SEARCH_ID) REFERENCES SEARCH(ID) ON DELETE CASCADE
);
