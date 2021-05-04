module.exports = {
	mount: {
		"src/client": {
			url: "/",
		},
	},
	plugins: ["@snowpack/plugin-react-refresh", "@snowpack/plugin-webpack"],
	devOptions: {
		open: "none",
	},
	packageOptions: {
		external: ["electron"],
	},
	buildOptions: {
		out: "./dist/client",
	},
	optimize: {
		target: "es2017",
	},
}
