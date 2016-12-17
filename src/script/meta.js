const metafunctions = {
	hexcolor: {regex: /#([A-F0-9]{3}([A-F0-9]{3})?)\b/gi, replacer: (function (line, regxp) {
		return line.replace(regxp, (color) => {
			return '<span class="color_preview">' + color +
				'<div class="little_icon" style="background-color: "' + color + ';">&nbsp;</div></span>';
		});
	})}
};

module.exports = {

};
