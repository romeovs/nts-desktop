const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
	on: function (...arguments) {
		return ipcRenderer.on(...arguments)
	},
	removeListener: function (...arguments) {
		return ipcRenderer.removeListener(...arguments)
	},
	removeAllListeners: function (...arguments) {
		return ipcRenderer.removeAllListeners(...arguments)
	},
})
