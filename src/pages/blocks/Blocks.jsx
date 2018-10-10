import React, { Component } from 'react';
import blockStore from '../../store/BlockStore';
import Service from '../../lib/Service.js';
import BlocksTable from './BlocksTable';
import Page from '../../components/Page';

class BlocksPage extends Component {
  constructor(props) {
    super(props);

    this.fetchBlocksCount = this.fetchBlocksCount.bind(this);
  }
  componentDidMount() {
    this.fetchBlocksCount(); // MUST HAVE THE BLOCK COUNT FIRST, FOR INNER PAGES TOO!
  }

  componentWillUnmount() {
    clearInterval(this.blocksTimer);
  }

  fetchBlocksCount() {
    Service.blocks.find({ pageSize: 1 }).then(response => {
      if (response.data.total !== blockStore.blocksCount) {
        blockStore.setBlocksCount(Number(response.data.total));
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

export default BlocksPage;
