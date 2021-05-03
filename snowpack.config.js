module.exports = {
	mount: {
		src: {
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
