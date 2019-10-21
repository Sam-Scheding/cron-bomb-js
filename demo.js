const cronBomb = require('./index');

// const start = new Date('December 29, 2019 00:00:00 GMT-0300')
const end = new Date('January 29, 2020 00:00:00 GMT-0000')
console.log(end);
// const start = new Date(Date.UTC(2019, 11, 29, 0, 0, 0));
// console.log(start);
// const end = new Date(Date.UTC(2021, 0, 0, 0, 0, 0));
// console.log(end);
// const cron1 = '0 0 * * 1-5' // Every weekday at 11am
const cron2 = '0 0 1 1 *' // New Years Day

// const intersection = cronBomb.intersection({start, end, cron1, cron2});
const source = { cron: '0 0 1 1 *' };
const debris = cronBomb.explode({source, end})
console.log(JSON.stringify(debris, null, 2));
