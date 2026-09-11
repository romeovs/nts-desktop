import {
	addDoc,
	collection,
	type DocumentData,
	deleteDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	where,
} from "firebase/firestore"

import { auth, store } from "./firebase"

export type Favourite = {
	show: string
	episode: string
}

// NTS keeps favourites in a Firestore collection rather than behind an API, and
// its own frontend writes documents of this shape. The reader on nts.live looks
// them up by device_id, which for a signed-in listener is the Firebase uid, so
// that field decides whether a favourite shows up in My NTS at all.
const COLLECTION = "favourites"

function document(fav: Favourite, uid: string): DocumentData {
	return {
		device_id: uid,
		client: "web",
		url: "https://www.nts.live/",
		version: "2.0.0",
		session: {
			campaign_id: null,
			campaign_type: null,
			campaign_source: null,
			ga_client_id: null,
			firebase_user_uid: uid,
			installation_id: null,
			user_agent: "NTSer",
			referrer: null,
			country: null,
			country_code2: null,
			subscription_status: null,
		},
		created_at: serverTimestamp(),
		show_alias: fav.show,
		episode_alias: fav.episode ?? "",
	}
}

function uid(): string {
	if (!store || !auth) {
		throw new Error("favourites are unavailable in this build")
	}

	const user = auth.currentUser
	if (!user) {
		throw new Error("sign in to NTS to save favourites")
	}

	return user.uid
}

export async function add(fav: Favourite): Promise<void> {
	if (!fav.show) {
		throw new Error("nothing to favourite yet")
	}

	const user = uid()
	if (!store) {
		throw new Error("favourites are unavailable in this build")
	}

	await addDoc(collection(store, COLLECTION), document(fav, user))
}

// Every document this account holds for a show. NTS writes one per save, so a
// show that was favourited twice has two, and unfavouriting has to clear them
// all or the heart lights straight back up.
async function documents(fav: Favourite) {
	if (!fav.show || !store || !auth?.currentUser) {
		return []
	}

	const qry = query(
		collection(store, COLLECTION),
		where("device_id", "==", auth.currentUser.uid),
		where("show_alias", "==", fav.show),
		limit(50),
	)

	const snapshot = await getDocs(qry)
	return snapshot.docs
}

// Used to show whether the current show is already saved, and to confirm after
// writing that the favourite really landed in the account.
export async function has(fav: Favourite): Promise<boolean> {
	const docs = await documents(fav)
	return docs.length > 0
}

export async function remove(fav: Favourite): Promise<void> {
	const docs = await documents(fav)
	await Promise.all(docs.map((doc) => deleteDoc(doc.ref)))
}

// Returns whether the show is saved afterwards, so the caller does not have to
// ask again.
export async function toggle(fav: Favourite): Promise<boolean> {
	if (await has(fav)) {
		await remove(fav)
		return false
	}

	await add(fav)
	return true
}

// How many favourited shows to put in front of the listener. Each one costs a
// request to resolve its latest episode, and the window only shows a handful.
const LIST_LIMIT = 24

export type Episode = {
	show: string
	episode: string
	name: string
	image: string
	date: string
	url: string
}

export async function list(): Promise<Episode[]> {
	if (!store || !auth?.currentUser) {
		return []
	}

	const qry = query(
		collection(store, COLLECTION),
		where("device_id", "==", auth.currentUser.uid),
		orderBy("created_at", "desc"),
		limit(200),
	)

	const snapshot = await getDocs(qry)

	// A show can be favourited more than once; keep the most recent entry only.
	const seen = new Set<string>()
	const shows: string[] = []
	for (const doc of snapshot.docs) {
		const alias = doc.data().show_alias
		if (!alias || seen.has(alias)) {
			continue
		}
		seen.add(alias)
		shows.push(alias)
	}

	const episodes = await Promise.all(
		shows.slice(0, LIST_LIMIT).map((show) => latest(show).catch(() => null)),
	)

	return episodes.filter((episode): episode is Episode => episode !== null)
}

type EpisodeData = {
	name: string
	broadcast: string
	show_alias: string
	episode_alias: string
	media: {
		picture_medium_large: string
		picture_large: string
	}
}

// A favourite names a show, not an episode, so the episodes have to be looked
// up separately - the most recent one to label the entry, more of them when
// someone wants to pick.
export async function episodes(
	show: string,
	offset: number,
	count: number,
): Promise<Episode[]> {
	const url = `https://www.nts.live/api/v2/shows/${encodeURIComponent(show)}/episodes?offset=${offset}&limit=${count}`

	const resp = await fetch(url, { signal: AbortSignal.timeout(10000) })
	if (!resp.ok) {
		return []
	}

	const content = await resp.json()
	const results: EpisodeData[] = content.results ?? []

	return results.map(function (episode) {
		return {
			show: episode.show_alias,
			episode: episode.episode_alias,
			name: episode.name,
			image: episode.media.picture_medium_large ?? episode.media.picture_large,
			date: episode.broadcast,
			url: `https://www.nts.live/shows/${episode.show_alias}/episodes/${episode.episode_alias}`,
		}
	})
}

async function latest(show: string): Promise<Episode | null> {
	const [episode] = await episodes(show, 0, 1)
	return episode ?? null
}
