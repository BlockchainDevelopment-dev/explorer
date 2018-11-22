import React, { Component } from 'react';
import RouterUtils from '../../../lib/RouterUtils';
import uiStore from '../../../store/UIStore';

export default function WithSetIdOnUiStore(WrappedComponent, uiStoreFunctionName, nameOfId) {
  return class HOC extends Component {
    componentDidMount() {
      this.setId();
    }

    componentDidUpdate(prevProps) {
      const prevParams = RouterUtils.getRouteParams(prevProps);
      if (this.idProp !== prevParams[nameOfId]) {
        this.setId();
      }
    }

    get idProp() {
      return RouterUtils.getRouteParams(this.props)[nameOfId];
    }

    setId() {
      uiStore[uiStoreFunctionName]({ [nameOfId]: this.idProp });
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
