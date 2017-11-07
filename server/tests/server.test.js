const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Reflection} = require('./../models/reflection');
const {User} = require('./../models/user');
const {reflections, populateReflections, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateReflections);



describe('POST /api/reflections', () => {
  it('should create a new reflection', (done) => {
    var testReflection = {
      mindfulnessScore: 25,
      text: 'Another reflection',
      habits: ['sleep', 'exercise', 'diet']
    };

    request(app)
      .post('/api/reflections')
      .set('x-auth', users[0].tokens[0].token)
      .send(testReflection)
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(testReflection.text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Reflection.find(testReflection).then((reflections) => {
          expect(reflections.length).toBe(1);
          expect(reflections[0].text).toBe(testReflection.text);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not create reflection with invalid body data', (done) => {
    request(app)
      .post('/api/reflections')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Reflection.find().then((reflection) => {
          expect(reflection.length).toBe(2);
          done();
        }).catch((err) => done(err));
      });
  });
});

describe('Get /api/reflections', () => {
  it('should get all reflections', (done) => {
    request(app)
      .get('/api/reflections')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.reflections.length).toBe(1);
    })
      .end(done);
  });
});

describe('Get /api/reflections/:id', () => {
  it('should return reflection doc', (done) => {
    request(app)
      .get(`/api/reflections/${reflections[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.reflection.text).toBe(reflections[0].text);
      })
      .end(done);
  });

  it('should not return reflection doc created by other user', (done) => {
    request(app)
      .get(`/api/reflections/${reflections[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if reflection not found', (done) => {
    var id = new ObjectID();
    request(app)
      .get(`/api/reflections/${id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get('/api/reflections/123abc')
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /api/reflections/:id', () => {
  it('should remove a reflection', (done) => {
    var hexId = reflections[1]._id.toHexString()

    request(app)
      .delete(`/api/reflections/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Reflection.findById(hexId).then((reflection) => {
          expect(reflection).toNotExist();
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not remove a reflection created by another user', (done) => {
    var hexId = reflections[0]._id.toHexString()

    request(app)
      .delete(`/api/reflections/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Reflection.findById(hexId).then((reflection) => {
          expect(reflection).toExist();
          done();
        }).catch((err) => done(err));
      });
  });

  it('should return 404 if reflection not found', (done) => {
    var id = new ObjectID();
    request(app)
      .delete(`/api/reflections/${id.toHexString()}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should return 404 if ObjectID is invalid', (done) => {
    request(app)
      .delete('/api/reflections/123abc')
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /api/reflections/:id', () => {
  it('should update reflection', (done) => {
    var hexId = reflections[0]._id.toHexString()
    var body = {
      text: 'updated text',
    }
    request(app)
      .patch(`/api/reflections/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send(body)
      .expect(200)
      .expect((res) => {
        expect(res.body.reflection.text).toBe(body.text);
      })
      .end(done);
  });

  it('should not update reflection created by other user', (done) => {
    var hexId = reflections[0]._id.toHexString()
    var body = {
      text: 'updated text',
    }
    request(app)
      .patch(`/api/reflections/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send(body)
      .expect(404)
      .end(done);
  });
});

describe('GET /api/users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/api/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
      .get('/api/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
})

describe('POST /api/users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';

    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if (err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = 'example';
    var password = '123';

    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    var email = users[1].email;
    var password = '123qwe1';

    request(app)
      .post('/api/users')
      .send({email, password})
      .expect(400)
      .end(done);
  });
});

describe('POST /api/users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/api/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[1]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/api/users/login')
      .send({
        email: users[1].email,
        password: users[1].password + '1'
      })
      .expect(400)
      .expect((res) => {
        expect(res.headers['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      });
  });
});

describe('DELETE /api/users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/api/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      });
  });
});
