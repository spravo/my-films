import 'reflect-metadata';
import bodyParser from 'body-parser';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import postgraphile from 'postgraphile';
import dotenv from 'dotenv';

import { IDatabaseConnector } from './utils/db';
import PassportService, { IStrategy } from './services/auth';
import { IAppConfig } from './config';
import { iocTypes, iocContainer } from './ioc';

async function main () {
  const appConfig = iocContainer.get<IAppConfig>(iocTypes.AppConfig);
  const dbConnector = iocContainer.get<IDatabaseConnector>(iocTypes.DatabaseConnector);
  const passportService = iocContainer.get<PassportService>(iocTypes.PassportService);

  if (appConfig.environment === 'development') {
    dotenv.config({ path: __dirname + '/.env.local' });
  }
  dbConnector.init({ connectionString: `postgresql://${appConfig.postgressConnectionString}` });

  passportService.init([
    iocContainer.get<IStrategy>(iocTypes.PassportGoogleService),
  ]);

  const app = express();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'Your shark is awesome, because i can\'t find my monkey',
    // genid: req => uuid.v4(),
    saveUninitialized: false,
    resave: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(bodyParser.urlencoded({ extended: true }));

  // app.use(postgraphile(dbConnector.pool, 'my_films'));

  // TODO: move to separate file
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
  app.get(appConfig.googleAuth.callbackURL,
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
  );

  // http://127.0.0.1:3000/auth/google
  app.listen(3000, () => {
    const separator = '---------';
    console.info(separator, 'server started', separator);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
