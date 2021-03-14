export default {
	
	json: (jsonStr) => {
		try {
			JSON.parse(jsonStr);
		} catch (e) {
			return false;
		}
		return true;
	},
				
	source: (obj) => {
		const cards = obj.cards;
		delete obj.cards;

		const result = Object.keys(obj).filter(key => ['title', 'author'].includes(key)).reduce((arr, key) => {
			arr[key] = obj[key];
			return arr;
		}, {})

		result.cards = cards.map(card => {
			const keys = Object.keys(card);
			const req = ['subtitle', 'title'];
			const opt = {
				'description': '',
				'cost': [ '', 'Free Action' ],
				'duration': [ '', 'Instantaneous' ],
				'include': true
			}

			if(req.every(i => keys.includes(i))) {
				const res = keys.filter(key => req.includes(key) || Object.keys(opt).includes(key)).reduce((acc, cur, i, arr) => {
					if((cur === 'cost' || cur === 'duration') && !Array.isArray(card[cur])) {
						arr.splice(1)
						return false;
					}
					acc[cur] = card[cur];
					return acc;
				}, {});
				
				if(res) Object.keys(opt).forEach(o => {
					if(!keys.includes(o)) res[o] = opt[o];
				});
				
				res._id = randomID(16);
				res.owner = '';

				return res;
			}
			else return false;
		}).filter(card => card);

		return result;
	}
}