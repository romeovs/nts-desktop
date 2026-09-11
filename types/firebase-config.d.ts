// Injected at build time by the esbuild `--define` in the Makefile's `index`
// rule, from the public Firebase config in .env. Null when that config could
// not be recovered, in which case the live tracklist stays unavailable.
declare const FIREBASE_CONFIG: import("firebase/app").FirebaseOptions | null
