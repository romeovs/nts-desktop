# NTSer

A menubar player for [NTS Radio](https://www.nts.live) — both live channels and
the archive. Tauri, macOS.

A fork of [romeovs/nts-desktop](https://github.com/romeovs/nts-desktop) by Romeo
Van Snick, same MIT licence. Unofficial, not affiliated with NTS.

## What this fork changes

- Live playback works again — NTS moved its streams and the content policy still
  named the old host ([#31](https://github.com/romeovs/nts-desktop/issues/31),
  [#32](https://github.com/romeovs/nts-desktop/issues/32))
- Tracklist entries open in Apple Music
- Favourites live in the window: save what is on air, pick an episode, play it
- Pause moved to the show header, out from under the fold
- Load an archive show by pasting its link, not by picking a `.webloc` file
- No keychain prompt on every launch
- Builds from a fresh clone — the Firebase config used to be encrypted
- Current stack: Tauri 2, React 19, Vite 8, Biome 2

## Install

Take the `.dmg` from [releases](https://github.com/ghetoblues/ntser/releases)
and drag the app to Applications. It is unsigned, so the first launch is refused
— allow it under `System Settings > Privacy & Security`.

The player uses the system WebKit instead of shipping Chromium, so the install
is a couple of megabytes rather than a couple of hundred. The GitHub Release
disk image is universal (Intel and Apple Silicon).

## Use

| | |
|---|---|
| `←` `→` | move between channels and the archive |
| `space` | play and pause |
| `1` `2` | play a channel |
| `-` `+` | volume |
| `?` | shortcuts |
| `ctrl + N` | open the app |

The heart saves the show on air to your NTS favourites; the archive screen lists
what you saved. Paste a show link under **Load Archive Show…**, or open a
`.webloc` pointing at one. Click a track to copy it, or the note beside it to
open it in Apple Music.

The live tracklist needs an [NTS Supporter](https://www.nts.live/supporters)
account, signed in from the menu. Everything else works without one.

## Develop

```sh
make dev    # run it, renderer reloads on save
make check  # lint, format, types
make app    # bundle a .dmg into src-tauri/target/release/bundle/dmg
make help   # every rule
```

`src-tauri/` is the native shell, `client/` the UI, `app/` and `lib/` what they
share. UI changes take effect on save; Rust changes need a restart.

`NTS_DEV_PORT` moves Vite off 5173. `NTS_OPEN_SHOW` loads an episode at startup.

The live tracklist reads from NTS's Firebase project. That config is public, so
`scripts/firebase-config.mjs` recovers it from their frontend into `.env`, which
the build does whenever `.env` is missing. Signing in needs `NTS_EMAIL` and
`NTS_PASSWORD` in `.env` — development builds read those instead of the
keychain. See `.env.example`.

## Releasing

Bump the version, tag it, and push the tag. CI builds a universal `.dmg` and
publishes a GitHub Release.

```sh
make version VERSION=0.5.0
git tag v0.5.0
git push origin v0.5.0
```

## Thanks

To Romeo Van Snick for the app, and to
[tedigc](https://github.com/tedigc/nts-desktop-app) for the idea it came from.
