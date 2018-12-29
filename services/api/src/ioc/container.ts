import { Container } from 'inversify';

import AppConfig, { IAppConfig } from '../config';
import types from './types';
import DatabaseConnector from '../utils/db';
import PassportGoogleOauth from '../services/auth/googleStrategy';
import PassportService from '../services/auth';

import { BaseAction } from '../controllers/baseAction';
import SaveMovieAction from '../controllers/internal/saveMovie';

const container = new Container();

container.bind<IAppConfig>(types.AppConfig).to(AppConfig);
container.bind(types.DatabaseConnector).to(DatabaseConnector);
container.bind(types.PassportGoogleService).to(PassportGoogleOauth);
container.bind(types.PassportService).to(PassportService);

// actions
container.bind<BaseAction>(types.SaveMovieAction).to(SaveMovieAction);

export default container;

