const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');

async function openDB() {
  return sqlite.open({
    filename: './musicdb.db',
    driver: sqlite3.Database,
  });
}

router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

router.post('/register', async (req, res) => {
  const db = await openDB();
  const errors = [];

  if (req.body.password !== req.body.passwordConf) {
    errors.push('The provided passwords do not match.');
  }

  if (
    !(
      req.body.name &&
      req.body.email &&
      req.body.username &&
      req.body.password &&
      req.body.passwordConf &&
      !(typeof req.body.selectedPhotoId === 'undefined')
    )
  ) {
    errors.push('All fields are required.');
  }

  const emailSelectQuery = 'SELECT * FROM users WHERE email = $1';
  const emailData = await db.all(emailSelectQuery, [req.body.email]);
  if (emailData.length > 0) {
    errors.push('That email has already been registered to an account.');
  }

  const selectQuery = 'SELECT * FROM users WHERE username = $1';
  const data = await db.all(selectQuery, [req.body.username]);

  if (data.length > 0) {
    errors.push('That username is already taken.');
  }

  if (!errors.length) {
    const insertQuery =
      'INSERT INTO users (name, username, email, password, profile_picture) VALUES ($1, $2, $3, $4, $5)';
    const password = await bcrypt.hash(req.body.password, 10);
    const results = db.all(insertQuery, [
      req.body.name,
      req.body.username,
      req.body.email,
      password,
      req.body.selectedPhotoId,
    ]);
    console.log(results);
    res.redirect('login/?reset=false');
  } else {
    res.render('register', { errors });
  }
});

router.get('/login', (req, res) => {
  const isReset = req.query.reset;
  console.log('Have we reset? ' + isReset);
  if (isReset === 'true') {
    console.log('We found isReset to be true');
    res.render('login', {
      confirmMessage:
        'Password reset successful! Please login with your new password.',
    });
  } else {
    res.render('login');
  }
});

router.get('/change-password', (req, res) => {
  res.render('change-password', { title: 'Change Password' });
});

router.post('/change-password', async (req, res) => {
  const db = await openDB();
  const errors = [];

  if (req.body.newPassword !== req.body.confPassword) {
    errors.push('The provided passwords do not match.');
  }

  if (!(req.body.newPassword && req.body.confPassword)) {
    errors.push('All fields are required.');
  }

  console.log('First set of errors done.');

  const selectQuery = 'SELECT * FROM users WHERE username = $1';
  const data = await db.all(selectQuery, [req.session.user.username]);
  console.log('Got our data');
  if (!errors.length) {
    if (data.length === 1) {
      const auth = await bcrypt.compare(req.body.newPassword, data[0].password);
      if (auth) {
        errors.push('New password matches the old password.');
      } else {
        console.log('Time to try to update the data.');
        const updateQuery =
          'UPDATE users SET password = ($1) WHERE username = ($2)';
        const encrPassword = await bcrypt.hash(req.body.newPassword, 10);
        const results = db.all(updateQuery, [
          encrPassword,
          req.session.user.username,
        ]);
        console.log(results);
        console.log('Going to try to destroy the session now.');
        req.session.destroy(() => res.redirect('login/?reset=true'));
      }
    } else {
      errors.push(
        'Logged in user not found. This hopefully should never appear.'
      );
    }
  }
  if (errors.length > 0) {
    res.render('change-password', { title: 'Change Password', errors });
  }
});

router.post('/login', async (req, res) => {
  const errors = [];
  const db = await openDB();

  const selectQuery = 'SELECT * FROM users WHERE username = $1';
  const data = await db.all(selectQuery, [req.body.username]);

  //console.log(req.session.user.name);

  if (data.length === 1) {
    const auth = await bcrypt.compare(req.body.password, data[0].password);

    if (auth) {
      // eslint-disable-next-line prefer-destructuring
      req.session.user = data[0];

      console.log('This is where we initialize the users session info.');

      /**req.session.cart = [];
      req.session.cartCount = 0;
      req.session.nextCartId = 1;
      console.log('cart: ' + req.session.cart);
      console.log('cartcount: ' + req.session.cartCount);
      console.log('nextCardId: ' + req.session.nextCartId);**/

      req.session.save(() => res.redirect('/'));
    } else {
      errors.push('Incorrect username/password');
      res.render('login', { errors });
    }
  } else {
    errors.push('Incorrect username/password');
    res.render('login', { errors });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/playlist', async (req, res) => {
  const db = await openDB();
  const playlistsQuery = 'SELECT * FROM playlists WHERE user_id = $1';
  //console.log('USER ID IN SESSION: ' + req.session.user.id);
  const playlistsResults = await db.all(playlistsQuery, [req.session.user.id]);
  //console.log('PLAYLISTSRESULTS: ' + playlistsResults);
  res.render('playlist', {
    playlists: playlistsResults,
    user: req.session.user,
  });
});

router.get('/browse', async (req, res) => {
  const db = await openDB();
  const playlistsQuery = 'SELECT * FROM playlists WHERE public = TRUE';
  const usernameLookupQuery = 'SELECT * FROM users WHERE id = $1';
  let usernamesArray = [];
  //console.log('USER ID IN SESSION: ' + req.session.user.id);
  const playlistsResults = await db.all(playlistsQuery);
  for (let i = 0; i < playlistsResults.length; i++) {
    let usernameResults = await db.all(usernameLookupQuery, [
      playlistsResults[i].user_id,
    ]);
    playlistsResults[i].user_id = usernameResults[0].username;
  }
  //console.log('PLAYLISTSRESULTS: ' + playlistsResults);
  res.render('browse', {
    playlists: playlistsResults,
    user: req.session.user,
  });
});

router.post('/playlist', async (req, res) => {
  const errors = [];
  const db = await openDB();

  const selectQuery = 'SELECT * FROM playlists WHERE playlist_name = $1';
  const playlistsQuery = 'SELECT * FROM playlists WHERE user_id = $1';
  const redundancyCheck = await db.all(selectQuery, [req.body.addingPlaylist]);
  if (!req.body.addingPlaylist) {
    errors.push('field is required.');
    const playlistsResults = await db.all(playlistsQuery, [
      req.session.user.id,
    ]);
    res.render('playlist', {
      errors: errors,
      playlists: playlistsResults,
      user: req.session.user,
    });
    res.render('playlist', { errors });
  } else if (redundancyCheck.length > 0) {
    const playlistsResults = await db.all(playlistsQuery, [
      req.session.user.id,
    ]);
    errors.push('No duplicate playlists.');
    res.render('playlist', {
      errors: errors,
      playlists: playlistsResults,
      user: req.session.user,
    });
  } else {
    let isPublic = false;
    if (req.body.publicity == 'on') {
      isPublic = true;
    }
    const insertQuery =
      'INSERT INTO playlists (playlist_name, playlist_description, user_id, public) VALUES ($1, $2, $3, $4)';
    const results = db.all(insertQuery, [
      req.body.addingPlaylist,
      req.body.description,
      req.session.user.id,
      isPublic,
    ]);
    //console.log(results);
    const playlistsQuery = 'SELECT * FROM playlists WHERE user_id = $1';
    //console.log('USER ID IN SESSION: ' + req.session.user.id);
    const playlistsResults = await db.all(playlistsQuery, [
      req.session.user.id,
    ]);
    //console.log('PLAYLISTSRESULTS: ' + playlistsResults);
    res.render('playlist', {
      confirmMessage: 'Playlist has been successfully created.',
      playlists: playlistsResults,
      user: req.session.user,
    });
  }
});

router.get('/viewplaylist/:id', async (req, res) => {
  let signedIn,
    editor = false;
  if (req.session.user) {
    signedIn = true;
  }
  console.log("We're in this view route.");
  const db = await openDB();
  const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
  const playlistResults = await db.all(playlistQuery, [req.params.id]);
  if (signedIn || playlistResults[0].public == true) {
    if (signedIn) {
      if (playlistResults[0].user_id == req.session.user.id) {
        editor = true;
      }
    }
    //code for rendering songs already in the playlist
    const playlistSongQuery =
      'SELECT * FROM playlist_songs WHERE playlist_id = $1';
    const playlistSongResults = await db.all(playlistSongQuery, [
      req.params.id,
    ]);
    let songResult, songQuery;
    let songList = [];
    for (i = 0; i < playlistSongResults.length; i++) {
      console.log(playlistSongResults[i].song_id);
      songQuery = 'SELECT * FROM songs WHERE id = $1';
      songResult = await db.all(songQuery, [playlistSongResults[i].song_id]);
      songList.push({
        id: playlistSongResults[i].id,
        name: songResult[0].name,
        genre: songResult[0].genre,
        artist: songResult[0].artist,
      });
    }
    const idToPass = parseInt(req.params.id, 10);
    if (editor) {
      res.render('viewplaylist', {
        songsInList: songList,
        playlistName: playlistResults[0].playlist_name,
        description: playlistResults[0].playlist_description,
        playlistID: idToPass,
        editor: true,
      });
    } else {
      res.render('viewplaylist', {
        songsInList: songList,
        playlistName: playlistResults[0].playlist_name,
        description: playlistResults[0].playlist_description,
        playlistID: idToPass,
      });
    }
  } else {
    res.redirect('/');
  }
});

router.get('/accountSettings', async (req, res) => {
  const db = await openDB();
  const userQuery = 'SELECT name, username, email FROM users WHERE id = $1';
  const userResults = await db.all(userQuery, [req.session.user.id]);
  const userQueryPic = 'SELECT profile_picture FROM users WHERE id = $1';
  const userResultsPic = await db.all(userQueryPic, [req.session.user.id]);

  let profilePic = '';
  if (userResultsPic[0].profile_picture == 1) {
    profilePic = 'profilePicture1.jpg';
  } else if (userResultsPic[0].profile_picture == 2) {
    profilePic = 'profilePicture2.jpg';
  } else if (userResultsPic[0].profile_picture == 3) {
    profilePic = 'profilePicture3.jpg';
  } else {
    profilePic = 'profilePicture4.jpg';
  }

  res.render('accountSettings', {
    details: userResults,
    picture: profilePic,
  });
});

router.get('/change-profile-pic', async (req, res) => {
  const db = await openDB();
  const userQueryPic = 'SELECT profile_picture FROM users WHERE id = $1';
  const userResultsPic = await db.all(userQueryPic, [req.session.user.id]);

  let profilePic = '';
  if (userResultsPic[0].profile_picture == 1) {
    profilePic = 'profilePicture1.jpg';
  } else if (userResultsPic[0].profile_picture == 2) {
    profilePic = 'profilePicture2.jpg';
  } else if (userResultsPic[0].profile_picture == 3) {
    profilePic = 'profilePicture3.jpg';
  } else {
    profilePic = 'profilePicture4.jpg';
  }

  res.render('change-profile-pic', { picture: profilePic });
});

router.post('/change-profile-pic', async (req, res) => {
  const errors = [];
  const db = await openDB();

  if (!(typeof req.body.selectedPhotoId === 'undefined')) {
    console.log('test1');
    const selectQuery = 'UPDATE users SET profile_picture = $1 WHERE id = $2';
    const data = await db.all(selectQuery, [
      req.body.selectedPhotoId,
      req.session.user.id,
    ]);
    res.redirect('accountSettings');
  } else {
    const userQueryPic = 'SELECT profile_picture FROM users WHERE id = $1';
    const userResultsPic = await db.all(userQueryPic, [req.session.user.id]);

    let profilePic = '';
    if (userResultsPic[0].profile_picture == 1) {
      profilePic = 'profilePicture1.jpg';
    } else if (userResultsPic[0].profile_picture == 2) {
      profilePic = 'profilePicture2.jpg';
    } else if (userResultsPic[0].profile_picture == 3) {
      profilePic = 'profilePicture3.jpg';
    } else {
      profilePic = 'profilePicture4.jpg';
    }

    errors.push('Must choose an option');
    res.render('change-profile-pic', { errors, picture: profilePic });
  }
});

router.get('/change-name', async (req, res) => {
  const db = await openDB();
  const userQueryName = 'SELECT name FROM users WHERE id = $1';
  const userResultsName = await db.all(userQueryName, [req.session.user.id]);

  res.render('change-name', { name: userResultsName[0].name });
});

router.post('/change-name', async (req, res) => {
  const errors = [];
  const db = await openDB();

  if (req.body.name) {
    console.log('test1');
    const selectQuery = 'UPDATE users SET name = $1 WHERE id = $2';
    const data = await db.all(selectQuery, [
      req.body.name,
      req.session.user.id,
    ]);
    res.redirect('accountSettings');
  } else {
    const userQueryName = 'SELECT name FROM users WHERE id = $1';
    const userResultsName = await db.all(userQueryName, [req.session.user.id]);
    errors.push('Must create new name');
    res.render('change-name', { errors, name: userResultsName[0].name });
  }
});

router.get('/change-email', async (req, res) => {
  const db = await openDB();
  const userQueryEmail = 'SELECT email FROM users WHERE id = $1';
  const userResultsEmail = await db.all(userQueryEmail, [req.session.user.id]);

  res.render('change-email', { email: userResultsEmail[0].email });
});

router.post('/change-email', async (req, res) => {
  const errors = [];
  const db = await openDB();

  const userQueryEmail = 'SELECT email FROM users WHERE id = $1';
  const userResultsEmail = await db.all(userQueryEmail, [req.session.user.id]);

  if (req.body.email) {
    const emailSelectQuery = 'SELECT * FROM users WHERE email = $1';
    const emailData = await db.all(emailSelectQuery, [req.body.email]);
    if (emailData.length > 0) {
      errors.push('That email has already been registered to an account.');
      res.render('change-email', { errors, email: userResultsEmail[0].email });
    } else {
      const selectQuery = 'UPDATE users SET email = $1 WHERE id = $2';
      const data = await db.all(selectQuery, [
        req.body.email,
        req.session.user.id,
      ]);
      res.redirect('accountSettings');
    }
  } else {
    errors.push('Must create new email');
    res.render('change-email', { errors, email: userResultsEmail[0].email });
  }
});

router.get('/change-username', async (req, res) => {
  const db = await openDB();
  const userQueryUsername = 'SELECT username FROM users WHERE id = $1';
  const userResultsUsername = await db.all(userQueryUsername, [
    req.session.user.id,
  ]);

  res.render('change-username', { username: userResultsUsername[0].username });
});

router.post('/change-username', async (req, res) => {
  const errors = [];
  const db = await openDB();

  const userQueryUsername = 'SELECT username FROM users WHERE id = $1';
  const userResultsUsername = await db.all(userQueryUsername, [
    req.session.user.id,
  ]);

  if (req.body.username) {
    const userSelectQuery = 'SELECT * FROM users WHERE username = $1';
    const userData = await db.all(userSelectQuery, [req.body.username]);
    if (userData.length > 0) {
      errors.push('That username has already been registered to an account.');
      res.render('change-username', {
        errors,
        username: userResultsUsername[0].username,
      });
    } else {
      const selectQuery = 'UPDATE users SET username = $1 WHERE id = $2';
      const data = await db.all(selectQuery, [
        req.body.username,
        req.session.user.id,
      ]);
      res.redirect('accountSettings');
    }
  } else {
    errors.push('Must create new username');
    res.render('change-username', {
      errors,
      username: userResultsUsername[0].username,
    });
  }
});

router.get('/editplaylist/:id', async (req, res) => {
  console.log("We're in the edit playlist route.");
  if (req.session.user) {
    const db = await openDB();
    const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
    const playlistResults = await db.all(playlistQuery, [req.params.id]);
    const songsQuery = 'SELECT * FROM songs';
    const data = await db.all(songsQuery);
    if (playlistResults[0].user_id == req.session.user.id) {
      //code for rendering songs already in the playlist
      const playlistSongQuery =
        'SELECT * FROM playlist_songs WHERE playlist_id = $1';
      const playlistSongResults = await db.all(playlistSongQuery, [
        req.params.id,
      ]);
      let songResult, songQuery;
      let songList = [];
      for (i = 0; i < playlistSongResults.length; i++) {
        console.log(playlistSongResults[i].song_id);
        songQuery = 'SELECT * FROM songs WHERE id = $1';
        songResult = await db.all(songQuery, [playlistSongResults[i].song_id]);
        songList.push({
          id: playlistSongResults[i].id,
          name: songResult[0].name,
          genre: songResult[0].genre,
          artist: songResult[0].artist,
        });
      }

      const idToPass = parseInt(req.params.id, 10);
      res.render('editplaylist', {
        songs: data,
        songsInList: songList,
        playlistName: playlistResults[0].playlist_name,
        playlistID: idToPass,
        publicity: playlistResults[0].public,
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

router.post('/editplaylist/:id', async (req, res) => {
  const db = await openDB();
  if (req.session.user) {
    const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
    const playlistResults = await db.all(playlistQuery, [req.params.id]);
    if (playlistResults[0].user_id == req.session.user.id) {
      //code for rendering songs already in the playlist
      const playlistSongQuery =
        'SELECT * FROM playlist_songs WHERE playlist_id = $1';
      const playlistSongResults = await db.all(playlistSongQuery, [
        req.params.id,
      ]);
      let songResult, songQuery;
      let songList = [];
      for (i = 0; i < playlistSongResults.length; i++) {
        console.log(playlistSongResults[i].song_id);
        songQuery = 'SELECT * FROM songs WHERE id = $1';
        songResult = await db.all(songQuery, [playlistSongResults[i].song_id]);
        songList.push({
          id: playlistSongResults[i].id,
          name: songResult[0].name,
          genre: songResult[0].genre,
          artist: songResult[0].artist,
        });
      }

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
      let songsQuery =
        "SELECT * FROM songs WHERE name LIKE '%" + searchQuery + "%'";
      if (genreFilters.length > 0) {
        songsQuery += genreFilterString;
      }
      if (req.body.artistsearch.length > 0) {
        songsQuery += " AND artist LIKE '%" + req.body.artistsearch + "%'";
      }
      const data = await db.all(songsQuery, []);
      const idToPass = parseInt(req.params.id, 10);
      console.log('songList length: ' + songList.length);
      res.render('editplaylist', {
        songs: data,
        songsInList: songList,
        playlistName: playlistResults[0].playlist_name,
        playlistID: idToPass,
        publicity: playlistResults[0].public,
      });
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

router.get('/addtoplaylist/:playlistid/:songid', async (req, res) => {
  if (req.session.user) {
    const db = await openDB();
    const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
    const playlistResults = await db.all(playlistQuery, [
      req.params.playlistid,
    ]);
    if (playlistResults[0].user_id == req.session.user.id) {
      const playlistSongsInsertQuery =
        'INSERT INTO playlist_songs (song_id, playlist_id) VALUES ($1, $2)';
      const results = db.all(playlistSongsInsertQuery, [
        req.params.songid,
        req.params.playlistid,
      ]);
      res.redirect('/users/editplaylist/' + req.params.playlistid);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

router.get(
  '/removefromplaylist/:playlistid/:playlistsongid',
  async (req, res) => {
    if (req.session.user) {
      const db = await openDB();
      const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
      const playlistResults = await db.all(playlistQuery, [
        req.params.playlistid,
      ]);
      if (playlistResults[0].user_id == req.session.user.id) {
        const playlistSongsDeleteQuery =
          'DELETE FROM playlist_songs WHERE id = ($1)';
        const results = db.all(playlistSongsDeleteQuery, [
          req.params.playlistsongid,
        ]);
        res.redirect('/users/editplaylist/' + req.params.playlistid);
      } else {
        res.redirect('/');
      }
    } else {
      res.redirect('/');
    }
  }
);

router.get('/setpublic/:playlistid', async (req, res) => {
  if (req.session.user) {
    const db = await openDB();
    const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
    const playlistResults = await db.all(playlistQuery, [
      req.params.playlistid,
    ]);
    if (playlistResults[0].user_id == req.session.user.id) {
      const publicityQuery =
        'UPDATE playlists SET public = true WHERE playlist_id = $1';
      const results = db.all(publicityQuery, [req.params.playlistid]);
      res.redirect('/users/editplaylist/' + req.params.playlistid);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

router.get('/setprivate/:playlistid', async (req, res) => {
  if (req.session.user) {
    const db = await openDB();
    const playlistQuery = 'SELECT * FROM playlists WHERE playlist_id = $1';
    const playlistResults = await db.all(playlistQuery, [
      req.params.playlistid,
    ]);
    if (playlistResults[0].user_id == req.session.user.id) {
      const publicityQuery =
        'UPDATE playlists SET public = false WHERE playlist_id = $1';
      const results = db.all(publicityQuery, [req.params.playlistid]);
      res.redirect('/users/editplaylist/' + req.params.playlistid);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

module.exports = router;
