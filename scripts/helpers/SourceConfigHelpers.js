export const checkJSON = (jsonStr) => {
	try {
		JSON.parse(jsonStr);
	} catch (e) {
		return false;
	}
	return true;
}

export const csvToJson = (str, headerList, quotechar = '"', delimiter = ',') => {
	const cutlast = (_, i, a) => i < a.length - 1;
	// const regex = /(?:[\t ]?)+("+)?(.*?)\1(?:[\t ]?)+(?:,|$)/gm; // no variable chars
	const regex = new RegExp(`(?:[\\t ]?)+(${quotechar}+)?(.*?)\\1(?:[\\t ]?)+(?:${delimiter}|$)`, 'gm');
	const lines = str.split(/\r\n|\r|\n/g);
	const headers = headerList || lines.splice(0, 1)[0].match(regex).filter(cutlast).map((val, key, arr) => {
		let b = val.slice(-1) === ',' ? val.slice(0,-1) : val;
		if(b) return b.toLowerCase();
		else return arr[key - 1].toLowerCase().slice(0,-1);
	});
	const list = [];
	
	for (const line of lines) {
		const val = {};
		for (const [i, m] of [...line.matchAll(regex)].filter(cutlast).entries()) {
			switch (headers[i]) {
				case 'cost':
					if('cost' in val) {
						val.cost = [ val.cost, m[2]]
						break;
					}
				
				case 'duration':
					if('duration' in val) {
						val.duration = [ val.duration, m[2]]
						break;
					}
				
				default:
					val[headers[i]] = m[2];
					break;
			}
		}
		list.push(val);
	}
	return JSON.stringify(list);
}