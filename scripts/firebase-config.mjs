#!/usr/bin/env node
// Recovers the public Firebase web config that NTS ships in its own frontend
// bundle, so the live tracklist works without a checked-in secret.
//
// Upstream keeps this value in a git-crypt encrypted .env, which means nobody
// but the maintainer can build the app. The config is not a credential: Firebase
// web configs are public identifiers, served to every visitor of nts.live, and
// access is gated by Firestore rules plus the NTS Supporter login.

const HOME = "https://www.nts.live/"
const UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

async function get(url) {
	const resp = await fetch(url, { headers: { "user-agent": UA } })
	if (!resp.ok) {
		throw new Error(`${url} responded ${resp.status}`)
	}
	return resp.text()
}

async function main() {
	const home = await get(HOME)

	const script = home.match(/src="(\/js\/app\.min\.[^"]+\.js)"/)
	if (!script) {
		throw new Error("could not find the app bundle on nts.live")
	}

	const bundle = await get(new URL(script[1], HOME).href)

	// The bundle picks between a production and an integration project; the
	// production one lives on nts-ios-app.
	const config = bundle.match(
		/\{apiKey:"[^"]+",authDomain:"nts-ios-app\.firebaseapp\.com".*?measurementId:[^}]+\}/,
	)
	if (!config) {
		throw new Error("could not find the firebase config in the app bundle")
	}

	// Turn the minified object literal into JSON: quote the keys, drop the
	// `cond ? a : b` picks that select between web and app ids.
	const json = config[0]
		.replace(/([{,])([a-zA-Z][a-zA-Z0-9_]*):/g, '$1"$2":')
		.replace(/:\s*[a-zA-Z_$][\w$]*\s*\?\s*("[^"]*")\s*:\s*"[^"]*"/g, ": $1")

	const parsed = JSON.parse(json)
	for (const key of ["apiKey", "projectId", "appId"]) {
		if (!parsed[key]) {
			throw new Error(`firebase config is missing ${key}`)
		}
	}

	process.stdout.write(`FIREBASE_CONFIG=${JSON.stringify(parsed)}\n`)
}

main().catch(function (err) {
	console.error(`firebase-config: ${err.message}`)
	process.exit(1)
})
