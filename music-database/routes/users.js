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
      req.body.passwordConf
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
      'INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4)';
    const password = await bcrypt.hash(req.body.password, 10);
    const results = db.all(insertQuery, [
      req.body.name,
      req.body.username,
      req.body.email,
      password,
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

  if (data.length === 1) {
    const auth = await bcrypt.compare(req.body.password, data[0].password);

    if (auth) {
      // eslint-disable-next-line prefer-destructuring
      req.session.user = data[0];
      console.log(req.session.user);

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

router.post('/playlist', async (req, res) => {
  const errors = [];
  const db = await openDB();

  const selectQuery = 'SELECT * FROM playlists WHERE playlist_name = $1';
  const redundancyCheck = await db.all(selectQuery, [req.body.addingPlaylist]);
  if (!req.body.addingPlaylist) {
    errors.push('field is required.');
    res.render('playlist', { errors });
  } else if (redundancyCheck.length > 0) {
    errors.push('No duplicate playlists.');
    res.render('playlist', { errors });
  } else {
    const insertQuery =
      'INSERT INTO playlists (playlist_name, user_id) VALUES ($1, $2)';
    const results = db.all(insertQuery, [
      req.body.addingPlaylist,
      req.session.user.id,
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

module.exports = router;
