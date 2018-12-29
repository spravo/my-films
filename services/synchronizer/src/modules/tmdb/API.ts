import axios from 'axios';

interface IAPIMeta {
  remaining: number;
  reset: number;
}

type IAPIEntities = 'movie';

export default class API {
  private readonly API_KEY: string;
  private readonly API_HOST = 'https://api.themoviedb.org';

  constructor (options: { apiKey: string }) {
    this.API_KEY = options.apiKey;
  }

  extractHeader (headers: { [name: string]: string }): IAPIMeta {
    return {
      remaining: parseInt(headers['x-ratelimit-remaining'], 10),
      reset: parseInt(headers['x-ratelimit-reset'], 10) * 1000, // convert from unix timestamp
    };
  }

  async getLastEntity<T = any> (entity: IAPIEntities): Promise<{ data: T, meta: IAPIMeta}> {
    const url = `${this.API_HOST}/3/${entity}/latest?api_key=${this.API_KEY}&language=en-US`;
    const { data, headers } = await axios(url);

    return { data, meta: this.extractHeader(headers), };
  }

  async getEntityById<T = any> (entity: IAPIEntities, id: number): Promise<{ data: T, meta: IAPIMeta }> {
    const url = `${this.API_HOST}/3/${entity}/${id}?api_key=${this.API_KEY}&language=en-US`;
    const { data, headers } = await axios(url)
      .catch(e => {
        if (e.response.data.status_code === 34) {
          return {
            headers: e.response.headers,
            data: null,
          };
        }
        throw e;
      });

    return { data, meta: this.extractHeader(headers), };
  }
}
