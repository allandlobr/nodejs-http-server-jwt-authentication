import * as http from "http";

function getLogout(res: http.ServerResponse) {
  const headers = ["access=; Max-Age=0", "refresh=; Max-Age=0; HttpOnly"];
  res.writeHead(302, {
    location: "/",
    "Set-Cookie": headers,
  });
  res.end();
}

export { getLogout };
