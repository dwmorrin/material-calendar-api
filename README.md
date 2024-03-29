# Calendar API

This is the backend to a calendar app for scheduling events in locations.
[Client app repo found here.](https://github.com/dwmorrin/material-calendar)

## Setup

### External dependencies

Install the following dependencies manually:

- [`node`](https://nodejs.org/en/)
- [`mysql`](https://www.mysql.com/)

### Project dependencies

`yarn` to install the local dependencies.

### Environment variables

Run the `generate-env.mjs` script to generate the environment variables.

## Database initialization

Run

```sh
node startup.js
```

which will use the .env file to

- create the database backups directory
- create the database
- load the database schema from sql/material-calendar.sql
- load a minimal set of data to start the app, including the initial admin user

## Authentication

The means of authenticating users can be set in `src/utils/authentication.ts`.
An authentication string is added to `res.locals.authId` and `session.authId`.

The optional .env key `AUTH_METHOD` can be set to `DOT_ENV_AUTH_ID` to use the
`AUTH_ID` key as the authentication string. This will bypass the login system.

By default the app will use password authentication.
This requires the .env property:

```
MYSQL_SHA2_PASSPHRASE=passphrase
```

For production with an external authentication that can inject the auth ID into
the request headers, add the following entries to .env:

```
AUTH_METHOD=CUSTOM_HEADER
AUTH_CUSTOM_HEADER=my-auth-id
```

Otherwise, add an additional case in `authentication.ts` for
your environment.

## Authorization

Authorization is done on each request by looking up the user's information
immediately after authentication and attaching the authorization info to the
response object as `res.locals.user` and `res.locals.admin`.

All responses should have `res.locals.user` with basic user information and
`res.locals.admin` will a boolean value indicataing that the user is an admin.

See `src/utils/authorization.ts` for details.

## Emailing

Emailing uses nodemailer to send mail. Requires a SMTP server running locally.
Default port is 25. Port and "from" field can be set with .env using
`EMAIL_PORT` and `EMAIL_FROM`.

For local testing, a docker container works nicely to log the emails:

```sh
docker pull ghusta/fakesmtp
mkdir /tmp/fakemail
# set .env EMAIL_PORT=2525
docker run -d -p 2525:25 -v /tmp/fakemail:/var/mail ghusta/fakesmtp:2.0
# hit the email API, then inspect emails sent at /tmp/fakemail
```

## Development script

Run

```sh
yarn watch
```

to use `tsc` to build and `nodemon` to refresh `node` on save.

## Credits

Inspired by [Microsoft's TypeScript + Node + Mongo example](https://github.com/microsoft/TypeScript-Node-Starter)
