function ExecuteCommand(tree, cmd) {
	if (tree instanceof Array) {
		var data = [];

		for (var i = 0; i < tree.length; i++) {
			var tree_item = tree[i];
			var argument = cmd[i];

			if (tree_item.type == 'Final') {
				return {function: tree_item.function, args: data};
			}

			if (tree_item.type != argument.name) return 'ERROR';

			if (tree_item.hasOwnProperty('validate')) {
				if (!tree_item.validate(argument.value)) return 'ERROR';
			}

			if (argument == null) {
				if (!tree_item.required) {
					data.push(tree_item.default);
				}
			} else {
				data.push(argument.value);
			}
		}

	} else {
		if (cmd[0].name != 'Keyword') return 'ERROR';
		if (!(cmd[0].value in tree)) return 'ERROR';

		return ExecuteCommand(tree[cmd[0].value], cmd.slice(1));
	}
}

exports.GetExecutor = ExecuteCommand;