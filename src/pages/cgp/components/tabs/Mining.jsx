import React, { Component } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import displayMiningResult from '../../utils/displayMiningResult';


class MiningTab extends Component {
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
        this.props.rootStore.uiStore.setCgpAllocationTableData({ force: true });
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
              Header: 'MR - CGP',
              accessor: 'amount',
              Cell: ({value}) => displayMiningResult(value),
            },
            {
              Header: 'Total Zp',
              accessor: 'zpCount',
              Cell: ({value}) => AssetUtils.getAmountString('00', value),
            },
          ]}
          loading={cgpStore.loading.allocation}
          itemsCount={cgpStore.allocationCount}
          items={cgpStore.allocation}
          pageSize={uiStore.state.cgpAllocationTable.pageSize}
          curPage={uiStore.state.cgpAllocationTable.curPage}
          tableDataSetter={uiStore.setCgpAllocationTableData.bind(uiStore)}
          // topContent={<div>Total votes: {cgpStore.allocationCount}</div>}
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(WithSetIdOnUiStore(observer(MiningTab), 'setCgpAllocationTableData', 'interval'))
);
