# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [Unreleased]

# [0.5.1]

## Fixed

- The Dock and Finder icon is the macOS squircle instead of a sharp square.

# [0.5.0]

## Changed

- The Mac shell is Tauri 2 (system WebKit) instead of Electron. A release is a
  couple of megabytes rather than a couple of hundred. The React UI is the same.
- Archive shows are loaded by pasting a link or opening a `.webloc`; dropping a
  file onto the menu icon is gone with the Electron tray.

# [0.4.0]

First release of the [ghetoblues](https://github.com/ghetoblues/ntser)
fork.

## Fixed

- Live channels play again. NTS moved its streams to radiomast, and the content
  policy still named the old host, so every channel failed on play.
- The live tracklist no longer shows tracks from the previous show.
- The archive screen has a visible pause button; it used to sit below the fold.
- macOS no longer asks for keychain access on every launch.
- Live tracklist subscriptions no longer stack up each time the window opens.
- A failed sign-in is retried rather than disabling the tracklist until restart.
- The app builds from a fresh clone: the Firebase config it needs is recovered
  from nts.live instead of being encrypted in the repository.

## Added

- Tracklist entries open in Apple Music.
- Save the show on air to your NTS favourites, browse them in the window, and
  pick which episode to play.
- Load an archive show by pasting its link.
- An about panel naming the original author and the licence.

## Changed

- The Discord button and the live tracklist button are gone; both only led out
  of the app.
- The archive screen's corner button goes back to the favourites list.
- Current stack: Electron 44, React 19, Vite 8, Biome 2, Node 22.

# [0.2.1]

## Added

- Allow using up and down keys to change volume

# [0.2.0]

## Added

- Allow playing the new SoundCloud show format

# [0.0.15]

## Added

- Tracklist button now also shows on show page and scrolls the show down to
  reveal the tracklist

## Changed

- Keep the tracklist icon above left and right buttons

# [0.0.14]

## Added

- Add intrinsic volume controls (`-` and `+` keys)
- Add volume indicator
- Add preferences helper

# [0.0.13]

## Added

- Add `1` and `2` shortcuts

# [0.0.12]

## Added

- Ignore double click events in tray, making it more responsive to clicks
- Open window when the app activates
- Show channel in the menubar when it is playing
- Add `T` shortcut to open tracklist when window is open

# [0.0.11]

## Added

- Use a custom history file for archive shows.

## Changed

- Changed package name to `nts-desktop` to avoid conflict with
  `nts-desktop-player`
- Fetch archive show info in the shell instead of the client.
