import React, { Component } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import AddressLink from '../../../../components/AddressLink';

class CgpTab extends Component {
  componentDidMount() {
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        this.props.rootStore.uiStore.setCgpPayoutTableData({ force: true });
      }
    );
  }
  stopReload() {
    this.forceDisposer();
  }
  render() {
    const uiStore = this.props.rootStore.uiStore;
    const cgpStore = this.props.rootStore.cgpStore;
    return (
      <TabPanel>
        <ItemsTable
          columns={[
            {
              Header: 'Proposal Address',
              accessor: 'recipient',
              Cell: ({value}) => <AddressLink address={value} hash={value} />,
            },
            {
              Header: 'Requested Amount',
              accessor: 'amount',
              Cell: ({value}) => AssetUtils.getAmountString('00', value),
            },
            {
              Header: 'Total ZP votes for this  proposal',
              accessor: 'zpCount',
              Cell: ({value}) => AssetUtils.getAmountString('00', value),
            },
          ]}
          loading={cgpStore.loading.payout}
          itemsCount={cgpStore.payoutCount}
          items={cgpStore.payout}
          pageSize={uiStore.state.cgpPayoutTable.pageSize}
          curPage={uiStore.state.cgpPayoutTable.curPage}
          tableDataSetter={uiStore.setCgpPayoutTableData.bind(uiStore)}
          // topContent={<div>Total votes: {cgpStore.payoutCount}</div>}
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(WithSetIdOnUiStore(observer(CgpTab), 'setCgpPayoutTableData', 'interval'))
);
