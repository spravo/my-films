import { OAuth2Strategy as GoogleStrategy, Profile } from 'passport-google-oauth';
import { Strategy } from 'passport';

import { IDatabaseConnector, IDatabasePoolConnection } from 'core/utils/db';
import { IAppConfig } from 'core/config';
import { IStrategy } from './index';
import { iocTypes, inject, injectable } from 'core/ioc';

@injectable()
export default class PassportGoogleOauth implements IStrategy {
  dbConnector: IDatabaseConnector;
  config: IAppConfig;
  strategy: Strategy;

  constructor (
    @inject(iocTypes.AppConfig) config: IAppConfig,
    @inject(iocTypes.DatabaseConnector) dbConnector: IDatabaseConnector
  ) {
    this.dbConnector = dbConnector;
    this.config = config;
    this.strategy = new GoogleStrategy({ ...this.config.googleAuth, }, this.verifyCallback.bind(this));
  }

  private async verifyCallback (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) {
    let connection: IDatabasePoolConnection|undefined;
    try {
      connection = await this.dbConnector.getConnection();
      // TODO: move to a repository file
      let user: { person_id?: number, id?: number }|undefined = await this.dbConnector.runQueryOne(
        connection,
        // language=SQL
        `select person_account.person_id from private.person_account as person_account where person_account.googleid = $1`,
        [ profile.id ]
      );

      if (user) {
        done(null, user);
      } else {
        // TODO: move to a repository file
        user = await this.dbConnector.runQueryOne(
          connection,
          // language=SQL
          'select person.id from private.register_person($1, $2) as person',
          [ profile.id, profile.displayName ]
        );

        done(null, user);
      }

    } catch (e) {
      done(e);
    } finally {
      if (connection) {
        this.dbConnector.release(connection);
      }
    }
  }
}
