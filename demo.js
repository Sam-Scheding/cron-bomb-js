const cronBomb = require('./index');

const start = new Date('December 17, 2019');
const end = new Date('December 31, 2019');
const source = {
    title: 'Lord Of The Fries',
    cron: '10 0 * * 1-5', // Every weekday at 11am
    duration: 12, // Closes at 11pm
  };

const debris = cronBomb.explode({
    start,
    end,
    source,
});

console.log(JSON.stringify(debris, null, 2));
