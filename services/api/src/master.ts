import cluster from 'cluster';
import _ from 'lodash';

import { IAppConfig } from './config';
import { iocTypes, iocContainer } from './ioc';

export default class Master {
  config: IAppConfig;
  workers: cluster.Worker[];

  constructor () {
    this.config = iocContainer.get(iocTypes.AppConfig);
    this.workers = [];
  }

  createWorker () {
    const worker = cluster.fork();
    this.workers.push(worker);
  }

  private onMessageHandler = (messager: any) => {
    // TODO:
    console.log('worker message:', messager);
  };

  init () {
    console.log('Master cluster setting up');
    for (let i = 0; i < this.config.workersCount; i++) {
      this.createWorker();
    }

    cluster.on('online', worker => {
      console.log('Worker ' + worker.process.pid + ' is online');
      worker.on('message',  this.onMessageHandler);
    });

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
      console.log('Starting a new worker');

      this.workers = _.remove(this.workers, { id: worker.id });
      this.createWorker();
    });
  }
}
