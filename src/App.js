import React, { Component } from 'react';
import Service from './lib/Service';
import blockStore from './store/BlockStore';
import MainRoutes from './MainRoutes.jsx';
import Page from './components/Page/Page.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.fetchSyncingTimeout = this.fetchSyncingTimeout.bind(this);
  }

  componentDidMount() {
    this.fetchBlocksCount();
    blockStore.fetchMedianTime();
    this.fetchSyncingTimeout();
  }

  componentWillUnmount() {
    clearInterval(this.syncingTimer);
  }

  fetchBlocksCount() {
    Service.blocks.find({ pageSize: 1 }).then(response => {
      if (response.data.total !== blockStore.blocksCount) {
        blockStore.setBlocksCount(Number(response.data.total));
      }
    });
  }


  fetchSyncingTimeout() {
    blockStore.fetchSyncing().then(() => {
      this.syncingTimer = setTimeout(this.fetchSyncingTimeout, 60000);
    });
  }

  render() {
    return (
      <div className="App">
        <div className="navbar-container">
          <div className="container">
            <Navbar />
          </div>
        </div>
        <div className="App-separator mb-3 mb-lg-8" />
        <div className="body-container">
          <div className="container">
            <Page>
              <MainRoutes />
            </Page>
          </div>
        </div>
        <div className="footer-container">
          <div className="container">
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
