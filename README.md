# Description

A simple and succinct way to generate recurring events from a single object.

# Installation

`$ npm install cron-dates --save`

# Usage

```
  const cronDates = require('./index');
  const moment = require('moment');

  // Some list of objects received from a DB
  const data = [
    {
      title: 'Restaurant',
      cron: '0 0 * * 1-5', // Every weekday
    }
  ];

  const now = moment().format();
  const nextWeek = moment().add(14, 'days');

  // expects an array of objects that contain a 'cron' key with a valid string of cron syntax
  const events = cronDates.generate(cronEvents, now, nextWeek);

  console.log(JSON.stringify(events, null, 2));
  /*
    Prints something like:
[
  {
    "title": "Restaurant",
    "date": "2019-10-15T13:00:00.000Z"
  },
  {
    "title": "Restaurant",
    "date": "2019-10-16T13:00:00.000Z"
  },
  {
    "title": "Restaurant",
    "date": "2019-10-17T13:00:00.000Z"
  },
  {
    "title": "Restaurant",
    "date": "2019-10-20T13:00:00.000Z"
  }
  ...
]
  */

```

# Help with crontab syntax

https://crontab.guru/
