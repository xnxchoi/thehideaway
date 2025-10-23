import { randomNumber } from "@/utilities/randomNumber";
import { cache } from "react";
export const getFallbackFromUnsplash = async () => {
  const collection = await fetch(
    `https://api.unsplash.com/collections/${process.env.UNSPLASH_COLLECTION_ID}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    }
  );
  if (collection.ok) {
    const res = (await collection.json()) as {
      id: number;
      title: string;
      description: string;
      published_at: string;
      last_collected_at: string;
      updated_at: string;
      featured: boolean;
      total_photos: number;
      private: boolean;
      share_key: string;
      cover_photo: null;
      user: null;
      links: {
        self: string;
        html: string;
        photos: string;
      };
    };
    const count = res.total_photos;

    const targetIndex = (count > 1 && randomNumber(0, count - 1)) || count - 1;
    const targetPage = targetIndex + 1;

    const photoFetchRes = await fetch(
      `https://api.unsplash.com/collections/${process.env.UNSPLASH_COLLECTION_ID}/photos?page=${targetPage}&per_page=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    if (photoFetchRes.ok) {
      const photoRes = (await photoFetchRes.json()) as Array<{
        id: string;
        created_at: string;
        updated_at: string;
        width: number;
        height: number;
        color: string;
        blur_hash: string;
        likes: number;
        liked_by_user: boolean;
        description: string;
        user: {
          id: string;
          username: string;
          name: string;
          portfolio_url: string;
          bio: string;
          location: string;
          total_likes: number;
          total_photos: number;
          total_collections: number;
          instagram_username: string;
          twitter_username: string;
          profile_image: {
            small: string;
            medium: string;
            large: string;
          };
          links: {
            self: string;
            html: string;
            photos: string;
            likes: string;
            portfolio: string;
          };
        };
        current_user_collections: [
          // The *current user's* collections that this photo belongs to.
          {
            id: number;
            title: string;
            published_at: string;
            last_collected_at: string;
            updated_at: string;
            cover_photo: null;
            user: null;
          }
          // ... more collections
        ];
        urls: {
          raw: string;
          full: string;
          regular: string;
          small: string;
          thumb: string;
        };
        links: {
          self: string;
          html: string;
          download: string;
          download_location: string;
        };
      }>;
      const pic = photoRes[0];
      if (!pic) {
        return null;
      }
      return {
        sourceId: pic.id,
        url: pic.urls.full
      };
    }
  }
};
