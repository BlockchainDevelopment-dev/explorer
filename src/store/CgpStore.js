import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

export default class CgpStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.relevantInterval = initialState.relevantInterval || {};
    this.allocation = initialState.allocation || [];
    this.allocationCount = initialState.allocationCount || 0;
    this.payout = initialState.payout || [];
    this.payoutCount = initialState.payoutCount || 0;
    this.recentIntervals = initialState.recentIntervals || [];
    this.loading = {
      relevantInterval: false,
      allocation: false,
      payout: false,
      recentIntervals: false,
    };
  }

  loadRelevantInterval(interval = '_', params = {}) {
    this.loading.relevantInterval = true;

    return Service.cgp
      .findCurrent(interval, params)
      .then(({ data }) => {
        runInAction(() => {
          this.relevantInterval = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.relevantInterval = {};
          if (error.status === 404) {
            this.relevantInterval.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.relevantInterval = false;
        });
      });
  }

  loadAllocation(interval = '_', params = {}) {
    this.loading.allocation = true;

    return Service.cgp
      .findAllAllocation(interval, params)
      .then(({ data }) => {
        runInAction(() => {
          this.allocation = data.items;
          this.allocationCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.allocation = [];
          this.allocationCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.allocation = false;
        });
      });
  }

  loadPayout(interval = '_', params = {}) {
    this.loading.payout = true;

    return Service.cgp
      .findAllPayout(interval, params)
      .then(({ data }) => {
        runInAction(() => {
          this.payout = data.items;
          this.payoutCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.payout = [];
          this.payoutCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.payout = false;
        });
      });
  }

  loadRecentIntervals(params = {}) {
    this.loading.recentIntervals = true;

    return Service.cgp
      .findRecentIntervals(params)
      .then(({ data }) => {
        runInAction(() => {
          this.recentIntervals = data;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.recentIntervals = [];
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.recentIntervals = false;
        });
      });
  }
}

decorate(CgpStore, {
  relevantInterval: observable,
  allocation: observable,
  allocationCount: observable,
  payout: observable,
  payoutCount: observable,
  recentIntervals: observable,
  loading: observable,
  loadRelevantInterval: action,
  loadAllocation: action,
  loadPayout: action,
  loadRecentIntervals: action,
});
