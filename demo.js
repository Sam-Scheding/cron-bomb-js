const cronBomb = require('./index');

const start = new Date('December 28, 2019');
const end = new Date('January 3, 2020');

const debris = cronBomb.intersection({
    cron1: '0 0 * * 1-5',
    cron2: '0 0 1 1 *',
    start,
    end,
});

console.log(JSON.stringify(debris, null, 2));
