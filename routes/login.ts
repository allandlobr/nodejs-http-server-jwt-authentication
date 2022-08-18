import * as http from "http";
import * as fs from "fs";

import {
  authenticateUser,
  generateToken,
  isAuthenticated,
} from "../utils/auth";
import { parseCookies } from "../utils/cookies";

function postLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const reqBody: Uint8Array[] = [];
  req
    .on("data", (chunk: Uint8Array) => reqBody.push(chunk))
    .on("end", () => {
      const formData = Object.fromEntries(
        new URLSearchParams(Buffer.concat(reqBody).toString()).entries()
      );

      const { user, pass } = formData;

      const userCredentials = authenticateUser(user, pass);

      if (userCredentials) {
        const { username, password, role } = userCredentials;

        const accessToken = generateToken(username, role, "access");
        const refreshToken = generateToken(username, role, "refresh");

        const headers = [
          `access=${accessToken}; Max-Age=300; HttpOnly`,
          `refresh=${refreshToken}; Max-Age=900; HttpOnly`,
        ];

        res.writeHead(302, {
          location: "/",
          "Set-Cookie": headers,
        });
        res.end();
      }

      res.writeHead(302, {
        location: "/login",
      });
      res.end();
    });
}

function getLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const cookie = req.headers.cookie;

  if (cookie) {
    const cookies = parseCookies(cookie);

    const isLogged = isAuthenticated(cookies, res);
    if (isLogged) {
      res.writeHead(302, {
        location: "/",
      });
      res.end();
    }
  }
  if (!cookie) {
    const streamProfile = fs.createReadStream(`${__dirname}/../pages/login.html`);
    streamProfile.pipe(res);
  }
}

export { getLogin, postLogin };
