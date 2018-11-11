import { observable, decorate, action, runInAction, computed } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';

class BlockStore {
  constructor() {
    this.blocks = [];
    this.blocksCount = 0;
    this.block = {};
    this.blockTransactionAssets = [];
    this.blockTransactionAssetsCount = 0;
    this.medianTime = null;

    this.loading = {
      blocks: false,
      block: false,
      blockTransactionAssets: false,
    };
  }

  setBlocksCount(count) {
    this.blocksCount = count;
  }

  fetchBlocks(params = { pageSize: 10, page: 0 }) {
    this.loading.blocks = true;

    return Service.blocks
      .find(params)
      .then(response => {
        runInAction(() => {
          this.blocks = response.data.items;
          this.blocksCount = response.data.total;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blocks = false;
        });
      });
  }

  fetchBlock(id) {
    this.loading.block = true;

    return Service.blocks
      .findById(id)
      .then(response => {
        runInAction(() => {
          this.block = response.data;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.block = false;
        });
        return this.block;
      });
  }

  fetchBlockTransactionAssets(blockNumber, params = {}) {
    this.loading.blockTransactionAssets = true;
    return Service.blocks
      .findTransactionsAssets(blockNumber, params)
      .then(response => {
        runInAction(() => {
          this.blockTransactionAssets = response.data.items;
          this.blockTransactionAssetsCount = Number(response.data.total);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blockTransactionAssets = false;
        });
      });
  }

  resetBlockTransactionAssets() {
    this.blockTransactionAssets = [];
    this.blockTransactionAssetsCount = 0;
  }

  fetchMedianTime() {
    return Service.infos.findByName('medianTime').then(response => {
      runInAction(() => {
        if (response.success) {
          this.medianTime = new Date(Number(response.data.value));
        }
      });// TODO handle error
    });
  }

  get medianTimeString() {
    if (this.medianTime) {
      return TextUtils.getDateString(this.medianTime);
    }
    return null;
  }

  get numberOfTransactions() {
    if (this.block.Transactions) {
      return this.block.Transactions.length;
    }
  }

  confirmations(blockNumber) {
    if (!blockNumber) {
      return 0;
    }

    return Math.max(0, Number(this.blocksCount) - Number(blockNumber) + 1);
  }
}

decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  block: observable,
  blockTransactionAssets: observable,
  blockTransactionAssetsCount: observable,
  loading: observable,
  medianTime: observable,
  medianTimeString: computed,
  numberOfTransactions: computed,
  setBlocksCount: action,
  fetchBlocks: action,
  fetchBlock: action,
  fetchBlockTransactionAssets: action,
  fetchMedianTime: action,
  resetBlockTransactionAssets: action,
});

export default new BlockStore();
