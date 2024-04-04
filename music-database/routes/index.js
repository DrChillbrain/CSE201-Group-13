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

router.post('/', async (req, res) => {
  //res.json({ requestBody: req.body });
  var genreFilters = [];
  const searchQuery = req.body.search;
  if (req.body.rock == 'true') {
    genreFilters.push('Rock');
  }
  if (req.body.pop == 'true') {
    genreFilters.push('Pop');
  }
  if (req.body.alternative == 'true') {
    genreFilters.push('Alternative');
  }
  if (req.body.metal == 'true') {
    genreFilters.push('Metal');
  }
  if (req.body.jazz == 'true') {
    genreFilters.push('Jazz');
  }
  if (req.body.disco == 'true') {
    genreFilters.push('Disco');
  }
  var genreFilterString = ' AND (';
  for (var i = 0; i < genreFilters.length; i++) {
    genreFilterString += "genre LIKE '%" + genreFilters[i] + "%'";
    if (i < genreFilters.length - 1) {
      genreFilterString += ' OR ';
    }
  }
  genreFilterString += ')';
  const db = await openDB();
  let songsQuery =
    "SELECT * FROM songs WHERE name LIKE '%" + searchQuery + "%'";
  if (genreFilters.length > 0) {
    songsQuery += genreFilterString;
  }
  if (req.body.artistsearch.length > 0) {
    songsQuery += " AND artist LIKE '%" + req.body.artistsearch + "%'";
  }
  const data = await db.all(songsQuery, []);
  if (req.session.user) {
    res.render('index', {
      songs: data,
      user: req.session.user,
    });
  } else {
    res.render('index', {
      songs: data,
    });
  }
});

module.exports = router;
