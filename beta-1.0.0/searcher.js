(async () => {
  await import("https://parking-master.github.io/Gametime.js-X/gametime.js");
  await import("https://npmcdn.com/parse@3.4.4/dist/parse.min.js");

  Parse.initialize("dAKYPJGP4UkMnaieZcGx5I2in0FIq3nAEgWSoDC0", "D4QqIKcEc4n3RgbCutNyfOv03yLn1RxRhNrs0dWE");
  Parse.serverURL = "https://parseapi.back4app.com/";

  await gametime.setCustomServer("https://gjsx.serveo.net");
  await gametime.set("channel", "world");
  await gametime.set("key", "pub-c-99b84afd-1fa3-4452-a727-4b46d06a11e2", "sub-c-ed7e8e7f-1c0a-40ec-bc97-7da421c062a0");
  await gametime.sustain();

  async function search(name, type, uuid, callback) {
    let server = new (new Parse.Object.extend("Servers"));
    server.set("uuid", uuid);
    server.set("name", name);
    server.set("type", type);

    await server.save();
  }

  function create(name, type) {
    let serverUUID = gametime.uuidv4();
    search(name, type, serverUUID, () => alert(1));
  }

  window.Server = function() {
    Server.utils = {
      options: {},
      createServer: null
    };
    let e = {
      server: "fps-x-lan-server.loca.lt",
      send: function(values, callback = () => {}) {
        fetch("http://" + this.server + "/xlanserver", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "true"
          },
          body: JSON.stringify(values)
        }).then(async (response) => {
          return callback({ ok: response.status === 200, server: this.server, data: await response.text() });
        });
      }
    };
    function i(type, element) {
      let name = document.querySelector(".swal-content__input").value.trim() || ("LOBBY-" + Math.random().toString().split(".")[1].slice(0, 4));
      let values = {
        mode: (element.querySelector("#selectmode").value || "Slayer").replace(/ /g, "_"),
        map: (element.querySelector("#selectmap").value || "Cargo Port").replace(/ /g, "_")
      };
      if (type === "lan") {
        e.send(values, (response) => {
          window.open("http://" + response.server + "/" + response.data.replace(/\./g, "-"));
        });
      } else if (type === "public") {
        create(name, "lobby");
      }
    }
    Server.utils.createServer = function() {
      i.apply(null, arguments);
    };
    swal({
      title: "Create a server",
      text: "You can create a LAN server, or make a public one and customize the options.\n\n(Optional) Label your server:",
      content: "input",
      button: false,
      closeOnClickOutside: false,
      closeOnClickEnterKey: false,
      closeOnClickEsc: false,
    });
    setTimeout(() => { document.querySelector(".swal-content__input").addEventListener("keyup", () => { createlobbytext = document.querySelector(".swal-content__input").value }) }, 500);
    document.querySelector(".swal-content").innerHTML += `
    <br>
    <select value="Public" onchange="document.querySelectorAll('.server-settings').forEach(x => x.style.display = 'none'); document.querySelector('#' + this.value.toLowerCase() + '-options').style.display = 'block'">
      <option value="Public" selected>Public</option>
      <option value="LAN">LAN</option>
    </select>

    <div id="public-options" class="server-settings" style="display: block">
      <div class="swal-title" style="font-size:20px!important">Public options</div>
      <br>
      <label for="selectmode">Mode:</label>
      <select value="Slayer" id="selectmode" onchange="Server.utils.options.mode = this.value">
        <option value="Slayer">Slayer</option>
        <option value="Snipers">Snipers</option>
        <option value="Fiesta">Fiesta</option>
        <option value="Oddball">Oddball</option>
        <option value="Fistfight">Fistfight</option>
      </select>
      <br>
      <label for="selectmap">Map:</label>
      <select value="Cargo Port" id="selectmap" onchange="Server.utils.options.map = this.value">
        <option value="Cargo Port">Cargo Port</option>
        <option value="Vertex">Vertex</option>
        <option value="Ghost city">Ghost city</option>
        <option value="Abandoned city">Abandoned city</option>
      </select>
      <br>
      <br>
      <button onclick="Server.utils.createServer('public', this.parentElement)">Create server</button>
    </div>
    <div id="lan-options" class="server-settings" style="display: none">
      <div class="swal-title" style="font-size:20px!important">LAN options</div>
      <br>
      <label for="selectmode">Mode:</label>
      <select value="Slayer" id="selectmode" onchange="Server.utils.options.mode = this.value">
        <option value="Slayer">Slayer</option>
        <option value="Snipers">Snipers</option>
        <option value="Fiesta">Fiesta</option>
        <option value="Oddball">Oddball</option>
        <option value="Fistfight">Fistfight</option>
      </select>
      <br>
      <label for="selectmap">Map:</label>
      <select value="Cargo Port" id="selectmap" onchange="Server.utils.options.map = this.value">
        <option value="Cargo Port">Cargo Port</option>
        <option value="Vertex">Vertex</option>
        <option value="Ghost city">Ghost city</option>
        <option value="Abandoned city">Abandoned city</option>
      </select>
      <br>
      <br>
      <button onclick="Server.utils.createServer('lan', this.parentElement)">Create server</button>
    </div>
    `;
  };
})();