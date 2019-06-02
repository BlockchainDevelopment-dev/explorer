import React from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import Config from '../../lib/Config';
import Logo from '../Logo';
import ExternalLink from '../ExternalLink';
import Button from '../buttons/Button';
import ButtonToolbar from '../buttons/ButtonToolbar';
import SyncNotification from '../SyncNotification';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="Footer container">
      <div className="row row-logo">
        <div className="col-12 px-0">
          <Logo />
          <SyncNotification />
        </div>
      </div>
      <div className="row">
        <div className="col-lg-8 border-dark separator">
          <FooterDownloadButtons />
        </div>
        <div className="FooterSocialContact col-lg-4 d-flex flex-column">
          <FooterCopyright />
        </div>
      </div>
    </footer>
  );
}

function FooterCopyright() {
  return (
    <ul className="nav flex-column">
      <li className="nav-item text-nowrap">
        <div className="copyright nav-link">
          <span>{`© ${new Date().getFullYear()}`} Blockchain Development LTD.</span>
        </div>
      </li>
    </ul>
  );
}

function FooterDownloadButtons() {
  return (
    <div>
      <div>DOWNLOAD YESOD WALLET:</div>
      <ButtonToolbar>
        <Button href="https://docs.zenprotocol.com/preparation/installers" target="_blank" type="dark-2" size="sm">
          <i className="fab fa-windows" /> Windows
        </Button>
        <Button href="https://docs.zenprotocol.com/preparation/installers" target="_blank" type="dark-2" size="sm">
          <i className="fab fa-apple"></i> Mac OS
        </Button>
        <Button href="https://docs.zenprotocol.com/preparation/installers" target="_blank" type="dark-2" size="sm">
          <i className="fab fa-linux"></i>Linux
        </Button>
      </ButtonToolbar>
    </div>
  );
}
