import createNamespaceDebug from 'debug';

import TmdbAPI from './modules/tmdb/API';
import Queue from './utils/queue';
import { StoreFS } from './utils/store';

const debug = createNamespaceDebug('app:index');

async function main () {
  const tmdbAPI = new TmdbAPI({ apiKey: process.env.TMDB_API_KEY_V3 as string });
  const storeFS = new StoreFS();
  const queue = new Queue<number>({
    jobHandler: async payload => {
      return tmdbAPI.getEntityById('movie', payload);
    }
  });

  queue.emitter.on(queue.emitterDescriptor.jobSuccess, async (jobId: string, result: { mata: any, data: any }) => {
    if (result.data) {
      debug('data', jobId);
      await storeFS.saveEntity(result.data);
    }
  });

  queue.emitter.on(queue.emitterDescriptor.queueEnd, () => {
    storeFS.destroy();
  });

  const { data: { id: lastMovieId }} = await tmdbAPI.getLastEntity('movie');
  for (let i = 1; i < lastMovieId; i++) {
    queue.addJob(i);
  }

  queue.start();
}

main();
