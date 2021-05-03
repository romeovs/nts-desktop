module.exports = {
	mount: {
		"src/client": {
			url: "/",
		},
	},
	plugins: [],
	packageOptions: {
		external: ["electron"],
	},
	buildOptions: {
		out: "./dist/client",
	},
}
