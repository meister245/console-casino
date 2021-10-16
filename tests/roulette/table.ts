import assert from "assert";

import { config } from "../../src/server/roulette/app";
import RouletteTable from "../../src/server/roulette/table";

describe("Roulette table lease", () => {
  it("no active lease", (done) => {
    const table = new RouletteTable(config);

    assert.deepStrictEqual(table.getLease(), {});

    done();
  });

  it("table can be leased", (done) => {
    const table = new RouletteTable(config);

    const availableTables = table.getTables();
    const assignedTable = table.assignTable();
    const currentTime = Math.floor(Date.now() / 1000) + 60 * 10;

    assert.deepStrictEqual(assignedTable.tableName, availableTables[0]);

    assert(!isNaN(assignedTable.leaseTime));
    assert(assignedTable.leaseTime > currentTime);

    const leases = table.getLease();

    assert.deepStrictEqual(Object.keys(leases).length, 1);

    assert.deepStrictEqual(
      leases[assignedTable.tableName],
      assignedTable.leaseTime
    );

    done();
  });

  it("lease can be extended", (done) => {
    const table = new RouletteTable(config);

    const { tableName, leaseTime } = table.assignTable();
    const leases = table.getLease();

    assert.deepStrictEqual(leases[tableName], leaseTime);

    table.extendLease(tableName);
    const leasesUpdated = table.getLease();

    assert(leasesUpdated[tableName] !== leaseTime);
    assert(leases[tableName] < leasesUpdated[tableName]);

    done();
  });

  it("lease can be released", (done) => {
    const table = new RouletteTable(config);

    const { tableName } = table.assignTable();
    const leases = table.getLease();

    assert.deepStrictEqual(Object.keys(leases).length, 1);

    table.releaseTable(tableName);
    const leasesUpdated = table.getLease();

    assert.deepStrictEqual(Object.keys(leasesUpdated).length, 0);

    done();
  });
});
