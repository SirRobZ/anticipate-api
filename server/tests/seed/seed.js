const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const {Reflection} = require('./../../models/reflection');
const {User} = require('./../../models/user');


const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
  _id: userOneId,
  email: 'andrew@example.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: 'jen@example.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
  }]
}]

const reflections = [{
  _id: new ObjectID(),
  mindfulnessScore: 20,
  text: 'First test reflection',
  habits: ['sleep', 'diet'],
  _creator: userOneId
}, {
  _id: new ObjectID(),
  mindfulnessScore: 15,
  text: 'Second test reflection',
  habits: ['exercise', 'meditation'],
  _creator: userTwoId
}];

const populateReflections = (done) => {
  Reflection.remove({}).then(() => {
    return Reflection.insertMany(reflections);
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());
};


module.exports = {reflections, populateReflections, users, populateUsers};
