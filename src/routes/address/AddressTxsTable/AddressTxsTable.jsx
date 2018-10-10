import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import uiStore from '../../../store/UIStore';
import AssetUtils from '../../../lib/AssetUtils';
import TextUtils from '../../../lib/TextUtils';
import blockStore from '../../../store/BlockStore';
import HashLink from '../../../components/HashLink';
import ItemsTable from '../../../components/ItemsTable';
import TransactionAssetLoader from '../../../components/Transactions/Asset/TransactionAssetLoader.jsx';

class AddressTxsTable extends Component {
  getTableColumns() {
    return [
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
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: data => {
          return <Link to={`/blocks/${data.value}`}>{data.value}</Link>;
        },
      },
      {
        Header: 'TX',
        accessor: 'txHash',
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
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
        Header: 'Amount',
        accessor: 'totalSum',
        Cell: data => {
          const isNegative = Number(data.value) < 0;
          return (
            <span className={isNegative ? 'negative' : 'positive'}>
              {AssetUtils.getAmountString(data.original.asset, Number(data.value))}
            </span>
          );
        },
      },
    ];
  }
  render() {
    const address = this.props.address;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={['blockHash', 'isCoinbaseTx']}
        loading={blockStore.loading.addressTransactionAssets}
        itemsCount={blockStore.addressTransactionAssetsCount}
        items={blockStore.addressTransactionAssets}
        pageSize={uiStore.addressTxAssetsTable.pageSize}
        curPage={uiStore.addressTxAssetsTable.curPage}
        tableDataSetter={uiStore.setAddressTxAssetsTableData.bind(uiStore)}
        title="Transactions"
        SubComponent={row => {
          const addressFoundIn = [];
          if (address) {
            Number(row.original.outputSum) !== 0 && addressFoundIn.push('output');
            Number(row.original.inputSum) !== 0 && addressFoundIn.push('input');
          }
          return (
            <TransactionAssetLoader
              transactionAssets={blockStore.addressTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
              total={Number(row.original.totalSum)}
              address={address}
              addressFoundIn={addressFoundIn}
            />
          );
        }}
      />
    );
  }
}

AddressTxsTable.propTypes = {
  address: PropTypes.string,
};

export default observer(AddressTxsTable);