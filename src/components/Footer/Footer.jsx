import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import uiStore from '../../store/UIStore';
import Config from '../../lib/Config';
import Logo from '../Logo';
import ExternalLink from '../ExternalLink';
import './Footer.scss';

export default function Footer(props) {
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
          <FooterLinks />
        </div>
        <div className="FooterSocialContact col-lg-4 d-flex flex-column">
          <FooterSocial />
          <FooterContact />
          <FooterCopyright />
        </div>
      </div>
    </footer>
  );
}

const SyncNotification = observer(function() {
  return (
    <div className="SyncNotification">
      {uiStore.syncing ? (
        <span className="syncing">
          <i className="icon far fa-spinner-third zen-spin" /> Syncing...
        </span>
      ) : (
        <span className="synced">
          <i className="icon fas fa-circle" /> Synced.
        </span>
      )}
    </div>
  );
});

function FooterLinks() {
  return (
    <div className="FooterLinks">
      <div className="">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/broadcastTx">Broadcast Raw Tx</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/oracle">Oracle</Link>
          </li>
          {/* <li className="nav-item">
            <Link className="nav-link text-nowrap" to="/templates/contract">Contract templates</Link>
          </li> */}
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://www.zenprotocol.com/deck/zen_protocol_deck_en.pdf"
            >
              Pitch Deck
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              target="_top"
              url="https://www.zenprotocol.com/files/zen_protocol_white_paper.pdf"
            >
              White Paper
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              target="_top"
              url="https://www.zenprotocol.com/files/technical_paper.pdf"
            >
              Technical Paper
            </ExternalLink>
          </li>
        </ul>
      </div>
      <div className="">
        <ul className="nav flex-column">
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/">
              Documentation
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://docs.zenprotocol.com/preparation/installers"
            >
              Download Wallet
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://github.com/zenprotocol/ZFS-SDK">
              Developers SDK
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/api">
              Developers API
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://docs.zenprotocol.com/zen_js">
              Zen.JS
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://testnet.zp.io">
              Testnet
            </ExternalLink>
          </li>
        </ul>
      </div>
      <div className="">
        <ul className="nav flex-column">
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="http://blog.zenprotocol.com/">
              Blog
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink className="nav-link text-nowrap" url="https://forum.zenprotocol.com/">
              Forum
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url={`mailto:${Config.constants.zenInfoMail}`}
              target="_top"
            >
              Contact Us
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://www.zenprotocol.com/privacy?locale=en"
            >
              Privacy Policy
            </ExternalLink>
          </li>
          <li className="nav-item">
            <ExternalLink
              className="nav-link text-nowrap"
              url="https://www.zenprotocol.com/legal/zen_protocol_token_sale_agreement.pdf"
            >
              Terms of Service
            </ExternalLink>
          </li>
        </ul>
      </div>
    </div>
  );
}

function FooterContact() {
  return (
    <ul className="nav flex-column">
      <li className="nav-item text-nowrap">
        <span className="nav-link">
          Contact us:{' '}
          <ExternalLink className=" pl-0 d-inline-block" target="_top" url={`mailto:${Config.constants.zenInfoMail}`}>
            {Config.constants.zenInfoMail}
          </ExternalLink>
        </span>
      </li>
    </ul>
  );
}

function FooterSocial() {
  return (
    <ul className="FooterSocial nav">
      <li className="nav-item">
        <ExternalLink className="nav-link telegram-icon" url="https://t.me/zenprotocol/">
          <i className="fab fa-telegram-plane" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link github-icon" url="https://github.com/zenprotocol">
          <i className="fab fa-github" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link medium-icon" url="https://blog.zenprotocol.com/">
          <i className="fab fa-medium-m" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link twitter-icon" url="https://twitter.com/zen_protocol">
          <i className="fab fa-twitter" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink
          className="nav-link youtube-icon"
          url="https://www.youtube.com/channel/UCVm4j3TrmD8mSvvExG_CAIw"
        >
          <i className="fab fa-youtube" />
        </ExternalLink>
      </li>
      <li className="nav-item">
        <ExternalLink className="nav-link discourse-icon" url="https://forum.zenprotocol.com">
          <i className="fab fa-discourse" />
        </ExternalLink>
      </li>
    </ul>
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
