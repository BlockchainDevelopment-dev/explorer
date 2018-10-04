import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils';
import uiStore from '../../store/UIStore';
import TextUtils from '../../lib/TextUtils';
import BlockUtils from '../../lib/BlockUtils';
import BlockTxsTable from '../../components/BlockTxsTable/BlockTxsTable.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import HashLink from '../../components/HashLink/HashLink.jsx';
import './Block.css';

class BlockPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      blockNumber: 0,
    };
  }
  componentDidMount() {
    blockStore.fetchBlock(this.hashOrBlockNumber).then(block => {
      this.switchBlock(block.blockNumber);
    });
    this.setBlockInUiTable(this.hashOrBlockNumber);
  }

  componentDidUpdate(prevProps) {
    const prevHashOrBlockNumber = RouterUtils.getRouteParams(prevProps).id;
    if (this.hashOrBlockNumber !== prevHashOrBlockNumber) {
      blockStore.fetchBlock(this.hashOrBlockNumber).then(block => {
        this.switchBlock(block.blockNumber);
      });
      this.setBlockInUiTable(this.hashOrBlockNumber);
    }
  }

  get hashOrBlockNumber() {
    return RouterUtils.getRouteParams(this.props).id;
  }

  setBlockInUiTable(hashOrBlockNumber) {
    uiStore.setBlockTxTableData({ hashOrBlockNumber });
  }

  renderPagination() {
    const {blockNumber} = this.state;
    let prevDisabled = blockNumber <= 1;
    let nextDisabled = blockNumber >= blockStore.blocksCount;

    return (
      <nav aria-label="Page navigation" className="float-sm-right">
        <ul className="pagination pagination-sm">
          <li className={classNames('page-item', { disabled: prevDisabled })}>
            <Link
              className="page-link"
              onClick={() => {
                this.switchBlock(blockNumber - 1);
              }}
              to={`/blocks/${blockNumber - 1}`}
            >
              PREVIOUS
            </Link>
          </li>
          <li className="page-item disabled">
            <a className="page-link bg-transparent border-0">BLOCK {blockNumber}</a>
          </li>
          <li className={classNames('page-item', { disabled: nextDisabled })}>
            <Link
              className="page-link"
              onClick={() => {
                this.switchBlock(blockNumber + 1);
              }}
              to={`/blocks/${blockNumber + 1}`}
            >
              NEXT
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  switchBlock(blockNumber) {
    this.setState({ blockNumber: Number(blockNumber) });
  }

  render() {
    const block = blockStore.block;
    const blockDateStr = block.timestamp
      ? TextUtils.getDateStringFromTimestamp(block.timestamp)
      : '';

    if (!block.id) return <Loading />;

    return (
      <div className="Block">
        <section>
          <div className="row">
            <div className="col-sm">
              <div className="font-size-md mb-1 mb-lg-2">{blockDateStr}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                BLOCK #{block.blockNumber}
              </h1>
            </div>
            <div className="col-sm">{this.renderPagination()}</div>
          </div>
          <div className="row">
            <div className="col">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" colSpan="2">
                      SUMMARY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {block.hash ? (
                    <tr>
                      <td>HASH</td>
                      <td className="no-text-transform">
                        <HashLink hash={block.hash} truncate={false} />
                      </td>
                    </tr>
                  ) : null}
                  <tr>
                    <td>TRANSACTIONS</td>
                    <td>{block.transactionCount}</td>
                  </tr>
                  <tr>
                    <td>TIMESTAMP</td>
                    <td>{blockDateStr}</td>
                  </tr>
                  <tr>
                    <td>VERSION</td>
                    <td>{block.version}</td>
                  </tr>
                  <tr>
                    <td>DIFFICULTY</td>
                    <td className="no-text-transform">
                      {BlockUtils.formatDifficulty(block.difficulty)}
                    </td>
                  </tr>
                  <tr>
                    <td>CONFIRMATIONS</td>
                    <td className="no-text-transform">
                      {blockStore.confirmations(block.blockNumber)}
                    </td>
                  </tr>
                  <tr>
                    <td>PARENT</td>
                    <td>
                      <div className="address no-text-transform break-word">
                        <HashLink
                          url={block.blockNumber > 1 ? `/blocks/${block.parent}` : ''}
                          hash={block.parent}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <BlockTxsTable />
        </section>
      </div>
    );
  }
}

BlockPage.propTypes = {
  match: PropTypes.object,
};

export default observer(BlockPage);
