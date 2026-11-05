# Team workspace starter

A workspace for teams: people create a team, invite colleagues by email, and
work through projects and tasks together. Roles decide who can do what, and
every change shows up in the team's activity.

## Change these first

1. **Name**: set *Application name* in PocketBase settings.
2. **Email**: configure *Mail settings* so invites are emailed. Until then the
   inviter sees the invite link and can send it themselves. Set *Application
   URL* too if PocketBase runs behind a proxy, so links use your address.
3. **Rules**: in `settings`, choose how many days an invite link works and the
   most people in one team.

## Roles

| Role | Can |
| --- | --- |
| Owner | Everything, including changing roles and inviting admins |
| Admin | Invite and remove members, revoke invites |
| Member | Create projects, add, assign and finish tasks |

A team always keeps at least one owner.

## Invites

An invite is a single-use link that only works for the email it was sent to
and expires after the configured days. Only a hash of the link's token is
stored, so the database alone can't be used to join a team.

## Security

Every route checks team membership; outsiders get "not found" rather than
"forbidden", so they can't tell which teams exist. The API rules give the same
answers: members can read their team's projects, tasks and members, and all
writes go through the routes.

## Where things are

| File | What it does |
| --- | --- |
| `pb_hooks/app.pb.js` | Pages (`/t/{team}`, `/t/{team}/p/{project}`, `/invite/{token}`) and `/app/*` routes |
| `pb_hooks/lib/teams.js` | Membership, roles, invites, removing people |
| `pb_hooks/lib/work.js` | Projects and tasks |
| `pb_hooks/views/` | Templates for the workspace, project, people and the invite email |
| `pb_public/app.js` | Sign-in, accepting an invite, loading the workspace |
