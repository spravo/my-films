interface IExtendedErrorConfig {
  message?: string;
  critical?: boolean;
  code?: string;
  originalError?: Error;
}

export default class ExtendedError extends Error {
  readonly critical: boolean;
  readonly code: string;
  readonly originalError?: Error;

  constructor (config: IExtendedErrorConfig = {}) {
    super(config.message);
    this.critical = config.critical || false;
    this.code = config.code || 'internal_error';
    this.originalError = config.originalError
  }
}

