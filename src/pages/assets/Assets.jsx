import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import TextUtils from '../../lib/TextUtils';
import AssetsTable from './components/AssetsTable';
import Page from '../../components/Page';

class AssetsPage extends Component {
  componentDidMount() {
    this.props.rootStore.assetStore.loadAssets({}, { setItems: false });
  }

  render() {
    return (
      <Page className="Assets">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Assets')}</title>
        </Helmet>
        <section>
          <AssetsTable />
        </section>
      </Page>
    );
  }
}

AssetsPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(AssetsPage));
