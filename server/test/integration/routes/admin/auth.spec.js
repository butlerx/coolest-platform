// TODO fix parallel tests
const { setup, cleanup } = require('../../../setup-db');
const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('integration: auth', () => {
  let refToken;
  let refAuth;
  before(async () => {
    await setup();
    refAuth = (await db.raw('SELECT auth.* FROM auth JOIN "public".user u ON u.id = auth.user_id WHERE u.email = \'hello@coolestprojects.org\'')).rows[0];
    refToken = refAuth.token;
  });

  describe('/token ', () => {
    it('should return 204 on valid admin token', async () => {
      const payload = { token: refToken };
      await request(app)
        .post('/api/v1/admin/auth/token')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(204);
    });

    it('should return 401 on invalid token', async () => {
      // we create a falsy token
      const payload = { token: jwt.sign({ data: 'muhHaxxor' }, 'MuhSecret', { expiresIn: '8h' }) };
      await request(app)
        .post('/api/v1/admin/auth/token')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(401);
    });

    it('should return 401 on basic token', async () => {
      const token = await util.user.create('ad@me.in');
      const payload = { token };
      await request(app)
        .post('/api/v1/admin/auth/token')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(401);
    });
  });
  describe('/', () => {
    it('should return 200 on valid admin creds', async () => {
      const payload = { email: 'hello@coolestprojects.org', password: 'banana' };
      await request(app)
        .post('/api/v1/admin/auth')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(200)
        .then((res) => {
          expect(res.body.userId).to.equal(refAuth.user_id);
          // Scrap the password
          expect(res.body.password).to.be.undefined;
          // Regen the token
          expect(res.body.token).to.not.equal(refAuth.token);
        });
    });
    it('should return 401 on invalid admin password', async () => {
      const payload = { email: 'hello@coolestprojects.org', password: 'bananaX' };
      await request(app)
        .post('/api/v1/admin/auth')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(401);
    });
    it('should return 401 on invalid admin email', async () => {
      const payload = { email: 'herro@coolestprojects.org', password: 'bananaX' };
      await request(app)
        .post('/api/v1/admin/auth')
        .set('Accept', 'application/json')
        .send(payload)
        .expect(401);
    });
  });
  after(cleanup);
});
