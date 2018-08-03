function IsCharKeyword(char) {
	return /^[a-zA-Z]+$/.test(char) || char == '_';
}

function IsCharNumber(char) {
	var good = true;
	for (var i = 0; i < char.length; i++) {
		if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(char[i])) {
			// shhh
		} else {
			good = false;
		}
	}
	return good;
}

function IsCharSymbol(char) {
	return (
		   char == '}'
		|| char == '{'
		|| char == ')'
		|| char == '('
		|| char == ','
		|| char == '+'
		|| char == '-'
		|| char == '*'
		|| char == '/'
		|| char == '='
		|| char == ':'
		|| char == '!'
		|| char == '.'
		|| char == ';'
	);
}

class Token {
	constructor(name, val, raw) {
		this.name = name;
		this.value = val;
		this.raw = raw;
	}

	toString() {
		var rval = this.raw;
		if (rval == '\n') rval = '\\n';
		return `Token${this.name}('${rval}', ${this.value})`;
	}
}

Token.Number = class extends Token {
	constructor(raw) {
		super('Number', parseFloat(raw), raw);
	}
};

Token.String = class extends Token {
	constructor(raw) {
		super('String', raw, raw);
	}
};

Token.User = class extends Token {
	constructor(raw) {
		super('User', parseInt(raw), raw);
	}
}

Token.Channel = class extends Token {
	constructor(raw) {
		super('Channel', parseInt(raw), raw);
	}
}

Token.Group = class extends Token {
	constructor(raw) {
		super('Group', parseInt(raw), raw);
	}
}

Token.Keyword = class extends Token {
	constructor(raw) {
		super('Keyword', raw, raw);
	}
};

Token.Prefix = class extends Token {
	constructor(raw) {
		super('Prefix', raw, raw);
	}
}

Token.Symbol = class extends Token {
	constructor(raw) {
		var val = null;
		if (raw == '{') val = Token.Symbol.Open;
		if (raw == '}') val = Token.Symbol.Close;
		if (raw == '(') val = Token.Symbol.OpenEval;
		if (raw == ')') val = Token.Symbol.CloseEval;
		if (raw == ',') val = Token.Symbol.Comma;
		if (raw == '+') val = Token.Symbol.Add;
		if (raw == '-') val = Token.Symbol.Subtract;
		if (raw == '*') val = Token.Symbol.Multiply;
		if (raw == '/') val = Token.Symbol.Divide;
		if (raw == '=') val = Token.Symbol.Equals;
		if (raw == ':') val = Token.Symbol.Colon;
		if (raw == '!') val = Token.Symbol.Exclaim;
		if (raw == '.') val = Token.Symbol.Period;

		super('Symbol', val, raw);
	}

	static get Open()      { return 'open'; }
	static get Close()     { return 'close'; }
	static get OpenEval()  { return 'openeval'; }
	static get CloseEval() { return 'closeeval'; }
	static get Comma()     { return 'comma'; }
	static get Add()       { return 'add'; }
	static get Subtract()  { return 'subtract'; }
	static get Multiply()  { return 'multiply'; }
	static get Divide()    { return 'divide'; }
	static get Equals()    { return 'equals'; }
	static get Colon()     { return 'colon'; }
	static get Exclaim()   { return 'exclaim'; }
	static get Period()    { return 'period'; }
};

function ParseToTokens(raw, prefixes) {
	var tokens = [];
	var i = 0;

	raw = raw + ' ';

	prefixes.forEach(function(pref) {
		if (raw.startsWith(pref)) {
			raw = raw.slice(pref.length);
			tokens.push(new Token.Prefix(pref));
		}
	})

	while (i < raw.length) {
		var start_char = raw[i];
		var current = '';
		var type = '';

		if (IsCharSymbol(start_char)) {
			type = 'symbol';
			current = start_char;
		}

		if (start_char == '\"') {
			i++;
			type = 'string';
			while (raw[i] != '\"') {
				if (i > raw.length) { type = 'none'; break; }
				current += raw[i];
				i++;
			}
		}

		if (start_char == '\'') {
			i++;
			type = 'string';
			while (raw[i] != '\'') {
				if (i > raw.length) { type = 'none'; break; }
				current += raw[i];
				i++;
			}
		}

		if (start_char == '<') {
			if (raw.slice(i+1, i+3) == '@&') { type = 'group'; i++ }
			if (raw[i+1] == '@' || raw.slice(i+1, i+3) == '@!') { type = 'user'; i++ }
			if (raw[i+1] == '#') type = 'channel';

			i += 2;
			while (raw[i] != '>') {
				if (i > raw.length) { type = 'none'; break; }
				current += raw[i];
				i++;
			}
		}

		if (IsCharNumber(start_char)) {
			type = 'number';
			while (IsCharNumber(raw[i]) || raw[i] == '.') {
				if (i > raw.length) { type = 'none'; break; }
				current += raw[i];
				i++;
			}
			i--;
		}

		if (IsCharKeyword(start_char)) {
			type = 'keyword';
			while (IsCharKeyword(raw[i]) || IsCharNumber(raw[i])) {
				if (i > raw.length) { type = 'none'; break; }
				current += raw[i];
				i++;
			}
			i--;
		}

		if (type == 'string')  tokens.push(new Token.String(current));
		if (type == 'number')  tokens.push(new Token.Number(current));
		if (type == 'keyword') tokens.push(new Token.Keyword(current));
		if (type == 'symbol')  tokens.push(new Token.Symbol(current));
		if (type == 'prefix')  tokens.push(new Token.Prefix(current));
		if (type == 'user')    tokens.push(new Token.User(current));
		if (type == 'channel') tokens.push(new Token.Channel(current));
		if (type == 'group')   tokens.push(new Token.Group(current));

		i++;
	}

	for (var k = 0; k < tokens.length; k++) {
		var tok = tokens[k];
		var nxt = tokens[k+1];

		var c1 = tok instanceof Token.Symbol;
		var c2 = tok.value == Token.Symbol.Subtract;
		var c3 = nxt instanceof Token.Number;

		if (c1 && c2 && c3) {
			nxt.value *= -1;
			nxt.raw = tok.raw + nxt.raw;
			tokens.splice(k, 1);
		}
	}

	return tokens;
}

exports.ParseCommand = ParseToTokens;