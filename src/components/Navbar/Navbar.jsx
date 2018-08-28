import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, withRouter } from 'react-router-dom';
import classnames from 'classnames';
import Logo from '../Logo/Logo.jsx';
import SearchBar from '../SearchBar/SearchBar.jsx';
import './Navbar.css';

const ANIMATION_TIME = 350;

class Navbar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true,
      isCollapsing: false,
      height: '',
      prevPathname: '',
    };

    this.toggle = this.toggle.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.canHideOnPathnameChange = this.canHideOnPathnameChange.bind(this);
  }

  componentDidMount() {
    this.elementHeight = document.getElementById('navbarSupportedContent').scrollHeight;
    this.setState({ prevPathname: this.props.location.pathname });
  }

  componentDidUpdate() {
    const { pathname } = this.props.location;
    const prevPathname = this.state.prevPathname;
    if (prevPathname !== pathname) {
      this.setState({ prevPathname: pathname });
      if (this.canHideOnPathnameChange(prevPathname, pathname)) {
        this.hide();
      }
    }
  }

  canHideOnPathnameChange(prev, cur) {
    if (cur.indexOf('/search') === 0) {
      return false;
    }
    return true;
  }

  toggle() {
    if (this.state.isCollapsing) {
      return;
    }

    if (this.state.collapsed) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    if (!this.state.collapsed) {
      return;
    }
    this.setState({ isCollapsing: true }, () => {
      setTimeout(() => {
        this.setState({
          height: `${document.getElementById('navbarSupportedContent').scrollHeight}px`,
        });
        setTimeout(() => {
          this.setState({ collapsed: false, isCollapsing: false }, () => {
            this.setState({ height: '' });
          });
        }, ANIMATION_TIME);
      }, 50);
    });
  }

  hide() {
    if (this.state.collapsed) {
      return;
    }
    this.setState(
      {
        isCollapsing: true,
        height: `${document.getElementById('navbarSupportedContent').scrollHeight}px`,
      },
      () => {
        setTimeout(() => {
          this.setState({ height: '0' });
          setTimeout(() => {
            this.setState({ collapsed: true, isCollapsing: false }, () => {
              this.setState({ height: '' });
            });
          }, ANIMATION_TIME);
        }, 50);
      }
    );
  }

  render() {
    const { isCollapsing, collapsed } = this.state;
    return (
      <div className={classnames(this.props.className, 'Navbar')}>
        <nav className="navbar navbar-dark navbar-expand-lg py-1 py-lg-3 px-0">
          <Logo />
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            onClick={this.toggle}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div
            style={{ height: this.state.height }}
            className={classnames(
              'navbar-collapse',
              { collapse: !isCollapsing },
              { show: !isCollapsing && !collapsed },
              { collapsing: isCollapsing }
            )}
            id="navbarSupportedContent"
          >
            <ul className="navbar-nav mr-auto">
              {/* <li className="nav-item active">
                <NavLink className="nav-link" to="/blocks">
                  Blocks
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/tx">Transactions</NavLink>
              </li> */}
            </ul>
            <SearchBar />
          </div>
        </nav>
      </div>
    );
  }
}

Navbar.propTypes = {
  className: PropTypes.string,
  location: PropTypes.object,
};

export default withRouter(Navbar);
