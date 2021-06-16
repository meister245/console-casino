import assert from "assert";
import { Server } from "http";
import request from "supertest";

import { app, state } from "../src/server/app";
import { dataInit, dataReset, dataSuspend, dataUpdate } from "./constants";

describe("Game suspend state workflow", () => {
  let server: Server;

  before((done) => {
    server = app.listen(3000, () => {
      state.gameState.active = true;
      state.gameState.betStrategy = "testStrategy";
      state.gameState.betSize = 0.1;
      state.gameState.tableName = "testTable";
      done();
    });
  });

  after((done) => {
    server.close(done);
  });

  it("game state is active", (done) => {
    request(app)
      .get("/state")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          active: true,
          suspended: false,
          betSize: 0.1,
          betStrategy: "testStrategy",
          tableName: "testTable",
          tables: [],
        });

        if (err) throw err;
        done();
      });
  });

  it("active game state can be suspended", (done) => {
    request(app)
      .post("/bet")
      .send(dataSuspend)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          state: {
            active: false,
            suspended: true,
            betSize: 0.2,
            betStrategy: "testStrategy",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("suspended game state can not be updated", (done) => {
    request(app)
      .post("/bet")
      .send(dataUpdate)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: false,
          state: {
            active: false,
            suspended: true,
            betSize: 0.2,
            betStrategy: "testStrategy",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("suspended game state can not be suspended", (done) => {
    request(app)
      .post("/bet")
      .send(dataSuspend)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: false,
          state: {
            active: false,
            suspended: true,
            betSize: 0.2,
            betStrategy: "testStrategy",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("suspended game state can not be reset", (done) => {
    request(app)
      .post("/bet")
      .send(dataReset)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: false,
          state: {
            active: false,
            suspended: true,
            betSize: 0.2,
            betStrategy: "testStrategy",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("suspended game state can be resumed", (done) => {
    request(app)
      .post("/bet")
      .send(dataInit)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          state: {
            active: true,
            suspended: true,
            betSize: 0.2,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("resumed game state can be updated", (done) => {
    request(app)
      .post("/bet")
      .send({ ...dataUpdate, betSize: 0.4 })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          state: {
            active: true,
            suspended: true,
            betSize: 0.4,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("resumed game state can be reset", (done) => {
    request(app)
      .post("/bet")
      .send(dataReset)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          state: {
            active: false,
            suspended: false,
          },
        });

        if (err) throw err;
        done();
      });
  });
});
