# Messaging starter

Private conversations for an app or a team: one-to-one and group chats,
messages that appear live, unread counts, notifications and profiles. Only the
people in a conversation can see it, in the pages, the API and live updates.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Rules**: in the `settings` collection, set the most people in one
   conversation and how many days to keep messages (`0` keeps them forever; a
   daily job deletes older ones).
3. **Email**: configure *Mail settings* in PocketBase for password resets.

## How it works

- People sign up and get a `profiles` record; others see their name, never
  their email.
- **New** starts a conversation with the emails of people who have an account.
  Starting one with the same single person again reopens the existing chat.
- Sending a message saves it through a route, and PocketBase realtime pushes it
  to everyone in the conversation. Realtime obeys the same rules as the API,
  so nobody else receives it.
- `reads` remembers when each person last opened each conversation; the list
  shows unread counts from it.
- `notifications` tells people when someone starts a conversation with them.
- `audit_log` records new conversations and people leaving. Only superusers
  can read it.

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/app.pb.js` | Routes; every `/app/*` route needs a signed-in user |
| `pb_hooks/users.pb.js` | Creates profiles on sign-up; the daily retention job |
| `pb_hooks/lib/conversations.js` | Membership checks, starting, sending, leaving, unread counts |
| `pb_hooks/views/` | Templates for the list, conversation, messages, panels |
| `pb_public/app.js` | Sign-in, realtime subscriptions and small page behaviour |

## Use it from a mobile app

The collections work from any PocketBase SDK: list `conversations` and
`messages`, and `subscribe("*")` to `messages` for live updates. Writing goes
through the routes so membership and unread state stay consistent.
