import bodyParser from 'body-parser';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import postgraphile from 'postgraphile';
import dotenv from 'dotenv';

import DBConnector from './utils/db';
import PassportService from './services/auth';
import PassportGoogleService from './services/auth/googleStrategy';
import AppConfig from './config';



async function main () {
  const appConfig = new AppConfig();

  if (appConfig.environment === 'development') {
    dotenv.config({ path: __dirname + '/.env.local' });
  }
  DBConnector.init({ connectionString: `postgresql://${appConfig.postgressConnectionString}` });

  const dbConnector = new DBConnector();
  const passportService = new PassportService(dbConnector);

  passportService.init([
    new PassportGoogleService(dbConnector, appConfig),
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
