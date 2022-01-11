const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const xmldoc = require('xmldoc');
const  axios  = require('axios');
const { GET_QUOTE_URL, GET_LOSSER_URL, GET_ADVANCES_DECLINES_URL, GET_STOCKS_SEARCH_URL, MARKET_STATUS_URL, INDEX_URL, INTRADAY_URL, SEARCH_FUTURE_OPTIONS_URL, STOCKS_CSV_URL } = require('./constants');
const { parse } = require('nodemon/lib/cli');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();


app.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT || 5000;

const Axios = axios.default;

app.use(cors());

app.use(bodyParser.json());

function getTime(periodType, time) {
  if (periodType === 1) {
    switch(time) {
      case 'week':
        return 2;
      case 'month':
        return 3;
      case 'year':
        return 1
      default:
        return 2;
    }
  } else {
    switch (time) {
      case 1:
        return 1;
      case 5:
        return 2;
      case 15:
        return 3;
      case 30:
        return 4;
      case 60:
        return 5;
      default:
        return 1;
    }
  }
}

app.get('/get/nse/topgainers', async (req, res) => {
  Axios({
    method: 'GET',
    url: GAINERS_URL
  }).then((res) => {
    console.log('res', res.data);
  }).catch((err) => {
    console.log('err', err)
  })
});

app.get('/get/nse/toplossers', async (req, res) => {
  try {
    const response = await Axios.get(GET_LOSSER_URL);
    console.log('data', response.data);
    res.json({ 'data': response.data });
    
  } catch (err) {
    console.log('err', err);
  }
});

app.get('/get/nse/market_status', async (req, res) => {
  try {
    const response = await Axios.get(MARKET_STATUS_URL);
    const data = response.data;
    console.log('data', data);
    res.json({ data: data })
  } catch (err) {
    console.log('err', err);
  }
})

app.get('/get/nse/adv_dec', async (req, res) => {
  try {
    const response = await Axios.get(GET_ADVANCES_DECLINES_URL);
    console.log('data', response.data);
    const data = response.data;
    res.json({
      'data' : data
    })
  } catch (err) {
    console.log('err', err);
  }
});

function stripTags(string) {
  return string.replace(/<(.|\n)*?>/g, '').trim();
  
}

function searchTransformer(isIndex) {
  var matcher = '';
  if (isIndex) {
    matcher = /underlying=(.*?)&/;
  } else {
    matcher = /symbol=(.*?)&/;
  }

  return function(data) {
    var matches = data.match(/<li>(.*?)<\/li>/g);
    return matches.map(function(value1) {
      var symbol = value1.match(matcher);
      console.log('symbol', symbol[1], '');
      value1 = stripTags(value1).replace(symbol[1], '');
      console.log('value', value1);
      return {
        name: value1 || '',
        symbol: symbol[1] || ''
      }
    })
  }
}
app.post('/get/nse/search_stocks', async (req, res) => {
  const {searchString} = req.body;

  const options = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www1.nseindia.com/ChartApp/install/charts/mainpage.jsp',
      Host: 'www1.nseindia.com'
    },
    transformResponse: searchTransformer(false)
  }

  try {
    const response = await Axios.get(GET_STOCKS_SEARCH_URL + encodeURIComponent(searchString), options)
    const data = response.data;
    console.log('data', data);
    res.json({ data: data });

  } catch (err) {
    console.log('err', err);
  }
})



app.post('/get/nse/intraday_data', async (req, res) => {
  const {symbol} = req.body;
  const {time} = req.body;
  const periodType = typeof time === 'string' ? 1 : 2;
  const period = getTime(periodType, time);

  try {
    const response = await Axios.get(INTRADAY_URL + encodeURIComponent(symbol) + '&Periodicity=' + period + '&PeriodType=' + periodType);
    const data = response.data;
    console.log('data', data);
    parser.parseString(data, (err, result) => {
      console.log(result.data_sets)
    }) 
    res.json({ data: data })
  } catch (err) {
    console.log('err', err);
  }
})

app.get('/get/nse/all_stocks_csv', async (req, res) => {
  try {
    const response = await Axios.get(STOCKS_CSV_URL);
    const data =response.data;
    res.json({ data: data });
    console.log('data', data);
  } catch (err) {
    console.log('err', err);
  }
})

app.post('/get/nse/search_equity_derivatives', async (req, res) => {
  const {searchString} = req.body;

  const options = {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www1.nseindia.com/ChartApp/install/charts/mainpage.jsp',
      Host: 'www1.nseindia.com'
    },
  }

  try {
    const response = Axios.get(SEARCH_FUTURE_OPTIONS_URL + encodeURIComponent(searchString) + '&indexSymbol=NIFTY&series=EQ&instrument=OPTSTK', options);

    const data = response.data;

    console.log('data', response);
    res.json({ data: response });

  } catch (err) {
    console.log('err', err);
  }
})

app.get('/get/nse/index', async (req, res) => {
  try {
    const response = await Axios.get(INDEX_URL);
    const data = response.data;
    res.json({ data: data})
  } catch (err) {
    console.log('err', err);
  }
})

app.post('/get/nse/quote', async (req, res) => {
  const {symbol} = req.body;

  try {
    const response = await Axios.get(GET_QUOTE_URL + encodeURIComponent(symbol), {
      headers: { 
        Referer: GET_QUOTE_URL + encodeURIComponent(symbol),
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    const data = response.data;
    console.log('data', data);
    res.json({ data: data })
  } catch (err) {
    console.log('err', err);
  }
});



app.listen(port, () =>  {
  console.log(`App listening on port ${port}`)
});