import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
import postgraphile from 'postgraphile';
import _ from 'lodash';

import iocContainer from './ioc/container';
import {IAppConfig} from './config';
import iocTypes from './ioc/types';
import {IDatabaseConnector} from './utils/db';
import PassportService, {IStrategy} from './services/auth';

export default class Worker {
  async init () {
    const appConfig = iocContainer.get<IAppConfig>(iocTypes.AppConfig);
    const dbConnector = iocContainer.get<IDatabaseConnector>(iocTypes.DatabaseConnector);
    const passportService = iocContainer.get<PassportService>(iocTypes.PassportService);

    if (appConfig.environment === 'development') {
      dotenv.config({ path: __dirname + '/.env.local' });
    }
    dbConnector.init({
      connectionString: `postgresql://${appConfig.postgressConnectionString}`,
      // workers + master
      max: Math.ceil(20 / (appConfig.workersCount + 1)),
    });

    passportService.init([
      iocContainer.get<IStrategy>(iocTypes.PassportGoogleService),
    ]);

    const app = express();

    app.use(session({
      secret: appConfig.sessionSecret,
      // genid: req => uuid.v4(),
      saveUninitialized: false,
      resave: false,
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(postgraphile(dbConnector.pool, 'public', {
      graphiql: appConfig.environment === 'development',
      watchPg: appConfig.environment === 'development',
      graphiqlRoute: '/graphiql',
      graphqlRoute: '/graphql',
      pgSettings: async (req: any)=> {
        return {
          'user.id': _.get(req, 'user.id'),
        };
      },
    }));

    // TODO: move to separate file
    app.get('/auth/google',
      passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
    app.get(appConfig.googleAuth.callbackURL,
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => res.redirect('/')
    );

    // http://127.0.0.1:3000/auth/google
    app.listen(3000, () => {
      console.info('http server available');
    });
  }
}
