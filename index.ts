import * as http from "http";
import * as fs from "fs";

import { Client } from "pg";

import { getLogin, postLogin } from "./routes/login";
import { getProfile } from "./routes/profile";
import { getLogout } from "./routes/logout";
import { getHome } from "./routes/home";
import { getAdmin } from "./routes/admin";

const server = http.createServer(async (req, res) => {
  const route = req.url;

  if (req.method === "POST") {
    switch (route) {
      case "/login":
        postLogin(req, res);
        break;
      default:
        break;
    }
  }

  if (req.method === "GET") {
    switch (route) {
      case "/":
        getHome(res);
        break;
      case "/profile":
        getProfile(req, res);
        break;
      case "/admin":
        getAdmin(req, res);
        break;
      case "/logout":
        getLogout(res);
        break;
      case "/login":
        getLogin(req, res);
        break;
      case "/not-authorized":
        const streamNotAuthorized = fs.createReadStream(
          `${__dirname}/pages/not-authorized.html`
        );
        streamNotAuthorized.pipe(res);
        break;
      case "/not-authenticated":
        const streamNotAuthenticated = fs.createReadStream(
          `${__dirname}/pages/not-authenticated.html`
        );
        streamNotAuthenticated.pipe(res);
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
