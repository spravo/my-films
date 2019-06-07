import debug from 'debug';
import { injectable } from '../../ioc';
import ILoggerService from './interface';

@injectable()
export default class LoggerService implements ILoggerService {
  private readonly _debugger = debug('app');

  public info = console.info;
  public debug = this._debugger;

  public error (...args: any[]) {
    // TODO: add external service for capture error as sentry.io
    console.error(args);
  };

  public createNamespaceDebug (name: string) {
    return debug('app:' + name);
  }
}
