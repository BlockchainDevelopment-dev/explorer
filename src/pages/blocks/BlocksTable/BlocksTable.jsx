import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import TextUtils from '../../../lib/TextUtils';
import uiStore from '../../../store/UIStore';
import blockStore from '../../../store/BlockStore';
import config from '../../../lib/Config';
import BlockUtils from '../../../lib/BlockUtils';
import ItemsTable from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';

class BlocksTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: config.ui.table.minCellWidth,
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        Cell: function(data) {
          return BlockUtils.formatDifficulty(data.value);
        },
      },
      {
        Header: 'Txs',
        accessor: 'transactionCount',
      },
    ];
  }

  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={['parent', 'difficulty']}
        loading={blockStore.loading.blocks}
        itemsCount={blockStore.blocksCount}
        items={blockStore.blocks}
        pageSize={uiStore.blocksTable.pageSize}
        curPage={uiStore.blocksTable.curPage}
        tableDataSetter={uiStore.setBlocksTableData.bind(uiStore)}
        topContent={<PageTitle title="Blocks" margin={false} />}
      />
    );
  }
}

export default observer(BlocksTable);
