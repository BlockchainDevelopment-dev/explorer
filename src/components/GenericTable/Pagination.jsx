import React, { Component } from 'react';
import classnames from 'classnames';

const PAGES_TO_SHOW = 4;

export default class ReactTablePagination extends Component {
  constructor(props) {
    super(props);

    this.getSafePage = this.getSafePage.bind(this);
    this.changePage = this.changePage.bind(this);
  }

  getSafePage(page) {
    if (Number.isNaN(page)) {
      page = this.props.page;
    }
    return Math.min(Math.max(page, 0), this.props.pages - 1);
  }

  changePage(page) {
    page = this.getSafePage(page);
    if (this.props.page !== page) {
      this.props.onPageChange(page);
    }
  }

  render() {
    const {
      // Computed
      pages,
      // Props
      page,
      canPrevious,
      canNext,
      className,
    } = this.props;
    
    if(pages < 2) {
      return null;
    }
    return (
      <div className={classnames(className, '-pagination')} style={this.props.style}>
        <nav aria-label="Page navigation">
          <ul className="pagination pagination-sm">
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => {
                  if (!canPrevious) return;
                  this.changePage(page - 1);
                }}
                disabled={!canPrevious}
              >
                {this.props.previousText}
              </button>
            </li>
            {this.getPageButtons(page, pages)}
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => {
                  if (!canNext) return;
                  this.changePage(page + 1);
                }}
                disabled={!canNext}
              >
                {this.props.nextText}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  }

  getPageButtons(page, pages) {
    const pageButtonsNumbers = [];
    
    for (let i = 0; i < pages; i++) {
      if (
        i === 0 ||
        (i < PAGES_TO_SHOW && page < 2) ||
        (Math.abs(page - i) < PAGES_TO_SHOW - 2 && page >= 2) ||
        (i >= pages - PAGES_TO_SHOW && page >= pages - 2) ||
        i === pages - 1
      ) {
        pageButtonsNumbers.push(i);
      }
    }
    const pageButtons = [];
    for (let i = 0; i < pageButtonsNumbers.length; i++) {
      const curPageNumber = pageButtonsNumbers[i];
      pageButtons.push(this.getPageButton(curPageNumber, curPageNumber === page));
      if(i < pageButtonsNumbers.length - 1) {
        const nextPageNumber = pageButtonsNumbers[i + 1];
        if (nextPageNumber - curPageNumber > 1) {
          pageButtons.push(this.getPageButton(Math.floor((nextPageNumber + curPageNumber) / 2), false, '...', curPageNumber + pages));
        }
      }
    }

    return pageButtons;
  }

  getPageButton(page, active, text, key) {
    return (
      <li key={key || page} className={classnames('page-item', { active })}>
        <button
          onClick={() => {
            this.changePage(page);
          }}
          className="page-link page-number"
        >
          {text || page + 1}
        </button>
      </li>
    );
  }
}
