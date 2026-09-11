export type Stream = 1 | 2

export function streamToPathname(stream: 1 | 2): string {
	if (stream === 1) {
		return "/stream"
	}
	if (stream === 2) {
		return "/stream2"
	}
	return "unknown"
}

export function pathnameToStream(pathname: string): 1 | 2 | null {
	if (pathname === "/stream") {
		return 1
	}
	if (pathname === "/stream2") {
		return 2
	}
	return null
}

// NTS redirects these to radiomast.io (streams.radiomast.io -> audio-edge-*.h.radiomast.io),
// so every host in that chain has to be allowed by the media-src CSP in index.html.
export const streams = {
	1: "https://stream-relay-geo.ntslive.net/stream?client=NTSWebApp",
	2: "https://stream-relay-geo.ntslive.net/stream2?client=NTSWebApp",
}
