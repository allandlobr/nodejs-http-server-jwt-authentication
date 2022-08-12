import * as http from "http";
import * as fs from "fs";
import { Client } from "pg";
import * as crypto from "crypto";

function createJwt(username: string, role: string, secret: string) {
  const header = JSON.stringify({
    alg: "HS256",
    typ: "JWT",
  });

  const payload = JSON.stringify({
    username,
    role,
  });

  const base64Header = Buffer.from(header).toString("base64").replace(/=/g, "");
  const base64Payload = Buffer.from(payload)
    .toString("base64")
    .replace(/=/g, "");

  const data = base64Header + "." + base64Payload;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const token = data + "." + signature;
  return token;
}

function onLogin(req: http.IncomingMessage, res: http.ServerResponse) {
  const body: any[] = [];
  req
    .on("data", (chunk) => body.push(chunk))
    .on("end", () => {
      const formData = Object.fromEntries(
        new URLSearchParams(Buffer.concat(body).toString()).entries()
      );

      const { user, pass } = formData;

      client
        .query(`SELECT * FROM users WHERE username = '${user}'`)
        .then((dbRes) => {
          if (dbRes.rows.length > 0) {
            const dbPass = dbRes.rows[0].password;
            const md5Pass = crypto.createHash("md5").update(pass).digest("hex");
            if (dbPass === md5Pass) {
              console.log("Senha correta!");
              const access = createJwt(
                dbRes.rows[0].username,
                dbRes.rows[0].role,
                "access"
              );
              const refresh = createJwt(
                dbRes.rows[0].username,
                dbRes.rows[0].role,
                "refresh"
              );
              const headers = [
                `access=${access}; Max-Age=240`,
                `refresh=${refresh}; Max-Age=240; HttpOnly`,
              ];

              client
                .query(
                  `INSERT INTO sessions VALUES (
                          '${refresh}', '${dbRes.rows[0].username}', '${dbRes.rows[0].role}'
                        )`
                )
                .then((res) => console.log("Sessão criada!"));

              res.setHeader("Set-Cookie", headers);
              res.end(JSON.stringify(formData));
            } else console.log("Senha incorreta!");
          }
        });
    });
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
        const streamHome = fs.createReadStream(`${__dirname}/home.html`);
        streamHome.pipe(res);
        break;
      case "/profile":
        const streamProfile = fs.createReadStream(`${__dirname}/profile.html`);
        streamProfile.pipe(res);
        break;
      case "/admin":
        const { cookie } = req.headers;
        const cookies = cookie?.replace(" ", "").split(";");
        
        const streamAdmin = fs.createReadStream(`${__dirname}/admin.html`);
        streamAdmin.pipe(res);
        break;
      case "/login":
        const streamLogin = fs.createReadStream(`${__dirname}/login.html`);
        streamLogin.pipe(res);
        break;
      default:
        res.end("Route not found!");
    }
  }
});

const dbInfo = {
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "password",
  port: 5432,
};

const client = new Client(dbInfo);
client.connect();

server.listen(8000, () => {
  console.log("Server is listening on port 8000");
});

server.on("close", () => {
  client.end((err) => {
    console.log("DB client disconnected");
    if (err) console.log(err);
  });
  console.log("Server encerrado.");
});
