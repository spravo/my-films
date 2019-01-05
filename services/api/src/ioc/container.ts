import { Container } from 'inversify';

import AppConfig, { IAppConfig } from '../config';
import types from './types';
import DatabaseConnector from '../utils/db';
import PassportGoogleOauth from '../services/auth/googleStrategy';
import PassportService from '../services/auth';
import registerActions from '../controllers';

const container = new Container();

container.bind<IAppConfig>(types.AppConfig).to(AppConfig);
container.bind(types.DatabaseConnector).to(DatabaseConnector);
container.bind(types.PassportGoogleService).to(PassportGoogleOauth);
container.bind(types.PassportService).to(PassportService);

registerActions(container);

export default container;

