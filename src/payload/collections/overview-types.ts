import {ImageCollectionOverview} from "@/components/UX/Media/types";
import {DeltaOverviewSelect} from "@/payload/collections/Delta/api/queryDeltaOverview";
import {PostOverviewSelect} from "@/payload/collections/Posts/api/queryBase";
import {ProfileOverview, ProfileOverviewSelect} from "@/payload/collections/Profile";
import {DeltaOverview} from "@/types/collections/delta";
import {ImageCollectionOverviewSelect} from "@/types/collections/image-collections";
import {
	CategoryOverview,
	CategoryOverviewSelect,
	TagOverview,
	TagOverviewSelect
} from "@/types/collections/meta-collections";
import {PostOverview} from "@/types/collections/posts";
import {UserOverview, UserOverviewSelect} from "@/types/collections/users";

export type OverviewMap = {
	"posts": PostOverview;
	"delta": DeltaOverview;
	"users": UserOverview;
	"categories": CategoryOverview;
	"tags": TagOverview;
	"userMedia": ImageCollectionOverview<"userMedia">
	"media": ImageCollectionOverview<"media">
	"assets": ImageCollectionOverview<"assets">
	"profile": ProfileOverview
}
export type OverviewSelectMap = {
	"posts": PostOverviewSelect;
	"delta": DeltaOverviewSelect;
	"users": UserOverviewSelect;
	"categories": CategoryOverviewSelect;
	"tags": TagOverviewSelect;
	"userMedia": ImageCollectionOverviewSelect
	"media": ImageCollectionOverviewSelect
	"assets": ImageCollectionOverviewSelect
	"profile": ProfileOverviewSelect
}
export type SelectOverview<T extends keyof OverviewSelectMap> = OverviewSelectMap[T];
export type OverviewOf<T extends keyof OverviewSelectMap> = SelectOverview<T>