import { readFileSync, writeFileSync } from "node:fs"

const version = process.argv[2]
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
	console.error("usage: node scripts/set-version.mjs 0.5.0")
	process.exit(1)
}

function replaceQuotedVersion(path, pattern) {
	const src = readFileSync(path, "utf8")
	if (!pattern.test(src)) {
		throw new Error(`could not find a version field in ${path}`)
	}
	const next = src.replace(pattern, `$1${version}$2`)
	if (next !== src) {
		writeFileSync(path, next)
	}
}

replaceQuotedVersion("package.json", /("version"\s*:\s*")\d+\.\d+\.\d+(")/)
replaceQuotedVersion(
	"src-tauri/tauri.conf.json",
	/("version"\s*:\s*")\d+\.\d+\.\d+(")/,
)
replaceQuotedVersion("src-tauri/Cargo.toml", /^(version = ")[^"]+(")/m)
replaceQuotedVersion("src-tauri/Cargo.lock", /(name = "ntser"\nversion = ")[^"]+(")/)

console.log(`version ${version}`)
