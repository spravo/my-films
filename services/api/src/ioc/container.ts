import { Container } from 'inversify';

import AppConfig, { IAppConfig } from '../config';
import types from './types';
import DatabaseConnector from '../utils/db';
import PassportGoogleOauth from '../services/auth/googleStrategy';
import PassportService from '../services/auth';
import registerActions from '../controllers';

import LoggerService from '../services/logger';
import ILoggerService from '../services/logger/interface';

const container = new Container();

container.bind<IAppConfig>(types.AppConfig).to(AppConfig);
container.bind(types.DatabaseConnector).to(DatabaseConnector);
container.bind(types.PassportGoogleService).to(PassportGoogleOauth);
container.bind(types.PassportService).to(PassportService);
container.bind<ILoggerService>(types.LoggerService).to(LoggerService);

registerActions(container);

export default container;

