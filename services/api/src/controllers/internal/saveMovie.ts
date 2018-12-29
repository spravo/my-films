import { Request, Response } from 'express';
import Joi from 'joi';


import { ActionConnect } from '../baseAction';
import { IDatabasePoolConnection } from '../../utils/db';
import { IDictionary } from '../../utils/types';

export default class SaveMovieAction extends ActionConnect {
  protected validationSchema(): IDictionary<Joi.Schema> {
    return {
      body: Joi.object().keys({
        // TODO
      }).required(),
    };
  }

  public async run (connection: IDatabasePoolConnection, req: Request, res: Response): Promise<void> {
    // TODO
    res.jsonp({});
  }
}
