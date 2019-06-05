import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';

const COLORS = {
  text: '#0d0d0d',
  textGray: '#666666',
  border: '#333333',
  bg: '#ededed',
};

const titleStyle = {
  color: COLORS.textGray,
  fontWeight: '400',
  fontFamily: 'Roboto',
};

export default function Chart(props) {
  ReactHighcharts.Highcharts.setOptions({
    lang: {
      thousandsSep: ',',
    },
    chart: {
      height: '50%',
      backgroundColor: 'transparent',
      borderWidth: 0,
      style: { color: COLORS.text },
    },
    plotOptions: {
      series: {
        dataLabels: {
          color: COLORS.text,
        }
      },
      pie: {
        borderColor: COLORS.bg,
      }
    },
    title: {
      style: { display: 'none' },
    },
    colors: ['#3384f3', '#f63d3d', '#50d166'],
    xAxis: {
      gridLineWidth: 0,
      lineColor: COLORS.border,
      tickColor: COLORS.border,
      labels: {
        style: {
          color: COLORS.text,
          fontFamily: 'Roboto',
        },
      },
      title: {
        style: titleStyle,
      },
    },
    yAxis: {
      gridLineColor: COLORS.border,
      lineWidth: 0,
      tickWidth: 1,
      tickColor: '#000',
      labels: {
        style: {
          color: COLORS.text,
          fontFamily: 'Roboto',
        },
      },
      title: {
        style: titleStyle,
        margin: 20,
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      style: {
        fontFamily: 'Roboto',
      },
    },
    credits: {
      enabled: false,
    },
  });
  return <ReactHighcharts config={props.config} />;
}

Chart.propTypes = {
  config: PropTypes.object.isRequired,
};
