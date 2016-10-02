# TeemantIRC
LunaSquee's third attempt at creating a working IRC client..

###Running the development version
This application requires [node.js](https://nodejs.org/) to be installed.

1. Install the dependencies `npm install`
2. Copy the configuration `cp client.config.example.toml client.config.toml`
3. Run the server `./teemant.js`

The client will be accessible at http://localhost:8080/

### WebIRC

The server will look for passwords in `webirc.data.json`. The format is: `"server-ip-address": "server webirc password"`
