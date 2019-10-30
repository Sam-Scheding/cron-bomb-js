const cronBomb = require('./index');

var start = new Date(2019, 12, 25, 0, 0);
var end = new Date(2020, 1, 2, 0, 0);

const source = { cron: '0 0 1 1 *' };
const debris = cronBomb.explode({source, end})
console.log(JSON.stringify(debris, null, 2));


// const debris = cronBomb.intersection({
//     cron1: '0 0 * * 1-5',
//     cron2: '0 0 1 1 *',
//     start,
//     end,
// });
// const intersection = cronBomb.intersection({start, end, cron1, cron2});
