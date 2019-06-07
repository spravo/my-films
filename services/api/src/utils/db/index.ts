import pg from 'pg';
import { injectable } from '../../ioc';
import ExtendedError from '../error';

export interface IDatabasePoolConnection {
  query: Function;
  release: Function;
}

export interface IDatabaseConnector {
  getConnection(): Promise<IDatabasePoolConnection>;
  runQuery<T = any>(connection: IDatabasePoolConnection, sql: string, values?: any[]): Promise<T[]>;
  runQueryOne<T =any>(connection: IDatabasePoolConnection, sql: string, values?: any[]): Promise<T>;
  release(connection: IDatabasePoolConnection): void;
  pool: any;
  init(config: any): void;
}

@injectable()
export default class DatabaseConnector implements IDatabaseConnector {
  private static pool: pg.Pool;

  init (config: pg.PoolConfig) {
    if (DatabaseConnector.pool) {
      throw new ExtendedError({
        message: 'DB pool already exists',
        critical: true,
      });
    }

    DatabaseConnector.pool = new pg.Pool(config);
  }

  get pool () {
    return DatabaseConnector.pool;
  }

  async getConnection (): Promise<IDatabasePoolConnection> {
    if (!DatabaseConnector.pool) {
      throw new ExtendedError({
        message: 'DB pool does\'t exist',
        critical: true,
      });
    }

    return DatabaseConnector.pool.connect();
  }

  release (connection: IDatabasePoolConnection) {
    connection.release();
  }

  async runQuery<T = any>(connection: IDatabasePoolConnection, sql: string, values?: any[]): Promise<T[]> {
    if (!DatabaseConnector.pool) {
      throw new ExtendedError({
        message: 'DB pool does\'t exist',
        critical: true,
      });
    }

    const { rows } = await connection.query(sql, values || []);
    return rows;
  }

  async runQueryOne<T = any>(connection: IDatabasePoolConnection, sql: string, values?: any[]): Promise<T> {
    const rows = await this.runQuery<T>(connection, sql, values);
    return rows[0];
  }
}
