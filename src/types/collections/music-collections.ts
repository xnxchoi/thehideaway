import {Track} from "@payload-types";

export type TrackOverview = Pick<Track, "slug" | "track_number" | "artist" | "title"> & {
	album: string;
}
