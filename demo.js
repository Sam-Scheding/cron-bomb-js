const cronBomb = require('./index');

const start = new Date(Date.UTC(2020, 0, 1, 0, 0));
const end = new Date(Date.UTC(2020, 0, 3, 0, 0));
const data = [{
  title: 'Lord Of The Fries',
  cron: '10 0 * * 1-5', // Every weekday at 11am
},
{
  title: 'Lords Of The Fry',
  cron: '10 0 * * 1-5', // Every weekday at 11am
}];

const cancelledEvents = [new Date(Date.UTC(2020, 0, 1, 0, 0))];
const debris = cronBomb.explode({start, end, data, exclude: cancelledEvents});
console.log(JSON.stringify(debris, null, 2));
