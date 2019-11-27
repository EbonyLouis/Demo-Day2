module.exports = function(app, passport, multer, db, ObjectId) {

  // normal routes =================================================



  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('login.ejs', {message: ""});
  });

  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {message: ""});
  });
  app.get('/patientSearch', function(req, res) {
    res.render('search.ejs', {patientList: null});
  });
  // app.get('/test', function(req, res) {
  //     res.render('search.ejs', {message: ""});
  // });

  // patient info grabbing the info from the database to render on the page
  app.post('/patientSearch', function(req, res) {
    db.collection('patients').find({keyword: req.body.keyword}).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('search.ejs', {
        // user : req.user,
        patientList: result
      })
    })
  });

  // single patient page information below to find the page

  app.get('/patient', isLoggedIn, function(req, res) {
    db.collection('patients').findOne({name:req.query.name},(err, result) => {
      console.log('patient:', result)
      if (err) return console.log(err)
      res.render('pprofile.ejs', {
        patient: result,
        uId: ObjectId(req.session.passport.user)
      })
    })
  });

  // Images saving them to the database
  // need help getting the url to match the keyword when updating images
  // var upload = multer({ dest: "./public/images/uploads/"});

  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    }
  });

  var upload = multer({storage: storage});

  app.post('/uploadImage', upload.single('patientPhotos'), (req, res, next) => {
    console.log(res)
    insertDocuments(db, req, 'images/uploads/' + req.file.originalname, () => {
      res.redirect(req.get('referer'));
      // res.redirect('/patient?name=<%=patientList[i].name')
    });
  });

  var insertDocuments = function(db, req, filePath, callback) {
    // console.log("saving image as:", filePath);
    var collection = db.collection('patients');
    // console.log('what im looking for:' , req.body.name)
    // console.log('Here:',filePath)
    collection.findOneAndUpdate({name: req.body.name}, {

      $set: {
        image: filePath
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })
  }

  // updating private notes

  app.post('/updateNotes',(req, res, next) =>{
    console.log('running updateNotes')
    updatePrivateNotesInDatabase(db, req, ()=>{
      res.redirect(req.get('referer'));
    });
  });

  var updatePrivateNotesInDatabase = function (db, req, callback){
    var collection = db.collection('patients');
    var patientId = ObjectId(req.body.patientId)
    console.log('this is the user ID',patientId)
    collection.findOneAndUpdate({"_id": patientId},{

      $push: {
        privateNotes: {date: req.body.date ,time: req.body.time, note: req.body.notes, user: ObjectId(req.session.passport.user)}

      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      console.log('this is the result:',result)
      if (err) return res.send(err)
      callback(result)
    })

  }

  // updating public notes

  app.post('/updateNotes2',(req, res, next) =>{
    console.log('running updateNotes2')
    updateNotesInDatabase(db, req, ()=>{
      res.redirect(req.get('referer'));
    });
  });

  var updateNotesInDatabase = function (db, req, callback){
    var collection = db.collection('patients');
    var patientId = ObjectId(req.body.patientId)
    console.log('this is the user ID',patientId)
    collection.findOneAndUpdate({"_id": patientId}, {

      $push: {
        publicNotes: {date: req.body.date ,time: req.body.time, note: req.body.notes}
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })

  }






















  // app.post('/uploadImage' , upload.single('patientPhotos'), (req, res) =>{
  //   console.log('hi');
  //   console.log('this is the image:' ,req.file);
  //   db.collection('patients').aggregate([
  //     {
  //        $set:{
  //          "image" :req.file.filename,
  //        }
  //     },{
  //       sort: {_id: -1},
  //       upsert: true
  //     }, (err, result) => {
  //       if (err) return res.send(err)
  //       res.send(result)
  //     }
  //   ])
  // })


  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, function(req, res) {
    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('profile.ejs', {
        user : req.user
      })
    })
  });

  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  //

  // board routes ===============================================================

  app.post('/messages', (req, res) => {
    db.collection('messages').save({name: req.body.name, msg: req.body.msg,
      thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.put('/messages2', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp - 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name,
        msg: req.body.msg}, (err, result) => {
          if (err) return res.send(500, err)
          res.send('Message deleted!')
        })
      })

      // =============================================================================
      // AUTHENTICATE (FIRST LOGIN) ==================================================
      // =============================================================================

      // locally --------------------------------
      // LOGIN ===============================
      // show the login form
      app.get('/login', function(req, res) {
        const loginMessage = req.flash('loginMessage');
        res.render('login.ejs', { message: loginMessage });
      });

      // process the login form
      app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/patientSearch', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
      }));

      // SIGNUP =================================
      // show the signup form
      app.get('/signup', function(req, res) {

        res.render('signup.ejs', { message: req.flash('signupMessage') });
      });

      // process the signup form
      app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/patientSearch', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
      }));

      // =============================================================================
      // UNLINK ACCOUNTS =============================================================
      // =============================================================================
      // used to unlink accounts. for social accounts, just remove the token
      // for local account, remove email and password
      // user account will stay active in case they want to reconnect in the future

      // local -----------------------------------
      app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });

    };

    // route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
      if (req.isAuthenticated())
      return next();

      res.redirect('/');
    }
