import React from 'react';
import { observer } from 'mobx-react';
import contractStore from '../../../../store/ContractStore';
import uiStore from '../../../../store/UIStore';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import AssetUtils from '../../../../lib/AssetUtils';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const AssetsTab = observer(() => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'ASSET',
            accessor: 'asset',
            minWidth: config.ui.table.minCellWidth,
            Cell: ({ value }) => (
              <HashLink
                hash={AssetUtils.getAssetNameFromCode(value)}
                value={value}
                url={`/assets/${value}`}
              />
            ),
          },
          {
            Header: 'TOKENS OUTSTANDING',
            accessor: 'outstanding',
            Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
          },
          {
            Header: 'TOTAL ISSUED',
            accessor: 'issued',
            Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
          },
          {
            Header: 'TOKENS DESTROYED',
            accessor: 'destroyed',
            Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
          },
          {
            Header: 'UNIQUE KEYHOLDERS',
            accessor: 'keyholders',
            Cell: data => TextUtils.formatNumber(data.value),
          },
        ]}
        loading={contractStore.loading.assets}
        itemsCount={contractStore.assetsCount}
        items={contractStore.assets}
        pageSize={uiStore.contractAssetsTable.pageSize}
        curPage={uiStore.contractAssetsTable.curPage}
        tableDataSetter={uiStore.setContractAssetsTableData.bind(uiStore)}
      />
    </TabPanel>
  );
});
export default observer(WithSetIdOnUiStore(AssetsTab, 'setContractAssetsTableData', 'address'));
