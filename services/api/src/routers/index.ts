import { Router, Application } from 'express';
import _ from 'lodash';
import passport from 'passport';

import config from './config.json';
import { iocContainer, iocTypes } from 'core/ioc';
import { BaseAction } from 'core/controllers/baseAction';
import { IAppConfig } from 'core/config';

type IRouteMethod = 'post'|'get'|'put'|'delete'|'patch'|'head';

interface IControllerConfig {
  httpPath: string;
  middleware?: Array<any>;
}

interface IRouteConfig extends IControllerConfig {
  httpMethod: string;
  controllerName: string;
}

interface IGroupConfig extends IControllerConfig {
  controllers: Array<IRouteConfig|IGroupConfig>;
}

function isCorrectMethod (method: string): method is IRouteMethod {
  return _.includes([ 'post', 'get', 'put', 'delete', 'patch', 'head' ], method);
}

function isGroupConfig (config: IRouteConfig|IGroupConfig): config is IGroupConfig {
  return _.isArray((config as IGroupConfig).controllers);
}

function isRouteConfig (config: IRouteConfig|IGroupConfig): config is IRouteConfig {
  return _.isString((config as IRouteConfig).httpMethod) && _.isString((config as IRouteConfig).controllerName);
}

function registerRoute (router: Router, routeConfig: IRouteConfig) {
  if (!isCorrectMethod(routeConfig.httpMethod)) {
    throw new Error(`"${routeConfig.httpMethod}" isn't correct the http method`);
  }
  const method: IRouteMethod = routeConfig.httpMethod;
  const action = iocContainer.get<BaseAction>(Symbol.for(routeConfig.controllerName)).runAction();

  // TODO: middleware for single ctrl
  router[method](routeConfig.httpPath, action);
}

function registerGroupRoutes (router: Router, group: IGroupConfig) {
  const groupRoute = Router({ mergeParams: true, caseSensitive: true });
  group.controllers.forEach(ctrl => {
    if (isGroupConfig(ctrl)) {
      return registerGroupRoutes(groupRoute, ctrl);
    }

    if (isRouteConfig(ctrl)) {
      return registerRoute(groupRoute, ctrl);
    }

    throw new Error('Can\'t detect type section config');
  });

  // TODO: middleware for group
  router.use(group.httpPath, groupRoute);
}

export default function register (app: Application) {
  const appConfig = iocContainer.get<IAppConfig>(iocTypes.AppConfig);

  app.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
  app.get(appConfig.googleAuth.callbackURL,
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
  );

  config.map(group => registerGroupRoutes(app, group));
}
