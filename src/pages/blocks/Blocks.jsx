import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject } from 'mobx-react';
import Service from '../../lib/Service.js';
import BlocksTable from './BlocksTable';
import Page from '../../components/Page';

class BlocksPage extends Component {
  constructor(props) {
    super(props);

    this.fetchBlocksCount = this.fetchBlocksCount.bind(this);
  }
  componentDidMount() {
    this.fetchBlocksCount();
  }

  componentWillUnmount() {
    clearInterval(this.blocksTimer);
  }

  fetchBlocksCount() {
    const { blockStore } = this.props.rootStore;
    Service.blocks.count().then(response => {
      if (Number(response.data) !== blockStore.blocksCount) {
        blockStore.setBlocksCount(Number(response.data));
      }
      this.blocksTimer = setTimeout(this.fetchBlocksCount, 30000);
    });
  }

  render() {
    return (
      <Page className="Blocks">
        <section>
          <BlocksTable title="LATEST BLOCKS" />
        </section>
      </Page>
    );
  }
}

BlocksPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(BlocksPage);
