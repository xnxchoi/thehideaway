import {type Endpoint} from "payload";

import {ProviderManager} from "../classes/ProviderManager";
import {NextResponse} from "next/server";

export const externalProvider: Endpoint = {
	path: "/courier",
	method: "get",
	handler: async (req) => {
		const searchParams = req.searchParams;
		const url = searchParams.get("url");

		if (!url) {
			return new NextResponse("Missing image URL", {status: 400});
		}

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Accept: "image/*",
					"User-Agent": "Mozilla/5.0 (compatible; MyApp/1.0; +https://hideawayseoul.com)"
				}
			});
			if (!response.ok) throw new Error("Image fetch failed");

			const contentType = response.headers.get("content-type") || "application/octet-stream";
			const buffer = await response.arrayBuffer();
			return new NextResponse(buffer,
				{
					headers: {
						"Content-Type": contentType,
						"Cache-Control": "public, max-age=86400"
					}
				})
		} catch (error) {
			console.error(error);
			return new NextResponse("Error fetching image", {status: 500});
		}
	}
}
export const providers: Endpoint[] = [
  {
    path: "/providers",
    method: "get",
    handler: async (req) => {
      const access = await req.payload?.config?.custom?.providerAccess?.({
        req
      });

      if (!access) {
        return Response.json(
          { data: null, error: req.t("error:notAllowedToPerformAction") },
          { status: 403 }
        );
      }

      const providers = ProviderManager.getProviders();

      return Response.json({ data: providers, error: null });
    }
  },
  {
    path: "/providers/:provider/featured",
    method: "get",
    handler: async (req) => {
      const access = await req.payload?.config?.custom?.providerAccess?.({
        req
      });

      if (!access) {
        return Response.json(
          { data: null, error: req.t("error:notAllowedToPerformAction") },
          { status: 403 }
        );
      }

      const provider = ProviderManager.getProvider(
        req.routeParams?.provider as string | undefined
      );

      if (!provider) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotSupported" as any)
          },
          { status: 404 }
        );
      }

      if (!provider.isConfigured) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotConfigured" as any)
          },
          { status: 500 }
        );
      }

      const data = await provider.getFeatured();

      return Response.json({ data, error: null });
    }
  },
  {
    path: "/providers/:provider/search",
    method: "get",
    handler: async (req) => {
      const access = await req.payload?.config?.custom?.providerAccess?.({
        req
      });

      if (!access) {
        return Response.json(
          { data: null, error: req.t("error:notAllowedToPerformAction") },
          { status: 403 }
        );
      }

      const provider = ProviderManager.getProvider(
        req.routeParams?.provider as string | undefined
      );

      if (!provider) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotSupported" as any)
          },
          { status: 404 }
        );
      }

      if (!provider.isConfigured) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotConfigured" as any)
          },
          { status: 500 }
        );
      }

      const data = await provider.getSearch(
        req.query.query as string,
        req.query.page as number
      );

      return Response.json({ data, error: null });
    }
  },
  {
    path: "/providers/:provider/track-download",
    method: "get",
    handler: async (req) => {
      const access = await req.payload?.config?.custom?.providerAccess?.({
        req
      });

      if (!access) {
        return Response.json(
          { data: null, error: req.t("error:notAllowedToPerformAction") },
          { status: 403 }
        );
      }

      const provider = ProviderManager.getProvider(
        req.routeParams?.provider as string | undefined
      );

      if (!provider) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotSupported" as any)
          },
          { status: 404 }
        );
      }

      if (!provider.isConfigured) {
        return Response.json(
          {
            data: null,
            error: req.t("imageSearch:providerNotConfigured" as any)
          },
          { status: 500 }
        );
      }

      const data = await provider.trackDownload(req.query.url as string);

      return Response.json({ data, error: null });
    }
  }
];
