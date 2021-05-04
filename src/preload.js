const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
	on: function (...arguments) {
		return ipcRenderer.on(...arguments)
	},
})
