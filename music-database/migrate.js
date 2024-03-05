const sqlite3 = require('sqlite3').verbose();

// Create DB

const db = new sqlite3.Database('./musicdb.db', (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  // Add SQL statemnts here to create tables in the database
  //db.run('');
  db.run('DROP TABLE IF EXISTS songs');
  db.run('DROP TABLE IF EXISTS users');
  db.run(
    'create TABLE songs(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255))'
  );
  db.run(
    'CREATE TABLE users (id integer PRIMARY KEY AUTOINCREMENT, name text,username text UNIQUE, email text UNIQUE, password text)'
  );
  db.run('INSERT INTO songs(name) VALUES ("Country Roads")');
  db.run('INSERT INTO songs(name) VALUES ("Toxic")');
  db.run('INSERT INTO songs(name) VALUES ("Born to Run")');
});
