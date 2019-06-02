import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Route, Switch, Redirect } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import { getVoteStatus, voteStatus } from '../governance/voteStatus';
import InfoBox from '../../components/InfoBox';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import CgpTab from './components/tabs/Cgp.jsx';
import MiningTab from './components/tabs/Mining.jsx';
import RouterUtils from '../../lib/RouterUtils';
import ItemNotFound from '../../components/ItemNotFound';
import Loading from '../../components/Loading';
import Dropdown from '../../components/Dropdown';
import AddressLink from '../../components/AddressLink';
import displayMiningResult from './utils/displayMiningResult';
import './cgp.scss';

class CgpPage extends React.Component {
  constructor(props) {
    super(props);

    this.handleIntervalChange = this.handleIntervalChange.bind(this);
  }
  get cgpStore() {
    return this.props.rootStore.cgpStore;
  }
  get currentBlock() {
    return this.props.rootStore.blockStore.blocksCount;
  }
  get intervalRouteParam() {
    const interval = RouterUtils.getRouteParams(this.props).interval;
    return !isNaN(interval) ? interval : '_';
  }
  get relevantLoaded() {
    return this.cgpStore.relevantInterval.interval !== undefined;
  }
  get noIntervalsFound() {
    return this.cgpStore.relevantInterval.status === 404;
  }
  get voteStatus() {
    // in cgp there is no "before" state
    return getVoteStatus({
      currentBlock: this.currentBlock,
      beginHeight: this.cgpStore.relevantInterval.beginHeight,
      endHeight: this.cgpStore.relevantInterval.endHeight,
    });
  }

  /**
   * redirect to the requested interval
   * is called when selecting an interval in the dropdown
   */
  handleIntervalChange(data) {
    const toInterval = data.value;
    if (toInterval !== this.intervalRouteParam) {
      this.props.history.push({
        pathname: getPageUrl(toInterval),
      });
    }
  }

  componentDidMount() {
    if (!this.cgpStore.relevantInterval.interval) {
      this.loadRelevantInterval();
    }

    // load once only
    if (!this.cgpStore.recentIntervals.length) {
      this.cgpStore.loadRecentIntervals();
    }
  }

  componentDidUpdate(prevProps) {
    const curInterval = RouterUtils.getRouteParams(this.props).interval;
    const prevInterval = RouterUtils.getRouteParams(prevProps).interval;
    const storeInterval = String(this.cgpStore.relevantInterval.interval);
    if (curInterval !== prevInterval && storeInterval !== curInterval) {
      this.loadRelevantInterval();
    }
  }

  loadRelevantInterval() {
    this.cgpStore.loadRelevantInterval(this.intervalRouteParam);
  }

  render() {
    const redirectToRelevantInterval = this.getRedirectForEmptyInterval();
    if (redirectToRelevantInterval) return redirectToRelevantInterval;

    return (
      <Page className="Cgp">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Mining Allocation | CGP')}</title>
        </Helmet>

        <div className="row">
          <div className="col-md-8">
            <PageTitle title="Mining allocation and common goods pool" />
          </div>
          <div className="col-md-4">
            <IntervalsDropDown
              relevantInterval={this.cgpStore.relevantInterval}
              intervals={this.cgpStore.recentIntervals}
              onIntervalChange={this.handleIntervalChange}
            />
          </div>
        </div>

        {this.noIntervalsFound && (
          <section>
            <ItemNotFound item="interval" />
          </section>
        )}

        {this.renderTopData()}
        {this.renderSummary()}
        {this.renderTabs()}
      </Page>
    );
  }

  renderTopData() {
    const relevantInterval = this.cgpStore.relevantInterval;
    if (this.cgpStore.loading.interval) return <Loading />;
    if (!this.relevantLoaded) return null;

    return (
      <div>
        <section>
          {this.voteStatus === voteStatus.during && (
            <DuringVoteInfo {...relevantInterval} currentBlock={this.currentBlock} />
          )}
          {this.voteStatus === voteStatus.after && <AfterVoteInfo {...relevantInterval} />}
        </section>
      </div>
    );
  }

  renderSummary() {
    const relevantInterval = this.cgpStore.relevantInterval;
    if (!this.relevantLoaded) return null;

    return (
      <div>
        <section>
          <SummaryTable {...relevantInterval} />
        </section>
      </div>
    );
  }

  renderTabs() {
    if (!this.relevantLoaded) return null;
    return (
      <section>
        <VotingTabs {...this.props} isIntermediate={this.voteStatus === voteStatus.during} />
      </section>
    );
  }

  /**
   * redirect to current interval if already loaded and interval is '_'
   */
  getRedirectForEmptyInterval() {
    const routeInterval = this.intervalRouteParam;
    if (routeInterval === '_' && this.relevantLoaded) {
      const interval = this.cgpStore.relevantInterval.interval;
      return <Redirect to={getPageUrl(interval)} />;
    }
    return null;
  }
}

function DuringVoteInfo({ currentBlock, endHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={TextUtils.formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally Block"
          content={TextUtils.formatNumber(endHeight + 1)}
          iconClass="fal fa-money-check fa-fw"
        />
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  endHeight: PropTypes.number,
};

function AfterVoteInfo({ resultAllocation, resultPayoutRecipient, resultPayoutAmount, endHeight }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Mining Allocation / CGP"
          content={displayMiningResult(resultAllocation)}
          iconClass="fal fa-money-check fa-fw"
        />
        <InfoBox
          title="Result of vote conducted at"
          content={TextUtils.formatNumber(endHeight + 1)}
          iconClass="fal fa-cube fa-fw"
        />
      </div>
      {resultPayoutRecipient && (
        <div className="row">
          <div className="col border border-dark text-center after-tally-message">
            CGP Winner: <AddressLink address={resultPayoutRecipient} hash={resultPayoutRecipient} />
            <br />
            Requested amount: {AssetUtils.getAmountString('00', resultPayoutAmount)}
          </div>
        </div>
      )}
    </div>
  );
}
AfterVoteInfo.propTypes = {
  resultAllocation: PropTypes.number,
  resultPayoutRecipient: PropTypes.string,
  resultPayoutAmount: PropTypes.string,
  beginHeight: PropTypes.number,
  endHeight: PropTypes.number,
};

function SummaryTable({
  fund,
  totalZpAllocation,
  totalZpPayout,
  resultAllocation,
  resultPayoutAmount,
  resultPayoutRecipient,
  status,
}) {
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col" colSpan="2">
            SUMMARY
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>FUNDS IN THE CGP</td>
          <td>{AssetUtils.getAmountString('00', fund)}</td>
        </tr>
        <tr>
          <td>#ZP PARTICIPATED IN CGP</td>
          <td>{AssetUtils.getAmountString('00', totalZpPayout)}</td>
        </tr>
        <tr>
          <td>#ZP PARTICIPATED IN MINING ALLOCATION</td>
          <td>{AssetUtils.getAmountString('00', totalZpAllocation)}</td>
        </tr>
        {status === 'open' && (
          <>
            <tr>
              <td>PREVIOUS MINING ALLOCATION</td>
              <td>{displayMiningResult(resultAllocation)}</td>
            </tr>
            <tr>
              <td>PREVIOUS CGP DISTRIBUTION</td>
              {resultPayoutRecipient ? (
                <td>
                  {AssetUtils.getAmountString('00', resultPayoutAmount)} to{' '}
                  <AddressLink address={resultPayoutRecipient} hash={resultPayoutRecipient} />
                </td>
              ) : (
                <td>None</td>
              )}
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
SummaryTable.propTypes = {
  resultAllocation: PropTypes.number,
  resultPayoutRecipient: PropTypes.string,
  resultPayoutAmount: PropTypes.string,
  fund: PropTypes.string,
  totalZpAllocation: PropTypes.number,
  totalZpPayout: PropTypes.number,
  status: PropTypes.string,
};

function VotingTabs({ match, isIntermediate }) {
  const currentPath = match.path;
  return (
    <Tabs>
      <TabHead>
        <Tab id="mining">{isIntermediate && 'INTERMEDIATE '}MINING RESULTS</Tab>
        <Tab id="cgp">{isIntermediate && 'INTERMEDIATE '}CGP RESULTS</Tab>
      </TabHead>
      <TabBody>
        <Switch>
          <Route path={`${currentPath}/mining`} component={MiningTab} />
          <Route path={`${currentPath}/cgp`} component={CgpTab} />
          <Redirect from={`${currentPath}`} to={`${currentPath}/mining`} />
        </Switch>
      </TabBody>
    </Tabs>
  );
}
VotingTabs.propTypes = {
  match: PropTypes.any,
  isIntermediate: PropTypes.bool,
};

function IntervalsDropDown({ relevantInterval, intervals, onIntervalChange }) {
  if (!(relevantInterval || {}).interval) return null;

  const options = intervals.map(item => ({
    value: String(item.interval),
    label:
      item.status === 'open'
        ? 'Current votes for next tally'
        : `Tally block: ${TextUtils.formatNumber(item.endHeight + 1)}`,
  }));
  return (
    <Dropdown
      options={options}
      value={String(relevantInterval.interval)}
      onChange={onIntervalChange}
    />
  );
}
IntervalsDropDown.propTypes = {
  relevantInterval: PropTypes.object,
  intervals: PropTypes.array.isRequired,
  onIntervalChange: PropTypes.func,
};

function getPageUrl(interval) {
  return `/cgp/${interval}`;
}

export default inject('rootStore')(observer(CgpPage));
