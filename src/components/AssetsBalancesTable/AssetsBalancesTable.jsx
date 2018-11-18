import React from 'react';
import PropTypes from 'prop-types';
import AssetUtils from '../../lib/AssetUtils';
import HashLink from '../HashLink';

export default function AssetsBalancesTable({ title, balance = [] }) {
  return (
    <table className="table table-zen">
      <thead>
        <tr>
          <th scope="col" colSpan="2">
            {title}
          </th>
        </tr>
        <tr>
          <th scope="col">ASSET</th>
          <th scope="col">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {balance.map((assetBalance, index) => (
          <tr key={index}>
            <td>
              <HashLink
                hash={AssetUtils.getAssetNameFromCode(assetBalance.asset)}
                value={assetBalance.asset}
                url={`/assets/${assetBalance.asset}`}
              />
            </td>
            <td>{AssetUtils.getAmountString(assetBalance.asset, assetBalance.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

AssetsBalancesTable.propTypes = {
  title: PropTypes.any,
  balance: PropTypes.array,
};

AssetsBalancesTable.defaultProps = {
  title: 'BALANCES',
};
