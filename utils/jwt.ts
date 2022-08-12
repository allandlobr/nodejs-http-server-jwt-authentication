import * as crypto from "node:crypto";

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

function decodeJwt(token: string, secret: string) {
  if (token) {
    const arr = token.split(".");
    const header = JSON.parse(Buffer.from(arr[0], "base64").toString());
    const payload: Record<string, string> = JSON.parse(
      Buffer.from(arr[1], "base64").toString()
    );

    return { ...header, ...payload };
  }
}

function verifyJwt(token: string, secret: string) {
  if (token) {
    const decoded = decodeJwt(token, secret);
    const jwtToken = createJwt(decoded.username, decoded.role, secret);

    return jwtToken === token ? true : false;
  }
}

export { createJwt, decodeJwt, verifyJwt };
