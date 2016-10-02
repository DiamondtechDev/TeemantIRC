let connector = require(__dirname+'/irc.js');
let parser = require(__dirname+'/parser.js');

module.exports = {
	IRCConnection: connector,
	Parser: parser
}
