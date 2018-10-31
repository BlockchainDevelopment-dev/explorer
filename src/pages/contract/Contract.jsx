import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect, Link } from 'react-router-dom';
import Highlight from 'react-highlight';
import contractStore from '../../store/ContractStore';
import addressStore from '../../store/AddressStore';
import uiStore from '../../store/UIStore';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import AssetsBalancesTable from '../../components/AssetsBalancesTable';
import PageTitle from '../../components/PageTitle';
import ItemsTable from '../../components/ItemsTable';
import Page from '../../components/Page';
import { Tabs, TabHead, TabBody, Tab, TabPanel } from '../../components/tabs';
import './Contract.css';

class ContractPage extends Component {
  componentDidMount() {
    this.setAddress(this.addressProp);
  }

  componentDidUpdate(prevProps) {
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (this.addressProp !== prevParams.address) {
      this.setAddress(this.addressProp);
    }
  }

  setAddress(address) {
    contractStore.loadContract(address);
    addressStore.fetchAddress(address);
  }

  get addressProp() {
    return RouterUtils.getRouteParams(this.props).address;
  }

  render() {
    const is404 = addressStore.address.status === 404;

    return (
      <Page className="Contract">
        <section>
          <PageTitle
            title="Contract"
            subtitle={<HashLink hash={this.addressProp} truncate={false} copy={true} />}
          />
          {is404 ? <ItemNotFound item="Contract" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </Page>
    );
  }

  renderTopTables() {
    if (contractStore.loading.contract || addressStore.loading.address) {
      return <Loading />;
    }
    const contract = contractStore.contract;
    const address = addressStore.address;
    return (
      <div className="row">
        <div className="col-lg-6">
          <table className="table table-zen">
            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  SUMMARY
                </th>
              </tr>
            </thead>
            <tbody>
              {contract.expiryBlock ? (
                <tr>
                  <td>ACTIVE UNTIL</td>
                  <td>Block {contract.expiryBlock}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="2">INACTIVE</td>
                </tr>
              )}
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(address.totalTxs)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          <AssetsBalancesTable balance={address.balance} />
        </div>
      </div>
    );
  }

  renderTabs() {
    const currentPath = this.props.match.path;
    return (
      <Tabs>
        <TabHead>
          <Tab id="txns">TRANSACTIONS</Tab>
          <Tab id="commands">COMMANDS</Tab>
          <Tab id="code">CONTRACT CODE</Tab>
          <Tab id="assets">ASSET ISSUED</Tab>
        </TabHead>
        <TabBody>
          <Switch>
            <Route path={`${currentPath}/txns`} component={TransactionsTabReactive} />
            <Route path={`${currentPath}/commands`} component={CommandsTab} />
            <Route path={`${currentPath}/code`} component={CodeTab} />
            <Route path={`${currentPath}/assets`} component={AssetsTabReactive} />
            <Redirect from={`${currentPath}`} to={`${currentPath}/txns`} />
          </Switch>
        </TabBody>
      </Tabs>
    );
  }
}

const TransactionsTab = observer(props => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'TX HASH',
            accessor: 'hash',
            Cell: data => <HashLink url={`/tx/${data.value}`} hash={data.value} />,
          },
          {
            Header: 'Timestamp',
            accessor: 'Block.timestamp',
            Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
          },
          {
            Header: 'Block',
            accessor: 'Block.blockNumber',
            Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
          },
          {
            Header: 'First Command',
            accessor: 'firstCommand',
          },
        ]}
        loading={addressStore.loading.addressTransactions}
        itemsCount={addressStore.addressTransactionsCount}
        items={addressStore.addressTransactions}
        pageSize={uiStore.addressTxsTable.pageSize}
        curPage={uiStore.addressTxsTable.curPage}
        tableDataSetter={uiStore.setAddressTxsTableData.bind(uiStore)}
      />
    </TabPanel>
  );
});
const TransactionsTabReactive = observer(
  WithSetAddressOnUiStore(TransactionsTab, 'setAddressTxsTableData')
);

function CommandsTab(props) {
  return <TabPanel>commands</TabPanel>;
}

function CodeTab() {
  if (contractStore.loading.contract) {
    return <Loading />;
  }
  return (
    <TabPanel>
      <Highlight className="fsharp">{contractStore.contract.code}</Highlight>
    </TabPanel>
  );
}

const AssetsTab = observer(props => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'ASSET',
            accessor: 'asset',
            Cell: data => <HashLink hash={data.value} />,
          },
          {
            Header: 'TOKENS OUTSTANDING',
            accessor: 'outstanding',
            Cell: data => TextUtils.formatNumber(data.value),
          },
          {
            Header: 'TOTAL ISSUED',
            accessor: 'issued',
            Cell: data => TextUtils.formatNumber(data.value),
          },
          {
            Header: 'TOKENS DESTROYED',
            accessor: 'destroyed',
            Cell: data => TextUtils.formatNumber(data.value),
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
const AssetsTabReactive = observer(
  WithSetAddressOnUiStore(AssetsTab, 'setContractAssetsTableData')
);

function WithSetAddressOnUiStore(WrappedComponent, uiStoreFunctionName) {
  return class HOC extends Component {
    componentDidMount() {
      this.setAddress();
    }

    componentDidUpdate(prevProps) {
      const prevParams = RouterUtils.getRouteParams(prevProps);
      if (this.addressProp !== prevParams.address) {
        this.setAddress();
      }
    }

    get addressProp() {
      return RouterUtils.getRouteParams(this.props).address;
    }

    setAddress() {
      uiStore[uiStoreFunctionName]({ address: this.addressProp });
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

export default observer(ContractPage);
