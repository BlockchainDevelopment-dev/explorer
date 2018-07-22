import React from 'react';
import PropTypes from 'prop-types';
import TransactionAsset from './Asset/TransactionAsset';
import HashLink from '../HashLink/HashLink.jsx';

export default function Transaction(props) {
  const {transaction, address, disableTXLinks} = props;
  return (
    <div className="Transaction" key={transaction.id}>
      <div className="hash mb-4 text-truncate no-text-transform">
        {transaction.isCoinbase ? (
          <h5 className="coinbase d-inline-block mr-1 text-white">Coinbase - </h5>
        ) : null}
        <HashLink url={disableTXLinks? '' : `/tx/${transaction.hash}`} hash={transaction.hash} />
      </div>
      <div className="assets">
        {transaction.assets &&
          transaction.assets.length &&
          transaction.assets.map((asset, assetIndex) => {
            return <TransactionAsset asset={asset} key={assetIndex} showHeader={assetIndex === 0} address={address} />;
          })}
      </div>
    </div>
  );
}

Transaction.propTypes = {
  transaction: PropTypes.object,
  disableTXLinks: PropTypes.bool,
  address: PropTypes.string,
};
Transaction.defaultProps = {
  address: '',
};
