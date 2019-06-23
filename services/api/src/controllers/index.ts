import path from 'path';
import { Container } from 'inversify';

import config from './register.json';
import { BaseAction } from 'core/controllers/baseAction';

interface IControllerConfig {
  path: string;
  name: string;
}

export default function (container: Container) {
  config.forEach((ctrlInfo: IControllerConfig) => {
    const Action = require(path.join(__dirname, ctrlInfo.path)).default;

    container.bind<BaseAction>(Symbol.for(ctrlInfo.name)).to(Action);
  })
}
