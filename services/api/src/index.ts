import 'reflect-metadata';
import cluster from 'cluster';

import Master from './master';
import Worker from './worker';


if (cluster.isMaster) {
  const master = new Master();
  master.init();
}

if (cluster.isWorker) {
  const worker = new Worker();
  worker.init();
}

