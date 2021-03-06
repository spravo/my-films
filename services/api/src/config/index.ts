import { injectable } from 'core/ioc';
import os from 'os';

export interface IAppConfig {
  postgressConnectionString: string;
  environment: string;
  googleAuth: IGoogleAuthConfig;
  appHost: string;
  workersCount: number;
  sessionSecret: string;
}

interface IGoogleAuthConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

@injectable()
export default class AppConfig implements Readonly<IAppConfig> {
  readonly sessionSecret: string = process.env.SESSION_SECRET || 'Your shark is awesome, because i can\'t find my monkey';
  readonly environment: string = process.env.NODE_ENV || 'development';
  readonly workersCount: number;

  get googleAuth (): IGoogleAuthConfig {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
    return {
      clientID: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
      callbackURL: GOOGLE_CALLBACK_URL || '/auth/google/callback',
    };
  }

 get postgressConnectionString () {
    const {
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_HOST,
      POSTGRES_PORT = 5432,
      POSTGRES_DB,
    } = process.env;
    // user:password@host:port/db
    return `${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;
  }

  get appHost (): string {
    const { APP_HOST = '127.0.0.1', APP_PROTOCOL = 'http', APP_PORT = 3000 } = process.env;
    return `${APP_PROTOCOL}://${APP_HOST}:${APP_PORT}`;
  }

  constructor () {
    this.workersCount = this.environment === 'development'
      ? 1
      : os.cpus().length;
  }
}
