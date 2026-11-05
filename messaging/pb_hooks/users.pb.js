/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
  const people = require(`${__hooks}/lib/people.js`);
  people.ensureProfile(e.app, e.record);
  e.next();
}, "users");

cronAdd("message-retention", "17 3 * * *", () => {
  const settings = require(`${__hooks}/lib/settings.js`);
  const days = settings.current().retentionDays;
  if (!days) return;
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().replace("T", " ");
  $app.db().newQuery("DELETE FROM messages WHERE created < {:cutoff}").bind({ cutoff }).execute();
});
