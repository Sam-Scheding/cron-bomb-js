# Description

A simple and succinct JavaScript library for generating recurring events from a single object.

Often it is necessary to manage recurring events. Keeping track of public holidays, managing recurring bookings for your clients, or recording the opening hours of businesses all require a solution to this problem.

## Current ways to manage recurring dates

### Option 1:
The naive way to solve this problem is to explicitly generate an object for every occurrence and store all generated objects in a database. Of course, there are infinitely many events, so this process must be chunked into blocks of, let's say 6 months, and then 6 months later the process must be repeated. This is very manual, takes up a lot of space in your db, and is expensive to send over a network.

### Option 2:
Another solution is to create a second database model that keeps track of how often the event should repeat. It generally has fields like `second`, `minute`, `hour`, `day`, `month`, `year` to represent how often to repeat. This object is then referenced by the event object with a foreign key or similar. This also has some drawbacks. For example, it becomes difficult to describe events that repeat the third Saturday of every month.

## Enter cron-bomb

Cron-bomb is similar to option 2, in that it can describe an infinite series of repeating events. However, it offers a number of additional advantages:

  - It can simply describe a richer variety of recurring events, like every weekday, or every third Saturday of the month.
  - It doesn't need an extra database model, or foreign keys. It can be represented by a single field in your current model.
  - It's even less expensive to send over a network.
  - Provides inbuilt ways of tracking things like cancelled appointments, and booking clashes.

# Installation

`$ npm install cron-bomb --save`

# Usage


## Basic Usage

```
  import { explode } from 'cron-bomb';

  const start = new Date('October 1, 2019');
  const end = new Date('October 8, 2019');
  const source = {
    title: 'Lord Of The Fries',
    cron: '10 0 * * 1-5', // Every weekday at 11am
    duration: 12, // Closes at 11pm
  };

  const debris = explode({start, end, source});

  console.log(JSON.stringify(debris, null, 2));
```

This will print the following:

```
[
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-01T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-02T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-03T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-06T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-07T13:10:00.000Z",
    "duration": 12
  }
]
```

Notice that the 4th and 5th of October we skipped, because these were not weekdays.

## Custom field name

By default, `cron-bomb` will look for a field called `cron` and use that. However, it's possible to specify any fieldname you want by adding it to the options:

```
  import { explode } from 'cron-bomb';

  const start = new Date('October 1, 2019');
  const end = new Date('October 8, 2019');
  const source = {
    title: 'Lord Of The Fries',
    foo: '10 0 * * 1-5', // Every weekday at 11am
    duration: 12, // Closes at 11pm
  };

  const debris = explode({start, end, source, field: 'foo'});

  console.log(JSON.stringify(debris, null, 2));

```

The fieldname will be reflected in the output array as well:

```
[
  {
    "title": "Lord Of The Fries",
    "foo": "2019-10-01T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2019-10-02T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2019-10-03T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2019-10-06T13:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2019-10-07T13:10:00.000Z",
    "duration": 12
  }
]
```

## Excluding Particular dates

A common use case might be that an event is meant to repeat every week, but due to unforeseen circumstances, particular instances have been cancelled. For this, you can pass an array of excluded dates to `cron-bomb` and they will be skipped in the returned array:

```
import { explode } from 'cron-bomb';

const start = new Date('October 1, 2019');
const end = new Date('October 8, 2019');
const source = {
  title: 'Lord Of The Fries',
  cron: '10 0 * * 1-5', // Every weekday at 11am
  duration: 12, // Closes at 11pm
};

const cancelledEvents = [new Date('2019-10-07T13:10:00.000Z')];
const debris = explode({start, end, source, exclude: cancelledEvents});

console.log(JSON.stringify(debris, null, 2));
```

```
[
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-01T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-02T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-03T14:10:00.000Z",
    "duration": 12
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2019-10-06T13:10:00.000Z",
    "duration": 12
  }
]
```

Note that the last day is now being skipped.

## Intersections

Another common use case is that you have two streams of recurring events and want see if they ever overlap. For example, this might be a booking that repeats weekly unless it's a public holiday. `cron-bomb` supplies functionality to help you do that:

```

```

# Help with crontab syntax

https://crontab.guru/
