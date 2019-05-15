function analyzeGcode(reqId, data) {
	var result = {
		layers: [],
		nozzleDiameter: 0.4,
		estimatedTime: 0
	};
	var state = {
		// Current absolute position
		x: 0, y: 0, z: 0, e: 0,
		// Last Z where extrusion took place
		lastPrintZ: -1,
		// Current relative/absolute position modes
		relXYZ: false, relE: false
	};
	var end, pos = 0;

	while ((end = data.indexOf("\n", pos)) !== -1) {
		var line = data.substring(pos, end);

		processGcodeLine(result, state, pos, line);
		pos = end+1;

		if (pos >= data.length)
			break;
	}

	if (pos < data.length)
		processGcodeLine(result, state, data.substr(pos));
	
	postMessage([reqId, result]);
}

function processGcodeLine(result, state, fileOffset, line) {
	// Slic3r
	if (line.startsWith("; nozzle_diameter = ")) {
		state.nozzleDiameter = parseFloat(line.substr(20));
	}
	var sep = line.indexOf(";");

	// Remove comments
	if (sep !== -1)
		line = line.substr(0, sep);
	line = line.trim();

	if (line.length === 0)
		return;

	var words = line.split(/\s+/);
	switch (words[0].toUpperCase()) {
		case "G0":
		case "G00":
		case "G01":
		case "G1": {
			// Movement
			let doesExtrusion = false;
			let newX = state.x, newY = state.y, newZ = state.z;

			for (let i = 1; i < words.length; i++) {
				let word = words[i].toUpperCase();
				let value = parseFloat(word.substr(1));

				if (word[0] === 'X')
					newX = (state.relXYZ ? newX : 0) + value;
				else if (word[0] === 'Y')
					newY = (state.relXYZ ? newY : 0) + value;
				else if (word[0] === 'Z')
					newZ = (state.relXYZ ? newZ : 0) + value;
				else if (word[0] === 'E') {
					if (state.relE) {
						state.e += value;
						if (value > 0)
							doesExtrusion = true;
					} else if (!state.relE) {
						if (value > state.e)
							doesExtrusion = true;
						state.e = value;
					}
				}
			}

			if (doesExtrusion) {
				if (newZ !== state.lastPrintZ) {
					// New layer
					result.layers.push({
						z: newZ,
						lines: [],
						gcodeOffsets: []
					});
					state.lastPrintZ = newZ;
				}

				if (state.x !== newX || state.y !== newY) {
					let curLayer = result.layers[result.layers.length-1];
					curLayer.lines.push([state.x, state.y, newX, newY]);
					curLayer.gcodeOffsets.push(fileOffset);
				}
			}
			// TODO: push non-extruding moves?

			state.x = newX;
			state.y = newY;
			state.z = newZ;
			break;
		}
		case "G90":
			// Absolute positioning for XYZ (default)
			state.relXYZ = false;
			break;
		case "G91":
			// Relative positioning for XYZ
			state.relXYZ = true;
			break;
		case "G92": {
			// Declare the current position as
			// TODO: What if a slicer issues G92s in the middle of a print?
			// We should probably do the right thing and display what would be printed.
			for (let i = 1; i < words.length; i++) {
				let word = words[i].toUpperCase();
				let value = parseFloat(word.substr(1));

				if (word[0] === 'X')
					state.x = value;
				else if (word[0] === 'Y')
					state.y = value;
				else if (word[0] === 'Z')
					state.z = value;
				else if (word[0] === 'E')
					state.e = value;
			}
			break;
		}
		case "M82":
			// Absolute positioning for E (default)
			state.relE = false;
			break;
		case "M83":
			// Relative positioning for E
			state.relE = true;
			break;
	}
}

addEventListener('message', (message) => {
	analyzeGcode(message.data[0], message.data[1]);
});
