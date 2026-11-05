/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  const people = require(`${__hooks}/lib/people.js`);
  people.ensureProfile(e.app, e.record);
  e.next();
}, "users");
