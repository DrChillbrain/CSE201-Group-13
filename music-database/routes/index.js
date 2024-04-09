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
  if (req.session.user) {
    res.render('index', {
      user: req.session.user,
    });
  } else {
    res.render('index', {});
  }
});

router.get('/search', async (req, res) => {
  const db = await openDB();
  const songsQuery = 'SELECT * FROM songs';
  const songResults = await db.all(songsQuery, []);
  if (req.session.user) {
    res.render('songsearch', {
      songs: songResults,
      user: req.session.user,
    });
  } else {
    res.render('songsearch', {
      songs: songResults,
    });
  }
});

module.exports = router;
