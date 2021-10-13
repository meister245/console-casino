import assert from "assert";
import { Server } from "http";
import sinon from "sinon";
import request from "supertest";

import { fileLogger as logger } from "../../src/server/common/logger";
import { app, config, strategies, utils } from "../../src/server/roulette/app";
import {
  betStrategyLowTriggerHighPercent,
  testChipSize,
  testTableName,
} from "../constants";

describe("Roulette server requests", () => {
  const testNumbers = [2, 12, 21, 23, 12, 5, 7];

  const sandbox = sinon.createSandbox();

  let server: Server;

  before((done) => {
    sandbox.stub(logger);
    sandbox.stub(utils, "writeFile");

    strategies["testStrategy"] = { ...betStrategyLowTriggerHighPercent };

    server = app.listen(3000, () => {
      done();
    });
  });

  after((done) => {
    sandbox.restore();
    server.close(done);
  });

  it("game state is empty", (done) => {
    request(app)
      .get("/state")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {});

        if (err) throw err;
        done();
      });
  });

  it("game state can be setup", (done) => {
    request(app)
      .post("/state/setup")
      .send({
        tableName: testTableName,
        numbers: testNumbers,
        chipSize: testChipSize,
      })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, { success: true });

        if (err) throw err;
        done();
      });
  });

  it("game state can be updated", (done) => {
    request(app)
      .post("/state/update")
      .send({
        tableName: testTableName,
        number: 21,
        balance: 999,
      })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, { success: true });

        if (err) throw err;
        done();
      });
  });

  it("game state bet processing failed, no strategy matched", (done) => {
    request(app)
      .post("/state/bet")
      .send({
        tableName: testTableName,
        bets: { red: 0.25 },
      })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, { success: false });

        if (err) throw err;
        done();
      });
  });

  it("table names can be retrieved", (done) => {
    request(app)
      .get("/table")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, config.tableNames);

        if (err) throw err;
        done();
      });
  });

  it("table can be assigned", (done) => {
    const assignedTableName = config.tableNames[0];

    request(app)
      .post("/table/assign/")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
          tableName: assignedTableName,
          lobbyUrl: config.lobbyUrl,
          dryRun: config.dryRun,
        });

        if (err) throw err;
      });

    const expectedTableNames = config.tableNames.slice(1);

    request(app)
      .get("/table")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, expectedTableNames);

        if (err) throw err;
      });

    done();
  });

  it("table can be released", (done) => {
    const releasedTableName = config.tableNames[0];

    request(app)
      .delete("/table/release/")
      .send({
        tableName: releasedTableName,
      })
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, {
          success: true,
        });

        if (err) throw err;
      });

    const expectedTableNames = [
      ...config.tableNames.slice(1),
      releasedTableName,
    ];

    request(app)
      .get("/table")
      .expect("Content-Type", /json/)
      .end((err, res) => {
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(res.body, expectedTableNames);

        if (err) throw err;
      });

    done();
  });
});
