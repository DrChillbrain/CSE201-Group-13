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
  const songsQuery = 'SELECT song_id FROM playlist_songs GROUP BY song_id ORDER BY COUNT(*)  DESC LIMIT 5';
  const songsResults = await db.all(songsQuery, []);
  const songsFinalQuery = 'SELECT name, genre, artist FROM songs WHERE id IN ($1, $2, $3, $4, $5)';
  
  if(!(songsResults.length == 5))
  {
    const songs2Query = 'SELECT id FROM songs WHERE id NOT IN (SELECT song_id FROM playlist_songs GROUP BY song_id ORDER BY COUNT(*) DESC LIMIT 5) ORDER BY id DESC LIMIT $1';
    const songsNeeded = (5 - songsResults.length);
    console.log(songsNeeded);
    const songs2Results = await db.all(songs2Query, [songsNeeded]);
    
    let items = [];

    for(let i = 0; i < songsResults.length; i++)
    {
      items[i] = songsResults[i].song_id;
    }

    for(let i = songsResults.length; i < 5; i++)
    {
      items[i] = songs2Results[i - songsResults.length].id;
    }

    let songsFinalResults = await db.all(songsFinalQuery, [items[0], items[1], items[2], items[3], items[4]]);

    if (req.session.user) {
      res.render('index', {
        songsInList: songsFinalResults,
        user: req.session.user, 
      });
    } 
    else {
      res.render('index', {songsInList: songsFinalResults,});
    }
  }
  else
  {

    let songsFinalResults = await db.all(songsFinalQuery, [songsResults[0].song_id, songsResults[1].song_id, songsResults[2].song_id, songsResults[3].song_id, songsResults[4].song_id]);

    if (req.session.user) {
      res.render('index', {
        songsInList: songsFinalResults,
        user: req.session.user, 
      });
    } 
    else {
      res.render('index', {songsInList: songsFinalResults,});
    }
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
