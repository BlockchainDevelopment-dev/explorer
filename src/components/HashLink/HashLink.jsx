import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import clipboard from 'clipboard-polyfill/build/clipboard-polyfill.promise';
import TextUtils from '../../lib/TextUtils';
import './HashLink.css';

export default class HashLink extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
    };

    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.setCopied = this.setCopied.bind(this);
  }

  render() {
    const { url, hash, copy, truncate, value } = this.props;
    const truncatedHash = truncate ? truncateHash(hash) : hash;
    const anchorHash = url ? <Link to={url}>{truncatedHash}</Link> : truncatedHash;
    const valueToCopy = value ? value : hash;

    const anchorCopy = (
      <div
        className="copy"
        onMouseLeave={() => {
          this.setCopied(false);
        }}
        data-balloon={this.state.copied ? 'Copied to clipboard' : 'Copy'}
        data-balloon-pos="up-left"
      >
        <button
          onClick={() => {
            this.copyToClipboard(valueToCopy);
          }}
          className="button btn-link"
          title="Copy hash to clipboard"
        >
          <i className="far fa-copy" />
        </button>
      </div>
    );

    const showCopy = copy;

    return (
      <div
        className={classNames('HashLink break-word', { copyable: showCopy })}
        title={showCopy ? valueToCopy : ''}
      >
        {anchorHash}
        {showCopy ? anchorCopy : null}
      </div>
    );
  }

  copyToClipboard(str) {
    clipboard.writeText(str).then(() => {
      this.setCopied(true);
    });
  }

  setCopied(copied) {
    this.setState({ copied });
  }
}

function truncateHash(hash) {
  return TextUtils.truncateHash(hash);
}

HashLink.propTypes = {
  url: PropTypes.string,
  hash: PropTypes.any.isRequired,
  value: PropTypes.string,
  copy: PropTypes.bool,
  truncate: PropTypes.bool,
};
HashLink.defaultProps = {
  copy: true,
  truncate: true,
};
