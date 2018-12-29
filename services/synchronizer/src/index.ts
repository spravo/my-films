import createNamespaceDebug from 'debug';

import TmdbAPI from './modules/tmdb/API';
import Queue from './utils/queue';

const debug = createNamespaceDebug('app:index');

async function main () {
  const tmdbAPI = new TmdbAPI({ apiKey: process.env.TMDB_API_KEY_V3 as string });
  const queue = new Queue<number>({
    jobHandler: async payload => {
      return tmdbAPI.getEntityById('movie', payload);
    }
  });

  queue.emitter.on(queue.emitterDescriptor.jobWait, (jobId: string, wait: number) => {
    debug('wait', jobId, wait);
  });
  queue.emitter.on(queue.emitterDescriptor.jobSuccess, (jobId: string, data: any) => {
    if (data) {
      debug('data', jobId);
    } else {
      debug('skip', jobId);
    }
  });

  const { data: { id: lastMovieId }} = await tmdbAPI.getLastEntity('movie');
  for (let i = 1; i < lastMovieId; i++) {
    queue.addJob(i);
  }

  queue.start();
}

main();
