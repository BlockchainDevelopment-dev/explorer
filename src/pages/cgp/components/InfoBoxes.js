import React from 'react';
import PropTypes from 'prop-types';

import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import InfoBox from '../../../components/InfoBox';
import getPhaseBlocks from '../modules/getPhaseBlocks';
import getPhaseName from '../modules/getPhaseName';

const { truncateHash, formatNumber } = TextUtils;

function CgpBalanceInfoBox({ cgpBalance, isAtSnapshot = false } = {}) {
  const zpBalance = cgpBalance.find(item => AssetUtils.isZP(item.asset)) || {
    asset: '00',
    amount: '0',
  };
  const allAssetsString = cgpBalance.reduce((all, cur) => {
    const currentAsset = truncateHash(AssetUtils.getAssetNameFromCode(cur.asset));
    const currentDisplay = `${currentAsset}: ${AssetUtils.getAmountString(cur.asset, cur.amount)}`;
    return !all ? currentDisplay : `${all}\n${currentDisplay}`;
  }, '');
  return (
    <InfoBox
      title={isAtSnapshot ? 'Funds in CGP at snapshot block' : 'Current funds in CGP'}
      content={
        <div title={allAssetsString}>
          {AssetUtils.getAmountString(zpBalance.asset, zpBalance.amount)}
        </div>
      }
      iconClass="fal fa-coins fa-fw"
    />
  );
}
CgpBalanceInfoBox.propTypes = {
  cgpBalance: PropTypes.array,
  isAtSnapshot: PropTypes.bool,
};
CgpBalanceInfoBox.defaultProps = {
  cgpBalance: [],
};

export function BeforeVoteInfo({ currentBlock, snapshot, tally, phase, ...props }) {
  const phaseBlocks = getPhaseBlocks({ phase, snapshot, tally });
  const blocksToStart = phaseBlocks.snapshot - currentBlock;
  const phaseName = getPhaseName(phase);
  const voteBeginsMessage =
    blocksToStart > 0
      ? `${phaseName} phase begins in ${formatNumber(blocksToStart)} ${
          blocksToStart > 1 ? 'blocks' : 'block'
        }`
      : `${phaseName} phase begins now`;

  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title={phase === 'Nomination' ? 'Snapshot block' : 'Voting block'}
          content={formatNumber(phaseBlocks.snapshot)}
          iconClass="fal fa-cubes fa-fw"
        />
        <CgpBalanceInfoBox {...props} isAtSnapshot={false} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center before-snapshot-message">
          {voteBeginsMessage}
        </div>
      </div>
    </div>
  );
}
BeforeVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  phase: PropTypes.string,
};

export function DuringVoteInfo({ currentBlock, snapshot, tally, phase, ...props }) {
  const phaseBlocks = getPhaseBlocks({ phase, snapshot, tally });
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Current Block"
          content={formatNumber(currentBlock)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title={phase === 'Nomination' ? 'Voting block' : 'Tally block'}
          content={formatNumber(phaseBlocks.tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} isAtSnapshot={true} />
      </div>
      <div className="row">
        <div className="col border border-dark text-center during-vote-message">
          {getPhaseName(phase)} phase is open
        </div>
      </div>
    </div>
  );
}
DuringVoteInfo.propTypes = {
  currentBlock: PropTypes.number,
  snapshot: PropTypes.number,
  tally: PropTypes.number,
  phase: PropTypes.string,
};

export function AfterVoteInfo({ snapshot, tally, ...props }) {
  return (
    <div className="container">
      <div className="row">
        <InfoBox
          title="Snapshot Block"
          content={formatNumber(snapshot)}
          iconClass="fal fa-cube fa-fw"
        />
        <InfoBox
          title="Tally block"
          content={formatNumber(tally)}
          iconClass="fal fa-money-check fa-fw"
        />
        <CgpBalanceInfoBox {...props} isAtSnapshot={true} />
      </div>
    </div>
  );
}
AfterVoteInfo.propTypes = {
  snapshot: PropTypes.number,
  tally: PropTypes.number,
};
