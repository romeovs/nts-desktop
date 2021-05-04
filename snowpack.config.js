module.exports = {
	mount: {
		"src/client": {
			url: "/",
		},
	},
	plugins: ["@snowpack/plugin-react-refresh"],
	devOptions: {
		open: "none",
	},
	packageOptions: {
		external: ["electron"],
	},
	buildOptions: {
		out: "./dist/client",
	},
}
