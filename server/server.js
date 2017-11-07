require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Event} = require('./models/event');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/api/events', authenticate, (req, res) => {
  var event = new Event({
    title: req.body.title,
    description: req.body.description,
    date: req.body.date,
    createdAt: new Date().getTime(),
    _creator: req.user._id
  });

  event.save().then((doc) => {
    res.send(doc);
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/api/events', authenticate, (req, res) => {
  Event.find({
    _creator: req.user._id
  }).then((events) => {
    res.send({events});
  }, (e) => {
    res.status(400).send(e);
  });
});

app.get('/api/events/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOne({
    _id: id,
    _creator: req.user._id
  }).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.delete('/api/events/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOneAndRemove({
    _id: id,
    _creator: req.user.id
  }).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({success: true});
  }).catch((e) => {
    res.status(400).send();
  });
});

app.patch('/api/events/:id', authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ['text', 'habits']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Event.findOneAndUpdate({_id: id, _creator: req.user.id}, {$set: body}, {new: true}).then((event) => {
    if (!event) {
      return res.status(404).send();
    }

    res.send({event});
  }).catch((e) => {
    res.status(400).send();
  })
});

// POST /users
app.post('/api/users', (req, res) => {
  var body = _.pick(req.body, ['fullName', 'email', 'password']);
  var user = new User(body);
  user.save().then((savedUser) => {
    return user.generateAuthToken();
  }).then((token) => {
    res.header('x-auth', token).send(user);
  }).catch((e) => {
    res.status(400).send(e);
  })
});

app.get('/api/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/api/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);
  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
    console.log(e);
  });
});

app.delete('/api/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then (() => {
    res.status(200).send();
  }, () => {
    res.status(400).send();
  })
});

app.listen(port, () => {
  console.log(`Started up at port ${port}`);
  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
});

module.exports = {app};
