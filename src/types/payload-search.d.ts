import {
  Album as AlbumType,
  Category as CategoryType,
  Delta as DeltaType,
  Playlist as PlaylistType,
  Post as PostType,
  Tag as TagType,
  Track as TrackType,
  User as UserType
} from "@/payload-types";

declare module "@/payload-types" {
  interface User extends UserType {
    search_vector?: string;
  }

  interface Post extends PostType {
    search_vector?: string;
  }

  interface Delta extends DeltaType {
    search_vector?: string;
  }

  interface Album extends AlbumType {
    search_vector?: string;
  }

  interface Track extends TrackType {
    search_vector?: string;
  }

  interface Playlist extends PlaylistType {
    search_vector?: string;
  }

  interface Category extends CategoryType {
    search_vector?: string;
  }

  interface Tag extends TagType {
    search_vector?: string;
  }
}
