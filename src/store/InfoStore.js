import { observable, decorate, action, runInAction, computed } from 'mobx';
import service from '../lib/Service';

export default class InfoStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
    this.chain = 'main';
    this.loading = {
      chain: false,
    };
  }

  get isTestnet() {
    return this.chain === 'test';
  }

  loadChain() {
    this.loading.chain = true;
    return service.infos
      .find()
      .then(response => {
        runInAction(() => {
          const chain = response.data.chain || 'main';
          this.chain = chain.endsWith('net') ? chain.substring(0, chain.length - 3) : chain;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.chain = 'main';
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.chain = false;
        });
      });
  }
}

decorate(InfoStore, {
  chain: observable,
  loading: observable,
  loadChain: action,
  isTestnet: computed,
});
