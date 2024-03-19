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
  db.run('DROP TABLE IF EXISTS playlists');
  db.run(
    'create TABLE songs(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), genre VARCHAR(255), artist VARCHAR(255))'
  );
  db.run(
    'CREATE TABLE users (id integer PRIMARY KEY AUTOINCREMENT, name text,username text UNIQUE, email text UNIQUE, password text)'
  );
  db.run(
    'create TABLE playlists(playlist_id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_name VARCHAR(255), user_id integer REFERENCES users (id))'
  );

  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Country Roads", "Folk", "Bill Danoff")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Toxic", "Pop", "Britney Spears")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Born to Run", "Pop", "Bruce Springsteen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Thriller", "Pop", "Michael Jackson")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Bohemian Rhapsody", "Rock", "Queen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Born to Run", "Pop", "Bruce Springsteen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Never Gonna Give You Up", "Pop", "Rick Astley")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Pompeii", "Alternative", "Bastille")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Adventure of a Lifetime", "Pop", "Coldplay")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Fireflies", "Alternative", "Owl City")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("We Are the Champions", "Rock", "Queen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("We Will Rock You", "Rock", "Queen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Born to Run", "Pop", "Bruce Springsteen")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Through the Fire and Flames", "Metal", "Dragonforce")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Thunder", "Pop", "Imagine Dragons")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Thunderstruck", "Metal", "AC/DC")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Macarena", "Pop", "Los del Rio")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Cotton Eye Joe", "Pop", "Rednex")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Fly Me To the Moon", "Jazz", "Bart Howard")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Levitating", "Disco", "Dua Lipa")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Sweet Home Alabama", "Rock", "Lynyrd Skynyrd")'
  );
  db.run(
    'INSERT INTO songs(name, genre, artist) VALUES ("Land Down Under", "Pop", "Men At Work")'
  );
});
