const app = require("express")();
const fs = require("fs");
const localtunnel = require("localtunnel");
const jsonParser = require("body-parser").json();
const HTMLParser = require("node-html-parser");
const btoa = require("btoa");

// For safety
__dirname = `/Users/Jackson/FPS-X/`;

// Global variables
let client_servers = [];

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,bypass-tunnel-reminder");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/xlanserver", jsonParser, function(req, res) {
  let ip = (req.headers["x-forwarded-for"] || "").split(",").pop().trim();
  if (!ip) {
    res.statusMessage = "Could not get IPv4 address";
    res.statusCode = 400;
    return res.end();
  }
  client_servers[ip] = {
    options: req.body
  };
  setTimeout(() => {
    res.setHeader("Content-Type", "text/plain");
    return res.send(ip);
  }, 1000);
});

app.get("*", function(req, res) {
  let ip = req.path.split("/")[1].replace(/-/g, ".");

  if (Object.keys(client_servers).indexOf(ip) > -1) {
    let options = client_servers[ip].options;

    let reqIP = (req.headers["x-forwarded-for"] || "").split(",").pop().trim();
    if (reqIP !== ip) return req.socket.destroy();
    fetch("http://fps-x-lan-server.loca.lt/index.html").then(response => response.text()).then(page => {
      let body = HTMLParser.parse(page);
      let scripts = Object.values(body.querySelectorAll("script"));
      let script = scripts.filter(n => n.textContent.includes("sandbox.map = params().map"))[0];
      script.textContent = script.textContent.replace(`function params() {
        return Object.fromEntries(new URLSearchParams(location.search));
      }`, `function params() {
        let search = "?map=${options.map}&mode=${options.mode}";
        return Object.fromEntries(new URLSearchParams(search));
      }`);
      let content = body.innerHTML;
      res.setHeader("Content-Type", "text/html");
      return res.send(content);
    });
  } else {
    if (fs.existsSync(__dirname + req.path)) {
      return res.sendFile(__dirname + req.path);
    } else {
      req.socket.destroy();
    }
  }
});

app.listen(7093);

(async () => {
  const tunnel = await localtunnel({ port: 7093, subdomain: "fps-x-lan-server" });
  console.log(tunnel.url);
  
  tunnel.on("close", () => {
    console.log("\nTunnel closed");
  });
  
  process.on("SIGINT", () => {
    tunnel.close();
    process.exit(0);
  });
})();