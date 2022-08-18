import * as http from "http";
import * as fs from "fs";

function getHome(res: http.ServerResponse) {
  const streamHome = fs.createReadStream(`${__dirname}/../pages/home.html`);
  streamHome.pipe(res);
}

export { getHome };
