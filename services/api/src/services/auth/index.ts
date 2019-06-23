import passport from 'passport';

import { IDatabaseConnector, IDatabasePoolConnection } from 'core/utils/db';
import { iocTypes, inject, injectable } from 'core/ioc';

export interface IStrategy {
  strategy: passport.Strategy;
}

@injectable()
export default class PassportService {
  dbConnector: IDatabaseConnector;

  constructor (
    @inject(iocTypes.DatabaseConnector) dbConnector: IDatabaseConnector
  ) {
    this.dbConnector = dbConnector;
  }

  init (strategies: IStrategy[]) {
    passport.deserializeUser(this.deserializeUser.bind(this));
    passport.serializeUser(this.serializeUser.bind(this));

    strategies.forEach(s => passport.use(s.strategy));
  }

  private async deserializeUser (id: number, done: Function) {
    let connection: IDatabasePoolConnection|undefined;
    try {
      connection = await this.dbConnector.getConnection();
      // TODO: move to a repository file
      const user = await this.dbConnector.runQueryOne(
        connection,
        // language=SQL
        'SELECT person.* FROM public.person as person WHERE person.id = $1',
        [ id ]
      );

      done(null, user);
    } catch (e) {
      done(e);
    } finally {
      if (connection) {
        this.dbConnector.release(connection);
      }
    }
  }

  private serializeUser (user: any, done: Function) {
    done(null, user.id || user.person_id);
  }
}
