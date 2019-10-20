const cronBomb = require('./index');
const moment = require('moment');

const conf = {
  source: {
    title: 'My Favourite Restaurant',
    cron: '0 0 * * 1-5',
  },
  start: moment().format(),
  end: moment().add(14, 'days'),
}

const events = cronBomb.explode(conf);

console.log(JSON.stringify(events, null, 2));
