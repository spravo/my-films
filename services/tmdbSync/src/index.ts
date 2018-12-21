import axios from 'axios';
import async from 'async';
import _ from 'lodash';

const apiKey = '###';

function extractHeader (headers: { [name: string]: string }) {
  return {
    limit: parseInt(headers['x-ratelimit-limit'], 10), // 40
    remaining: parseInt(headers['x-ratelimit-remaining'], 10),
    reset: parseInt(headers['x-ratelimit-reset'], 10) * 1000,
  };
}

async function getLast () {
  const url = `https://api.themoviedb.org/3/movie/latest?api_key=${apiKey}&language=en-US`;
  const { data, headers } = await axios(url);

  return { data, meta: extractHeader(headers) };
}

async function getMovieById<T = any> (id: number): Promise<{ meta: { limit: number, remaining: number, reset: number }, data: T }> {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`;
  const { data, headers, status } = await axios(url)
    .catch(e => {
      if (e.response.data.status_code === 34) {
        return {
          headers: e.response.headers,
          status: e.response.data.status_code,
          data: null,
        };
      }

      throw e;
    });

  return { data, meta: extractHeader(headers)};
}

function wait (time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function main () {
  // const stream = fs.createWriteStream('tmp.json', { flags: 'a+' });
  const { data: { id: lastMovieId }, meta: lastMeta } = await getLast();
  let _meta = lastMeta;


  const errors = [];
  const limit = 10;
  const q = [];
  for (let i = 1; i< lastMovieId; i++) {
    q.push({ id: i, retry: 0, meta: [] });
  }


  async.eachLimit(q, limit, async (job: { id: number, retry: number, meta: any[] }, callback: Function) => {
      try {
        if (_meta.remaining < limit) {
          const t = _meta.reset - Date.now() + 1000;
          await wait(t);
        }
        const { meta, data } = await getMovieById(job.id);

        if (meta.reset === _meta.reset && meta.remaining < _meta.remaining) {
          _meta = meta;
        }
        if (meta.reset > _meta.reset) {
          _meta = meta;
        }

        if (data) {
          console.log('done', job.id)
        } else {
          console.log('skip', job.id)
        }
      } catch (e) {
        console.error(e.response.data);
        if (job.retry < 3) {
          q.push({
            id: job.id,
            retry: job.retry + 1,
            meta: [ ...job.meta, { data: e.response.data, headers: e.response.headers } ]
          });
        } else {
          errors.push(job);
        }

      }
      callback();
    }
  );

  console.log('q created');

  // stream.write(']');
}

main();
