// Shamelessly copied from https://github.com/megawac/irc-style-parser/
// Lol, I just gave credit, didn't I..
// Dammit, well, there's that.

const styleCheck_Re = /[\x00-\x1F]/;
const back_re = /^(\d{1,2})(,(\d{1,2}))?/;
const colourKey = '\x03';
const colour_re = /\x03/g;
const styleBreak = '\x0F'; // breaks all open styles ^O (\x0F)

let styles = [
	['normal', '\x00', ''], ['underline', '\x1F'],
	['bold', '\x02'], ['italic', '\x1D']
].map(function(style) {
	var escaped = encodeURI(style[1]).replace('%', '\\x');
	return {
		name: style[0],
		style: style[2] != null ? style[2] : 'irc-' + style[0],
		key: style[1],
		keyregex: new RegExp(escaped + '(.*?)(' + escaped + '|$)')
	};
});

//http://www.mirc.com/colors.html
let colors = [
	'white', 'black', 'navy', 'green', 'red', 'brown',
	'purple', 'olive', 'yellow', 'lightgreen', 'teal',
	'cyan', 'blue', 'pink', 'gray', 'lightgrey'
].reduce(function(memo, name, index) {
	memo[index] = {
		name: name,
		fore: 'irc-fg' + index,
		back: 'irc-bg' + index,
		key: index
	};
	return memo;
}, {});

function stylize(line) {
	// Recheck
	if (!styleCheck_Re.test(line)) return line;

	// split up by the irc style break character ^O
	if (line.indexOf(styleBreak) >= 0) {
		return line.split(styleBreak).map(stylize).join('');
	}

	var result = line;
	var parseArr = result.split(colourKey);
	var text, match, colour, background = '';
	for (var i = 0; i < parseArr.length; i++) {
		text = parseArr[i];
		match = text.match(back_re);
		colour = match && colors[+match[1]];
		if (!match || !colour) {
			// ^C (no colour) ending. Escape current colour and carry on
			background = '';
			continue;
		}
		// set the background colour
		// we don't overide the background local var to support nesting
		if (colors[+match[3]]) {
			background = ' ' + colors[+match[3]].back;
		}
		// update the parsed text result
		result = result.replace(colourKey + text,
			'<span class="{0}">{1}</span>'.format(colour.fore + background, text.slice(match[0].length)));
	}

	// Matching styles (italics/bold/underline)
	// if only colors were this easy...
	styles.forEach(function(style) {
		if (result.indexOf(style.key) < 0) return;
		result = result.replace(style.keyregex, function(match, text) {
			return '<span class="{0}">{1}</span>'.format(style.style, text);
		});
	});

	//replace the reminent colour terminations and be done with it
	return result.replace(colour_re, '');
}

module.exports = stylize;
