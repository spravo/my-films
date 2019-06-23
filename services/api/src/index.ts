import 'reflect-metadata';
import cluster from 'cluster';

if (cluster.isMaster) {
  const Master = require('./master');
  const master = new Master();
  master.init();
}

if (cluster.isWorker) {
  const Worker = require('./worker');
  const worker = new Worker();
  worker.init();
}

