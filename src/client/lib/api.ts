export type ChannelInfo = {
	name: string
	starts: Date
	ends: Date
	location: string
	image: string
}

export type Info = {
	channel1: ChannelInfo
	channel2: ChannelInfo
}

export async function live(): Promise<Info> {
	const resp = await fetch("https://www.nts.live/api/v2/live")
	const content = await resp.json()

	return {
		channel1: simplify(content.results[0]),
		channel2: simplify(content.results[1]),
	}
}

type Result = {
	now: {
		start_timestamp: string
		end_timestamp: string
		embeds: {
			details: {
				name: string
				location_long: string
				media: {
					background_large: string
				}
			}
		}
	}
}

function simplify(result: Result): ChannelInfo {
	const {
		now: {
			start_timestamp,
			end_timestamp,
			embeds: {
				details: {
					name,
					location_long,
					media: { background_large },
				},
			},
		},
	} = result

	return {
		name,
		location: location_long,
		image: background_large,
		starts: new Date(start_timestamp),
		ends: new Date(end_timestamp),
	}
}
