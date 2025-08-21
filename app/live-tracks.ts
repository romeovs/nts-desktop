import { type IpcMainInvokeEvent, type WebContents, ipcMain } from "electron"
import { type FirebaseOptions, initializeApp } from "firebase/app"
import {
	type UserCredential,
	getAuth,
	signInWithEmailAndPassword,
} from "firebase/auth"
import {
	type DocumentData,
	type QuerySnapshot,
	collection,
	getDocs,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"

import { type Stream, pathnameToStream, streamToPathname } from "~/lib/stream"

import * as credentials from "./credentials"

const LIMIT = 15

// @ts-expect-error
const config: FirebaseOptions = FIREBASE_CONFIG

const app = initializeApp(config)
const auth = getAuth(app)
const store = getFirestore(app)

export type LiveTrack = {
	title: string
	stream: Stream | null
	artists: string[]
	startTime: Date
}

type Handler = (err: Error | null, res: LiveTrack[] | null) => void

async function liveTracks(stream: 1 | 2, fn: Handler): Promise<() => void> {
	const qry = query(
		collection(store, "live_tracks"),
		where("stream_pathname", "==", streamToPathname(stream)),
		orderBy("start_time", "desc"),
		limit(LIMIT),
	)

	function handleSnapshot(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
		const res: LiveTrack[] = []
		// biome-ignore lint/complexity/noForEach: we can't use for of here
		snapshot.forEach(function (doc) {
			const data = doc.data()
			res.push({
				title: data.song_title,
				artists: data.artist_names,
				stream: pathnameToStream(data.stream_pathname),
				startTime: data.start_time.toDate(),
			})
		})
		fn(null, res)
	}

	function handleError(err: Error) {
		fn(err, null)
	}

	return onSnapshot(qry, handleSnapshot, handleError)
}

export class NTSLiveTracks {
	webContents: WebContents

	promises: { [creds: string]: Promise<UserCredential> } = {}
	unsubscribe: null | (() => void)
	previous: {
		stream1: LiveTrack[]
		stream2: LiveTrack[]
	}

	creds: any | null

	constructor(webContents: WebContents) {
		this.webContents = webContents
		this.unsubscribe = null
		this.previous = {
			stream1: [],
			stream2: [],
		}

		ipcMain.handle("login-credentials", this._handleLogin.bind(this))
	}

	async init() {
		this.creds = await credentials.read()
		if (!this.creds) {
			return
		}

		await this._auth()
	}

	async logout() {
		this.unsubscribe?.()
		this.creds = null
		await credentials.clear()
	}

	async subscribe() {
		const strm1 = await liveTracks(1, (err, res) => {
			if (err) {
				console.warn(err)
				return
			}
			if (!res) {
				return
			}

			this.webContents.send("live-tracks-1", res)
			this.previous.stream1 = res
		})

		const strm2 = await liveTracks(2, (err, res) => {
			if (err) {
				console.warn(err)
				return
			}
			if (!res) {
				return
			}

			this.previous.stream2 = res
			this.webContents.send("live-tracks-2", res)
		})

		this.unsubscribe = () => {
			this.unsubscribe = null
			strm1()
			strm2()
		}
	}

	async sync() {
		this.webContents.send("live-tracks-1", this.previous.stream1)
		this.webContents.send("live-tracks-2", this.previous.stream2)
	}

	async _auth() {
		await this._login(this.creds.email, this.creds.password)
	}

	async _login(email: string, password: string) {
		const key = `${email}:${password}`
		if (!this.promises[key]) {
			this.promises[key] = signInWithEmailAndPassword(auth, email, password)
		}

		return this.promises[key]
	}

	async _handleLogin(
		_evt: IpcMainInvokeEvent,
		data: { email: string; password: string },
	) {
		const { email, password } = data

		try {
			await this._login(email, password)
			await credentials.write({ email, password })
			this.subscribe()
			return true
		} catch (err) {
			if (err instanceof Error) {
				throw err
			}
			throw new Error("could not log in")
		}
	}
}
