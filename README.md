# Calendar API

This is the backend to a calendar app for scheduling events in locations.
[Client app repo found here.](https://github.com/dwmorrin/material-calendar)

## Setup

`yarn` to install dependencies.

Create a .env file:

```
PORT=3001
NODE_ENV=development
MYSQL_HOST="127.0.0.1"
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=calendar
MYSQL_BACKUP_DIR=/my/backup/dir
NET_ID=username_to_login_with_for_development
ADMIN_PASSWORD=OPTIONAL_web_app_admin_password
ADMIN_FIRST_NAME=OPTIONAL_web_app_admin
ADMIN_LAST_NAME=OPTIONAL_web_app_admin
ADMIN_EMAIL=OPTIONAL_web_app_admin
```

The app does not handle authorization; it just expects a `netId` property to be in the request
headers. If `NODE_ENV=development` is set, then the `netId` will just be set to the provided `NET_ID` from the .env file.

The .env entries starting with ADMIN\_ are optional. They are used by the database startup script.
If filled out, the script will use those values; otherwise the script will run interactively to get those values.

## Run

`npm run watch` will use `tsc` to build and `nodemon` to refresh `node` on save.

## Credits

Inspired by [Microsoft's TypeScript + Node + Mongo example](https://github.com/microsoft/TypeScript-Node-Starter)
