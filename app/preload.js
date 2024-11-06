const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
	once: function (...args) {
		return ipcRenderer.once(...args)
	},
	addListener: function (name, callback) {
		function handler(...args) {
			callback(...args)
		}

		ipcRenderer.addListener(name, handler)
		return () => ipcRenderer.removeListener(name, handler)
	},
	removeAllListeners: function (...args) {
		return ipcRenderer.removeAllListeners(...args)
	},
	send(...args) {
		return ipcRenderer.send(...args)
	},
	invoke(...args) {
		return ipcRenderer.invoke(...args)
	},
})
