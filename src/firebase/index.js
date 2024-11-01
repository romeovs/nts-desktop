const NTS = require("./mod")
const { collection, query, where, orderBy, limit, onSnapshot } = require("firebase/firestore")

function liveTracks(stream) {
	const store = NTS.firestore()
	const q = query(
		collection(store, "live_tracks"),
		where("stream_pathname", "==", stream),
		orderBy("start_time", "desc"),
		limit(10),
	)

	onSnapshot(
		q,
		function (snapshot) {
			const res = []
			snapshot.forEach(function (doc) {
				res.push(doc.data())
			})
			console.log("HERE", res)
		},
		function (error) {
			console.error(error)
		},
	)
}

const email = "romeovs@gmail.com"
const password = ""

async function main() {
	// set up firebase
	NTS._app()

	const creds = await NTS.signIn(email, password)

	liveTracks("/stream")
	liveTracks("/stream2")
}
main()
