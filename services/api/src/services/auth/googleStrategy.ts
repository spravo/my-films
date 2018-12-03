import { OAuth2Strategy as GoogleStrategy, Profile } from 'passport-google-oauth';
import { Strategy } from 'passport';
import { inject, injectable } from 'inversify';

import { IDatabaseConnector, IDatabasePoolConnection } from '../../utils/db';
import { IAppConfig } from '../../config';
import { IStrategy } from './index';
import { iocTypes } from '../../ioc';

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
      let user: any|undefined = await this.dbConnector.runQueryOne(
        connection,
        'select * from my_films_private.person_account where googleid = $1',
        [ profile.id ]
      );

      if (user) {
        done(null, user);
      } else {
        user = await this.dbConnector.runQueryOne(
          connection,
          'select (my_films_private.register_person($1, $2)).id',
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
