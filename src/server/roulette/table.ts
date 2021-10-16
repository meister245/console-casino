import { RouletteConfig } from "./types";

type TableLease = {
  [tableName: string]: number;
};

type AssignedTable = {
  tableName: string;
  leaseTime: number;
};

class RouletteTable {
  private tableLease: TableLease;
  private tableNames: string[];

  constructor(config: RouletteConfig) {
    this.tableLease = {};
    this.tableNames = config.tableNames.slice();
  }

  getTables(): string[] {
    return this.tableNames.slice();
  }

  getLease(): TableLease {
    return { ...this.tableLease };
  }

  checkLease(): void {
    const time = Math.floor(Date.now() / 1000);

    for (const tableName of Object.keys(this.tableLease)) {
      if (this.tableLease[tableName] < time) {
        this.releaseTable(tableName);
      }
    }
  }

  extendLease(tableName: string): number {
    if (Object.keys(this.tableLease).includes(tableName)) {
      this.tableLease[tableName] += 60 * 10;
    }

    return this.tableLease[tableName];
  }

  assignTable(): AssignedTable | undefined {
    this.checkLease();

    const leaseTime = Math.floor(Date.now() / 1000) + 60 * 15;

    for (const tableName of this.tableNames) {
      if (!Object.keys(this.tableLease).includes(tableName)) {
        this.tableLease[tableName] = leaseTime;
        return { tableName, leaseTime };
      }
    }
  }

  releaseTable(tableName: string): void {
    if (Object.keys(this.tableLease).includes(tableName)) {
      delete this.tableLease[tableName];
    }
  }
}

export default RouletteTable;
