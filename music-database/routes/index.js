const express = require('express');

const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');

async function openDB() {
  return sqlite.open({
    filename: './musicdb.db',
    driver: sqlite3.Database,
  });
}

const router = express.Router();

router.get('/', async (req, res) => {
  const db = await openDB();
  const songsQuery = 'SELECT * FROM songs';
  const songResults = await db.all(songsQuery, []);
  if (req.session.user) {
    res.render('index', {
      songs: songResults,
      user: req.session.user,
    });
  } else {
    res.render('index', {
      songs: songResults,
    });
  }
});

module.exports = router;
