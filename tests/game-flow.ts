import assert from 'assert'
import request from 'supertest'
import { Server } from 'http';

import { app } from '../src/server/app'
import { dataInit, dataUpdate, dataSuspend, dataReset } from './constants'

describe('Game state workflow', () => {
  let server: Server

  before((done) => {
    server = app.listen(3000, () => {
      done()
    })
  })

  after((done) => {
    server.close(done)
  })

  it('default game state is inactive', (done) => {
    request(app)
      .get('/state')
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          active: false,
          suspended: false
        })

        if (err) throw err
        done()
      })
  })

  it('inactive game state cannot be reset', (done) => {
    request(app)
      .post('/bet')
      .send(dataReset)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: false,
          serverState: {
            active: false,
            suspended: false
          }
        })

        if (err) throw err
        done()
      })
  })

  it('inactive game state cannot be updated', (done) => {
    request(app)
      .post('/bet')
      .send(dataUpdate)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: false,
          serverState: {
            active: false,
            suspended: false
          }
        })

        if (err) throw err
        done()
      })
  })

  it('inactive game state cannot be suspended', (done) => {
    request(app)
      .post('/bet')
      .send(dataSuspend)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: false,
          serverState: {
            active: false,
            suspended: false
          }
        })

        if (err) throw err
        done()
      })
  })

  it('inactive game state can be initialized', (done) => {
    request(app)
      .post('/bet')
      .send(dataInit)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: true,
          serverState: {
            active: true,
            suspended: false,
            betStrategy: 'testStrategy',
            tableName: 'testTable'
          }
        })

        if (err) throw err
        done()
      })
  })

  it('active game state cannot be initialized', (done) => {
    request(app)
      .post('/bet')
      .send(dataInit)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: false,
          serverState: {
            active: true,
            suspended: false,
            betStrategy: 'testStrategy',
            tableName: 'testTable'
          }
        })

        if (err) throw err
        done()
      })
  })

  it('active game state can be updated by active table', (done) => {
    request(app)
      .post('/bet')
      .send(dataUpdate)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: true,
          serverState: {
            active: true,
            suspended: false,
            betSize: 0.1,
            betStrategy: 'testStrategy',
            tableName: 'testTable'
          }
        })

        if (err) throw err
        done()
      })
  })

  it('active game state cannot be updated by other table', (done) => {
    request(app)
      .post('/bet')
      .send({ ...dataUpdate, tableName: 'otherTable', betSize: 0.2 })
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: false,
          serverState: {
            active: true,
            suspended: false,
            betSize: 0.1,
            betStrategy: 'testStrategy',
            tableName: 'testTable'
          }
        })

        if (err) throw err
        done()
      })
  })

  it('active game state can be reset', (done) => {
    request(app)
      .post('/bet')
      .send(dataReset)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200)
        assert.deepStrictEqual(res.body, {
          success: true,
          serverState: {
            active: false,
            suspended: false
          }
        })

        if (err) throw err
        done()
      })
  })
})
