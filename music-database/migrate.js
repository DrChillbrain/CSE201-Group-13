const sqlite3 = require('sqlite3').verbose();

// Create DB

const db = new sqlite3.Database('./songs.db', (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  // Add SQL statemnts here to create tables in the database
  // db.run('');
  //db.run('DROP TABLE songs');
  db.run(
    // eslint-disable-next-line comma-dangle
    'create TABLE songs(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255))'
  );
  db.run('INSERT INTO songs(name) VALUES ("Country Roads")');
  db.run('INSERT INTO songs(name) VALUES ("Toxic")');
  db.run('INSERT INTO songs(name) VALUES ("Born to Run")');
});
