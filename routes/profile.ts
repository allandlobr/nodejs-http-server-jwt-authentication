import * as http from "http";
import * as fs from "fs";

import { isAuthenticated, isAuthorized } from "../utils/auth";
import { parseCookies } from "../utils/cookies";

function getProfile(req: http.IncomingMessage, res: http.ServerResponse) {
  const cookie = req.headers.cookie;

  if (!cookie) {
    res.writeHead(302, {
      location: "/not-authenticated",
    });
    res.end();
  }

  if (cookie) {
    const cookies = parseCookies(cookie);

    const isLogged = isAuthenticated(cookies, res);
    if (!isLogged) {
      res.writeHead(302, {
        location: "/not-authenticated",
      });
      res.end();
    }

    const allowedRoles = ["user", "admin"];
    const isAllowed = isAuthorized(cookies, allowedRoles);

    if (isAllowed) {
      const streamProfile = fs.createReadStream(
        `${__dirname}/../pages/profile.html`
      );
      streamProfile.pipe(res);
    } else {
      res.setHeader("location", "/not-authorized");
      res.statusCode = 302;
      res.end();
    }
  }
}

export { getProfile };
