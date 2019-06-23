import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import _ from 'lodash';

import { IDictionary } from 'core/utils/types';
import { IDatabaseConnector, IDatabasePoolConnection } from 'core/utils/db';
import { iocTypes, inject, injectable } from 'core/ioc';

export abstract class BaseAction {
  protected async validation (req: Request, schemas: IDictionary<Joi.Schema>): Promise<void> {
    const validations = _.keys(schemas)
      .map(async key => {
        const values = await Joi.validate(_.get(req, key), schemas[key].label(key));
        Object.keys(values).forEach(valueKey => _.set(req, [ key, valueKey ], values[valueKey] ));
        return values;
      });

    if (!validations.length) {
      return;
    }
    await Promise.all(validations);
  }

  protected validationSchema (): IDictionary<Joi.Schema> {
    return {
      query: Joi.object().keys({
        // limit: Joi.number().integer().positive(),
        // offset: Joi.number().integer().min(0),
        // etc
      }).unknown(),
    };
  }

  /**
   * @description should attach method to router
   * @example route.httpMethod('/path', action.runAction());
   */
  public abstract runAction (): (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export abstract class Action extends BaseAction {
  public abstract run (req: Request, res: Response): Promise<void>;

  public runAction () {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.validation(req, this.validationSchema());
        await this.run(req, res);
      } catch (e) {
        next(e);
      }
    }
  }
}

@injectable()
export abstract class ActionConnect extends BaseAction {
  private readonly databaseConnector: IDatabaseConnector;

  constructor (
    @inject(iocTypes.DatabaseConnector) databaseConnector: IDatabaseConnector,
  ) {
    super();
    this.databaseConnector = databaseConnector;
  }

  public abstract run (connection: IDatabasePoolConnection, req: Request, res: Response): Promise<void>;

  public runAction () {
    return async (req: Request, res: Response, next: NextFunction) => {
      let connection: IDatabasePoolConnection|undefined;
      try {
        await this.validation(req, this.validationSchema());
        connection = await this.databaseConnector.getConnection();
        await this.run(connection, req, res);
      } catch (e) {
        next(e);
      } finally {
        if (connection) {
          this.databaseConnector.release(connection);
        }
      }
    }
  }
}
