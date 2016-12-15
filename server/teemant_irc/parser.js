
// :nickname!username@hostname command arg ume nts :trailing
// or
// :hostname command arg ume nts :trailing

function parseERROR(line) {
	let final = {
		user: { nickname: '', username: '', hostname: '' },
		command: 'ERROR',
		message: '',
		raw: line.join(' ')
	};

	let pass1 = line.slice(1).join(' ');
	if(pass1.indexOf(':') == 0)
		pass1 = pass1.substring(1);

	final.message = pass1;

	return final;
}

module.exports = function(rawline) {
	let final = {
		user: {
			nickname: '',
			username: '',
			hostname: ''
		},
		command: '',
		arguments: [],
		trailing: '',
		raw: rawline
	};

	let pass1 = (rawline.indexOf(':') == 0 ? rawline.substring(1).split(' ') : rawline.split(' '));
	if (pass1[0] === 'ERROR')
		return parseERROR(pass1);

	if(pass1[0].indexOf('!') != -1) {
		let nickuser = pass1[0].split('!');
		final.user.nickname = nickuser[0];
		let userhost = nickuser[1].split('@');
		final.user.username = userhost[0];
		final.user.hostname = userhost[1];
	} else {
		final.user.hostname = pass1[0];
	}

	final.command = pass1[1];

	let pass2 = pass1.slice(2).join(' ');
	if(pass2.indexOf(':') != -1) {
		final.arguments = pass2.substring(0, pass2.indexOf(' :')).split(' ');
		final.trailing = pass2.substring(pass2.indexOf(':')+1);
	} else {
		final.arguments = pass2.split(' ');
	}

	return final;
};
