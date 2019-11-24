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

  const start = new Date(2020, 0, 1, 0, 0);
  const end = new Date(2020, 0, 8, 0, 0);
  const data = {
    title: 'Lord Of The Fries',
    cron: '10 0 * * 1-5', // Every weekday at 11am
  };

  const debris = explode({data, start, end})
  console.log(JSON.stringify(debris, null, 2));
```

This will print the following:

```
[
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-01T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-02T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-03T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-06T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-07T00:10:00.000Z"
  }
]
```

So, what just happened? Basically, we just asked `cron-bomb` to give us a list of all dates between
2020-01-01 and 2020-01-07 that match `10 0 * * 1-5`. Notice that the 4th and 5th of January, 2020 were skipped because these are not weekdays. An array was then returned where each element is an object that looks a lot like the original object that we passed in, except the `cron` value has been replaced with a Date.


## Custom field name

By default, `cron-bomb` will look for a field called `cron` and use that. However, it's possible to specify any field name you want by adding it to the options:

```
  import { explode } from 'cron-bomb';

  const start = new Date(2020, 0, 1, 0, 0);
  const end = new Date(2020, 0, 8, 0, 0);
  const data = {
    title: 'Lord Of The Fries',
    foo: '10 0 * * 1-5', // Every weekday at 11am
  };

  const debris = explode({data, start, end, field: 'foo'})
  console.log(JSON.stringify(debris, null, 2));

```

The field name will be reflected in the output array as well:

```
[
  {
    "title": "Lord Of The Fries",
    "foo": "2020-01-01T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2020-01-02T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2020-01-03T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2020-01-06T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "foo": "2020-01-07T00:10:00.000Z"
  }
]
```

## Passing multiple objects to explode
`cron-bomb` accepts either an Object, or an Array as input for the `data` option. This means you can easily explode multiple objects at once:

```
import { explode } from 'cron-bomb';

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

const debris = explode({start, end, data, exclude: cancelledEvents});
console.log(JSON.stringify(debris, null, 2));

```
This returns the following:
```
[
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-01T00:10:00.000Z"
  },
  {
    "title": "Lord Of The Fries",
    "cron": "2020-01-02T00:10:00.000Z"
  },
  {
    "title": "Lords Of The Fry",
    "cron": "2020-01-01T00:10:00.000Z"
  },
  {
    "title": "Lords Of The Fry",
    "cron": "2020-01-02T00:10:00.000Z"
  }
]
```

Note that the returned array is ordered in regards to the elements in the array that was passed in, not by date. A `sortable` option which will use insertion sort to sort the array by date is in development and will be available in a future version. This will be more efficient than sorting the array after it is returned, but for now, it is relatively trivial to sort the returned array by date.

## Excluding Particular dates

A common use case might be that an event is meant to repeat every week, but due to unforeseen circumstances, particular instances have been cancelled. For this, you can pass an array of excluded dates to `cron-bomb` and they will be skipped in the returned array:

```
import { explode } from 'cron-bomb';

const start = new Date('October 1, 2019');
const end = new Date('October 8, 2019');
const data = {
  title: 'Lord Of The Fries',
  cron: '10 0 * * 1-5', // Every weekday at 11am
  duration: 12, // Closes at 11pm
};

const cancelledEvents = [new Date('2019-10-07T13:10:00.000Z')];
const debris = explode({start, end, data, exclude: cancelledEvents});
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
