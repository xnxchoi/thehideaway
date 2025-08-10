import {ReactNode} from "react";
import {CachedReader} from "@/components/layouts/Profile/providers/CachedReader";

export default async function UserLayout({
	children,
}: {
	children: ReactNode;
}) {
	return <CachedReader>{children}</CachedReader>;
}
