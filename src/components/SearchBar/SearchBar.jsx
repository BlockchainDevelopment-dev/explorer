import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore.js';
import './SearchBar.css';

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    blockStore.setSearchString(event.target.value.trim());
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.history.push(`/search/${blockStore.searchString}`);
  }

  

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="form-inline my-3 my-lg-0">
        <div className="input-group">
          <div className="input-group-prepend">
            <button className="btn btn-outline-dark btn-search" type="submit"><i className="fas fa-search"></i></button>
          </div>
          <input
            value={blockStore.searchString}
            onChange={this.handleChange}
            className="form-control mr-sm-2"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
        </div>
        
      </form>
    );
  }
}

SearchBar.propTypes = {
  history: PropTypes.object,
};

export default withRouter(observer(SearchBar));
