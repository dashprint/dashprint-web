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
		relXYZ: false, relE: false,

		feedrate: 1500,
		acceleration: 1500,
		retractAcceleration: 1500,
		maxFeedrate: [ 500, 500, 12, 120 ],
		maxAcceleration: [ 9000, 9000, 500, 10000 ],
		maxJerk: [ 10, 10, 0.4, 2.5 ],
		minFeedrate: 0,
		minTravelFeedrate: 0,
		extrudeFactor: 1,
		blocks: [] // G1s that haven't been processed by flushTime() yet
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

function parseValues(words) {
	var rv = {};

	for (let i = 1; i < words.length; i++) {
		let word = words[i].toUpperCase();
		let value = parseFloat(word.substr(1));
		rv[word[0]] = value;
	}

	return rv;
}

function flushTime(result, state) {

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
			let values = parseValues(words);

			if (values.X !== undefined)
				newX = (state.relXYZ ? newX : 0) + values.X;
			if (values.Y !== undefined)
				newY = (state.relXYZ ? newY : 0) + values.Y;
			if (values.Z !== undefined)
				newZ = (state.relXYZ ? newZ : 0) + values.Z;
			if (values.E !== undefined) {
				if (state.relE) {
					state.e += values.E;
					if (values.E > 0)
						doesExtrusion = true;
				} else if (!state.relE) {
					if (values.E > state.e)
						doesExtrusion = true;
					state.e = values.E;
				}
			}

			if (values.F !== undefined)
				state.feedrate = Math.max(state.minFeedrate, values.F / 60);

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
			state.relE = true;
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
		case "M203": {
			// Set max feedrate
			let values = parseValues(words);
			if (values.X !== undefined)
				state.maxFeedrate[0] = values.X;
			if (values.Y !== undefined)
				state.maxFeedrate[1] = values.Y;
			if (values.Z !== undefined)
				state.maxFeedrate[2] = values.Z;
			if (values.E !== undefined)
				state.maxFeedrate[3] = values.E;
			break;
		}
		case "M204": {
			let values = parseValues(words);

			if (values.S !== undefined) {
				state.acceleration = values.S;
				if (values.T !== undefined)
					state.retractAcceleration = values.T;
			} else {
				if (values.P !== undefined)
					state.acceleration = values.P;
				if (values.R !== undefined)
					state.retractAcceleration = values.R;
			}
			break;
		}
		case "M205": {
			let values = parseValues(words);

			// Set max jerk. If X is set, set it also for Y
			if (values.X !== undefined)
				state.maxJerk[0] = state.maxJerk[1] = values.X;
			if (values.Y !== undefined)
				state.maxJerk[1] = values.Y;
			if (values.Z !== undefined)
				state.maxJerk[2] = values.Z;
			if (values.E !== undefined)
				state.maxJerk[3] = values.E;
			if (values.S !== undefined)
				state.minFeedrate = values.S;
			if (values.T !== undefined)
				state.minTravelFeedrate = values.T;
			
			break;
		}
		case "M221": {
			let values = parseValues(words);

			if (values.S !== undefined && values.T === undefined)
				state.extrudeFactor = values.S / 100;
			break;
		}
		case "G4": {
			let values = parseValues(words);

			if (values.P !== undefined)
				result.estimatedTime += values.P / 1000;
			if (values.S !== undefined)
				result.estimatedTime += values.S;

			flushTime(result, state);
			break;
		}
	}
}

addEventListener('message', (message) => {
	analyzeGcode(message.data[0], message.data[1]);
});
