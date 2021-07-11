import assert from "assert";
import { Server } from "http";
import sinon from "sinon";
import request from "supertest";

import { app, strategies, utils } from "../src/server/app";
import { RouletteBet } from "./../src/types";
import { dataInit, dataReset, dataSuspend, dataUpdate } from "./constants";

describe("Game state workflow", () => {
  const sandbox = sinon.createSandbox();

  let server: Server;

  before((done) => {
    sandbox.stub(utils, "writeGameBet");
    sandbox.stub(utils, "writeGameState");
    sandbox.stub(utils, "writeGameStats");

    strategies["testStrategy"] = {
      limits: {},
      trigger: {},
      progression: [1, 2, 4, 8, 16, 32, 64, 128],
      bets: [RouletteBet.RED],
    };

    server = app.listen(3000, () => {
      done();
    });
  });

  after((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("default game state is inactive", (done) => {
    request(app)
      .get("/state")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          active: false,
          running: true,
          suspended: false,
          tables: [],
        });

        if (err) throw err;
        done();
      });
  });

  it("inactive game state cannot be reset", (done) => {
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
            suspended: false,
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("inactive game state cannot be updated", (done) => {
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
            suspended: false,
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("inactive game state cannot be suspended", (done) => {
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
            suspended: false,
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("inactive game state can be initialized", (done) => {
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
            suspended: false,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("active game state cannot be initialized", (done) => {
    request(app)
      .post("/bet")
      .send(dataInit)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: false,
          state: {
            active: true,
            running: true,
            suspended: false,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("active game state can be updated by active table", (done) => {
    request(app)
      .post("/bet")
      .send(dataUpdate)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          state: {
            active: true,
            running: true,
            suspended: false,
            betSize: 0.1,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("active game state cannot be updated by other table", (done) => {
    request(app)
      .post("/bet")
      .send({ ...dataUpdate, tableName: "otherTable", betSize: 0.2 })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.deepStrictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: false,
          state: {
            active: true,
            running: true,
            suspended: false,
            betSize: 0.1,
            betStrategy: "testStrategy",
            tableName: "testTable",
          },
        });

        if (err) throw err;
        done();
      });
  });

  it("active game state can be reset", (done) => {
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
