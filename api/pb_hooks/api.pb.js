/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/me/summary", (e) => {
  const result = new DynamicModel({ notes: 0, pinned: 0, attachments: 0 });
  $app.db()
    .newQuery("SELECT COUNT(*) AS notes, COALESCE(SUM(pinned), 0) AS pinned, COALESCE(SUM(json_array_length(CASE WHEN json_valid(attachments) THEN attachments ELSE '[]' END)), 0) AS attachments FROM notes WHERE owner = {:owner}")
    .bind({ owner: e.auth.id })
    .one(result);
  return e.json(200, { notes: result.notes, pinned: result.pinned, attachments: result.attachments });
}, $apis.requireAuth("users"));

onRecordCreateRequest((e) => {
  e.record.set("title", e.record.getString("title").trim());
  e.next();
}, "notes");
