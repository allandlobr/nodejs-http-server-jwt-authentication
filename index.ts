import * as http from "http";
import * as fs from "fs";
import * as crypto from "crypto";
import { Client } from "pg";
import { createJwt, decodeJwt, verifyJwt } from "./utils/jwt";

const userCredentials = {
  username: "user",
  password: "user123",
  role: "user",
};

// const userCredentials = {
//   username: "admin",
//   password: "admin123",
//   role: "admin",
// };

function onLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const reqBody: Uint8Array[] = [];
  req
    .on("data", (chunk: Uint8Array) => reqBody.push(chunk))
    .on("end", () => {
      const formData = Object.fromEntries(
        new URLSearchParams(Buffer.concat(reqBody).toString()).entries()
      );

      const { user, pass } = formData;

      if (
        user === userCredentials.username &&
        pass === userCredentials.password
      ) {
        const access = createJwt(
          userCredentials.username,
          userCredentials.role,
          "access"
        );
        const refresh = createJwt(
          userCredentials.username,
          userCredentials.role,
          "refresh"
        );
        const headers = [
          `access=${access}; Max-Age=120`,
          `refresh=${refresh}; Max-Age=900; HttpOnly`,
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

function onLogout(req: http.IncomingMessage, res: http.ServerResponse) {
  const headers = ["access=; Max-Age=0", "refresh=; Max-Age=0; HttpOnly"];
  res.writeHead(302, {
    location: "/",
    "Set-Cookie": headers,
  });
  res.end();
}

function onProfile(req: http.IncomingMessage, res: http.ServerResponse) {
  const cookie = req.headers.cookie;

  if (!cookie) {
    res.writeHead(302, {
      location: "/not-authorized",
    });
    res.end();
  }

  if (cookie) {
    const cookies = cookie.replace(" ", "").split(";");
    const parsedCookies: Record<string, string> = {};
    for (const cookie of cookies) {
      const arr = cookie.split("=");
      parsedCookies[arr[0]] = arr[1];
    }

    if (parsedCookies.access) {
      const isJwtValid = verifyJwt(parsedCookies.access, "access");
      const decodedToken = decodeJwt(parsedCookies.access, "access");

      if (
        isJwtValid &&
        (decodedToken.role === "admin" || decodedToken.role === "user")
      ) {
        const streamProfile = fs.createReadStream(
          `${__dirname}/pages/profile.html`
        );
        streamProfile.pipe(res);
      }

      if (!isJwtValid) {
        const headers = ["access=; Max-Age=1", "refresh=; Max-Age=1; HttpOnly"];
        res.writeHead(302, {
          location: "/not-authorized",
          "Set-Cookie": headers,
        });
        res.end();
      }
    }
    if (!parsedCookies.access) {
      const isJwtValid = verifyJwt(parsedCookies.refresh, "refresh");

      if (isJwtValid) {
        const decodedToken = decodeJwt(parsedCookies.refresh, "refresh");

        const access = createJwt(
          decodedToken.username,
          decodedToken.role,
          "access"
        );

        const headers = [`access=${access}; Max-Age=120`];

        res.setHeader("Set-Cookie", headers);

        const streamProfile = fs.createReadStream(
          `${__dirname}/pages/profile.html`
        );
        streamProfile.pipe(res);
      }

      if (!isJwtValid) {
        const headers = ["access=; Max-Age=0", "refresh=; Max-Age=0; HttpOnly"];
        res.writeHead(302, {
          location: "/not-authorized",
          "Set-Cookie": headers,
        });
        res.end();
      }
    }
  }
}

function onAdmin(req: http.IncomingMessage, res: http.ServerResponse) {
  const cookie = req.headers.cookie;

  if (!cookie) {
    res.writeHead(302, {
      location: "/not-authorized",
    });
    res.end();
  }

  if (cookie) {
    const cookies = cookie.replace(" ", "").split(";");
    const parsedCookies: Record<string, string> = {};
    for (const cookie of cookies) {
      const arr = cookie.split("=");
      parsedCookies[arr[0]] = arr[1];
    }

    if (parsedCookies.access) {
      const isJwtValid = verifyJwt(parsedCookies.access, "access");
      const decodedToken = decodeJwt(parsedCookies.access, "access");

      if (isJwtValid && decodedToken.role === "admin") {
        const streamProfile = fs.createReadStream(
          `${__dirname}/pages/admin.html`
        );
        streamProfile.pipe(res);
      }

      if (!isJwtValid) {
        const headers = ["access=; Max-Age=1", "refresh=; Max-Age=1; HttpOnly"];
        res.writeHead(302, {
          location: "/not-authorized",
          "Set-Cookie": headers,
        });
        res.end();
      }

      if (!(decodedToken.role === "admin")) {
        res.writeHead(302, {
          location: "/not-authorized",
        });
        res.end();
      }
    }
    if (!parsedCookies.access) {
      const isJwtValid = verifyJwt(parsedCookies.refresh, "refresh");

      if (isJwtValid) {
        const decodedToken = decodeJwt(parsedCookies.refresh, "refresh");

        const access = createJwt(
          decodedToken.username,
          decodedToken.role,
          "access"
        );

        const headers = [`access=${access}; Max-Age=120`];

        res.setHeader("Set-Cookie", headers);

        const streamProfile = fs.createReadStream(
          `${__dirname}/pages/admin.html`
        );
        streamProfile.pipe(res);
      }

      if (!isJwtValid) {
        const headers = ["access=; Max-Age=1", "refresh=; Max-Age=1; HttpOnly"];
        res.writeHead(302, {
          location: "/not-authorized",
          "Set-Cookie": headers,
        });
        res.end();
      }
    }
  }
}

const server = http.createServer(async (req, res) => {
  const route = req.url;

  if (req.method === "POST") {
    switch (route) {
      case "/login":
        onLogin(req, res);
        break;
      default:
        break;
    }
  }

  if (req.method === "GET") {
    switch (route) {
      case "/":
        const streamHome = fs.createReadStream(`${__dirname}/pages/home.html`);
        streamHome.pipe(res);
        break;
      case "/profile":
        onProfile(req, res);
        break;
      case "/admin":
        onAdmin(req, res);
        break;
      case "/logout":
        onLogout(req, res);
        break;
      case "/login":
        const streamLogin = fs.createReadStream(
          `${__dirname}/pages/login.html`
        );
        streamLogin.pipe(res);
        break;
      case "/not-authorized":
        const streamNotAuthorized = fs.createReadStream(
          `${__dirname}/pages/not-authorized.html`
        );
        streamNotAuthorized.pipe(res);
        break;
      default:
        res.end("Route not found!");
    }
  }
});

server.listen(8000, () => {
  console.log("Server is listening on port 8000");
});

server.on("close", () => {
  console.log("Server encerrado.");
});
