import { Container } from 'inversify';

import AppConfig, { IAppConfig } from '../config';
import types from './types';
import DatabaseConnector from 'core/utils/db';
import PassportGoogleOauth from 'core/services/auth/googleStrategy';
import PassportService from 'core/services/auth';
import registerActions from 'core/controllers';

import LoggerService from 'core/services/logger';
import ILoggerService from 'core/services/logger/interface';

const container = new Container();

container.bind<IAppConfig>(types.AppConfig).to(AppConfig);
container.bind(types.DatabaseConnector).to(DatabaseConnector);
container.bind(types.PassportGoogleService).to(PassportGoogleOauth);
container.bind(types.PassportService).to(PassportService);
container.bind<ILoggerService>(types.LoggerService).to(LoggerService);

registerActions(container);

export default container;

