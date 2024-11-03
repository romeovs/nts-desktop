const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
	on: function (...args) {
		return ipcRenderer.on(...args)
	},
	removeListener: function (...args) {
		return ipcRenderer.removeListener(...args)
	},
	removeAllListeners: function (...args) {
		return ipcRenderer.removeAllListeners(...args)
	},
	send(...args) {
		return ipcRenderer.send(...args)
	},
})
