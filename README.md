# NTS Desktop

A simple desktop app for NTS build in Electron.

## Usage

- Click the NTS logo in the menubar to open the player.
- Use the left and right buttons on the player to navigate between channels.
- Click the play/stop button on the live streams to play them.
- Drop the link from the browser to an archive show on the menubar icon to play
	it, `.webloc` files work too.
- On the archive screen, you can scroll down to reveal the controls and
	tracklist.
- Click on a tracklist item to copy the information.

![](./screens/play.gif)
![](./screens/archive.gif)

## Local Development
The project is structured as follows:
```
./
  src/
    main.ts     # The electron main file
    preload.js  # A setup file for the browser context
    client/     # The electron renderer files
      main.ts
      ...
```

To start the app in developement mode, run:
```
make dev
```
You can now start editing the renderer files, changes will automatically
take effect on save.

Note that changes to the main process (`src/main.ts` and `src/preload.js`)
require a restart to take effect.

To build the application run:
```
make build package
```
The app will now be in `bundle/mac-universal/NTS Desktop.app`.

## Acknowledgement

The main idea for the app came from the excellent
[nts-desktop-app](https://github.com/tedigc/nts-desktop-app), the implementation
of which is way simpler and more elegant, but lacks some of the features I
wanted.
