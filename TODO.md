- display show changes in tracklist?

firebase collections:
- episodes
- shows
- top space from pressing buttons

Use episodes collection to get next episode

	const qry = query(
		collection(store, "episodes"),
		where("broadcast_date", ">=", new Date()),
		orderBy("broadcast_date", "asc"),
		limit(2),
	)


- fix slider

- allow rewinding of ~30s?
