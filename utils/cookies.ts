function parseCookies(cookie: string) {
  const cookies = cookie.replace(" ", "").split(";");

  const parsedCookies: Record<string, string> = {};

  for (const cookie of cookies) {
    const arr = cookie.split("=");
    parsedCookies[arr[0]] = arr[1];
  }

  return parsedCookies;
}

export { parseCookies };
