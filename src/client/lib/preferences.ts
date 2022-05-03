export const preferences = read()

function read() {
	try {
		return JSON.parse(decodeURIComponent(location.search.substring(3)))
	} catch (err) {
		return { volume: 0.8 }
	}
}
