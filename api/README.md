# API starter

A backend for your own web or mobile frontend. It has no pages. You get
accounts, a `notes` collection where every record belongs to its owner,
protected file attachments, live updates and one custom route.

## Change these first

1. **Your data**: rename `notes` and its fields in `pb_migrations`. Keep the
   `owner` field and the rules.
2. **Allowed origins**: if your frontend runs on another domain, nothing to do.
   PocketBase answers CORS for any origin. Lock it down with `--origins` if you need to.
3. **Email**: configure *Mail settings* for verification and password resets.

## Use it from your frontend

```js
import PocketBase from "pocketbase";

const pb = new PocketBase("https://your-instance.pocketbasecloud.com");

await pb.collection("users").create({ email, password, passwordConfirm: password });
await pb.collection("users").authWithPassword(email, password);
const me = pb.authStore.record.id;

const note = await pb.collection("notes").create({ owner: me, title: "Hello", attachments: [file] });
const notes = await pb.collection("notes").getList(1, 20, { sort: "-pinned,-updated" });
await pb.collection("notes").update(note.id, { pinned: true });

pb.collection("notes").subscribe("*", (event) => console.log(event.action, event.record));

const token = await pb.files.getToken();
const url = pb.files.getURL(note, note.attachments[0], { token });

const summary = await pb.send("/api/me/summary", {});
```

## Rules

| Action | Who |
| --- | --- |
| List, view, delete | The owner |
| Create | A signed-in user, as owner of the new note |
| Update | The owner, who cannot hand the note to someone else |
| Attachments | Protected: need a file token from the owner |

Hooks in `pb_hooks/api.pb.js` show a custom route (`GET /api/me/summary`) and a
record hook that tidies titles before they are saved.
