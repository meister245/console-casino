import assert from "assert";
import { Server } from "http";
import sinon from "sinon";
import request from "supertest";

import { app, state, strategies, utils } from "../src/server/app";
import { RouletteBet } from "./../src/types";
import { dataInit, dataReset, dataSuspend, dataUpdate } from "./constants";

describe("Game suspend state workflow", () => {
  const sandbox = sinon.createSandbox();

  let server: Server;

  before((done) => {
    sandbox.stub(utils, "writeGameBet");
    sandbox.stub(utils, "writeGameState");
    sandbox.stub(utils, "writeGameStats");

    strategies["testStrategy"] = {
      limits: {},
      trigger: {},
      progressionMultiplier: 2,
      bets: [RouletteBet.RED],
    };

    server = app.listen(3000, () => {
      state.active = true;
      state.betStrategy = "testStrategy";
      state.betSize = 0.1;
      state.tableName = "testTable";
      done();
    });
  });

  after((done) => {
    sandbox.restore();
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
          running: true,
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
            running: true,
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
            running: true,
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
            running: true,
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
            running: true,
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
            running: true,
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
            running: true,
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
            running: true,
            suspended: false,
          },
        });

        if (err) throw err;
        done();
      });
  });
});
