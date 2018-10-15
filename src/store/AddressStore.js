import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

class AddressStore {
  constructor() {
    this.address = {};
    this.addressTransactions = [];
    this.addressTransactionsCount = 0;
    this.addressTransactionAssets = [];
    this.addressTransactionAssetsCount = 0;
    this.loading = {
      address: false,
      addressTransactions: false,
      addressTransactionAssets: false,
    };
  }

  fetchAddressTransactionAssets(address, params = {}) {
    this.loading.addressTransactionAssets = true;
    return Service.addresses
      .findTransactionsAssets(address, params)
      .then(response => {
        runInAction(() => {
          this.addressTransactionAssets = response.data.items;
          this.addressTransactionAssetsCount = Number(response.data.total);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.addressTransactionAssets = false;
        });
      });
  }

  resetAddressTransactionAssets() {
    this.addressTransactionAssets = [];
    this.addressTransactionAssetsCount = 0;
  }

  fetchAddress(address) {
    if (address) {
      this.loading.address = true;

      return Service.addresses
        .findByAddress(address)
        .then(response => {
          runInAction(() => {
            this.address = response.data;
            this.loading.address = false;
          });
        })
        .catch(error => {
          runInAction(() => {
            this.loading.address = false;
            if (error.status === 404) {
              this.address = { status: 404 };
            }
          });
        });
    }
  }

  loadAddressTransactions(address, params = {}) {
    this.loading.addressTransactions = true;
    return Service.transactions
      .find(Object.assign({ address }, params))
      .then(response => {
        runInAction(() => {
          this.addressTransactions = response.data.items;
          this.addressTransactionsCount = Number(response.data.total);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.addressTransactions = false;
        });
      });
  }
}

decorate(AddressStore, {
  address: observable,
  addressTransactionAssets: observable,
  addressTransactionAssetsCount: observable,
  addressTransactions: observable,
  addressTransactionsCount: observable,
  loading: observable,
  fetchAddress: action,
  fetchAddressTransactionAssets: action,
  loadAddressTransactions: action,
  resetAddressTransactionAssets: action,
});

export default new AddressStore();