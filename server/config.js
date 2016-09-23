let fs = require('fs');
let toml = require('toml');
let filename = __dirname+'/../client.config.toml';

let config;

try {
	config = toml.parse(fs.readFileSync(filename));
} catch (e) {
	throw 'config.toml parse error: ' + e;
	console.error(e.stack);
}

module.exports = config;
