In this project, i try to use only built-in node.js modules. The reason why i have started coding this basic server is only to understand node.js works and what happens under the hood when using third-party libraries/frameworks.

The server consist in a simple HTTP server with 5 routes: /login, /logout, /, /admin and /profile. The /admin and /profile are protected routes, to access it, the user must have the proper role.

To find out if an user exist when performing login and which role it has, a quick check is made in the users table previously created on Postgres.

When the user is logged, the username and role is sent back into a JWT using cookies.

An access and refresh token are created. The access token acessible on client, and refresh token set as HttpOnly.

Every time the user tries to access some protected route, the access token is checked, if it is valid, and the user has access, the server returns the HTML, otherwise an error is returned.

If the access token is expired, the refresh token is checked, if it is valid, a new access token is issued. In the case the refresh token is expired as well, the user is redirected to /login.

Since it is for study purpose only, i strongly advise to not use any of this code in a production server.
