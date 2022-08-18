import { createJwt, decodeJwt, verifyJwt } from "./jwt";
import * as http from "http";

type Cookies = Record<string, string>;

const userCredentials = {
  username: "admin",
  password: "admin123",
  role: "admin",
};

function authenticateUser(username: string, password: string) {
  if (
    username === userCredentials.username &&
    password === userCredentials.password
  )
    return userCredentials;

  return null;
}

function generateToken(
  username: string,
  role: string,
  type: "access" | "refresh"
) {
  const token = createJwt(
    username,
    role,
    type === "access" ? "secret-access-string" : "secret-refresh-string"
  );

  return token;
}

function refreshToken(cookies: Cookies, res: http.ServerResponse) {
  const { username, role } = decodeJwt(
    cookies.refresh,
    "secret-refresh-string"
  );
  const accessToken = generateToken(username, role, "access");

  cookies.access = accessToken;
  res.setHeader("Set-Cookie", `access=${accessToken}; Max-Age=300`);
}

function isAuthenticated(cookies: Cookies, res: http.ServerResponse) {
  if (cookies.access) {
    const isAccessValid = verifyJwt(cookies.access, "secret-access-string");
    if (!isAccessValid) {
      const isRefreshValid = verifyJwt(
        cookies.refresh,
        "secret-refresh-string"
      );

      if (!isRefreshValid) return false;

      if (isRefreshValid) {
        refreshToken(cookies, res);
        return true;
      }
    }
    if (isAccessValid) return true;
  }

  if (cookies.refresh) {
    const isRefreshValid = verifyJwt(cookies.refresh, "secret-refresh-string");

    if (!isRefreshValid) return false;

    if (isRefreshValid) {
      refreshToken(cookies, res);
      return true;
    }
  }
}

function isAuthorized(cookies: Cookies, allowedRoles: string[]) {
  const decodedCookie = decodeJwt(cookies.access, "secret-access-string");
  const isAllowed = allowedRoles.includes(decodedCookie.role);
  return isAllowed;
}

export { authenticateUser, generateToken, isAuthenticated, isAuthorized };
