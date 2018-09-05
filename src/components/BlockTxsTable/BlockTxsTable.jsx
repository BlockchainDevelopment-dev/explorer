import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import HashLink from '../HashLink/HashLink';
import ItemsTable from '../ItemsTable/ItemsTable';
import TransactionAssetLoader from '../Transactions/Asset/TransactionAssetLoader';

class BlockTxsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Hash',
        accessor: 'txHash',
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
      {
        Header: 'Asset',
        accessor: 'asset',
        Cell: function(data) {
          return <HashLink hash={AssetUtils.getAssetNameFromCode(data.value)} value={data.value} />;
        },
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: '',
        accessor: 'isCoinbaseTx',
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
      {
        Header: 'Total',
        accessor: 'outputSum',
        Cell: data => AssetUtils.getAmountString(data.original.asset, Number(data.value)),
      },
    ];
  }
  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={[]}
        loading={blockStore.loading.blockTransactionAssets}
        itemsCount={blockStore.blockTransactionAssetsCount}
        items={blockStore.blockTransactionAssets}
        pageSize={uiStore.blockTxTable.pageSize}
        curPage={uiStore.blockTxTable.curPage}
        tableDataSetter={uiStore.setBlockTxTableData.bind(uiStore)}
        title="Transactions"
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactionAssets={blockStore.blockTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
              total={Number(row.original.outputSum)}
            />
          );
        }}
      />
    );
  }
}

export default observer(BlockTxsTable);
