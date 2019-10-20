# Description

A simple and succinct JavaScript library for generating recurring events from a single object.

# Installation

`$ npm install cron-bomb --save`

# Usage

```
  import { explode } from 'cron-bomb';

  const start = new Date('December 17, 2019');
  const end = new Date('December 31, 2019');
  const source = {
      title: 'Lord Of The Fries', // My favourite restaurant
      cron: '10 0 * * 1-5', // Opens every weekday at 11am
      duration: 12, // Closes at 11pm
    };

  const debris = explode({start, end, source });

  console.log(JSON.stringify(debris, null, 2));  
```

This will print the following:

```
[
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-17T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-18T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-19T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-22T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-23T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-24T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-25T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-26T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-29T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-12-30T13:10:00.000Z",
    "duration": 12
  }
]
```

# Help with crontab syntax

https://crontab.guru/
