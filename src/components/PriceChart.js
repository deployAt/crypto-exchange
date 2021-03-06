import React, { Component } from 'react'
import { connect } from 'react-redux'
import Chart from 'react-apexcharts'

import { priceChartSelector, priceChartLoadedSelector } from '../store/selectors'
import Spinner from './Spinner'
import { chartOptions } from './PriceChart.config'

const priceSymbol = lastPriceChange => {
  let output
  if(lastPriceChange === '+') {
    output = <span className="text-success">&#9650;</span> //green up triangle
  } else {
    output = <span className="text-danger">&#9650;</span> //red down triangle
  }
  return output
}

const showPriceChart = (priceChart) => {
  return(
    <div className="price-chart">
      <div className="price">
        <h4>ZB/ETH &nbsp; {priceSymbol(priceChart.lastPriceChange)} &nbsp; {priceChart.lastPrice}</h4>
      </div>
      <Chart options={chartOptions} series={priceChart.series} type='candlestick' witdh='100%' height='100%' />
    </div>
  )
}

class PriceChart extends Component {
  render() {
    return (
      <div className="card">
        <div className="card-header">
          Price Chart
        </div>
        <div className="card-body">
          {this.props.priceChartLoaded ? showPriceChart(this.props.priceChart) : <Spinner />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    priceChartLoaded: priceChartLoadedSelector(state),
    priceChart: priceChartSelector(state)
  }
}

export default connect(mapStateToProps)(PriceChart)
