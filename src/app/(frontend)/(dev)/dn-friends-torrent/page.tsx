import { PageClient } from "./page.client";

/**
 * /dev/dn-friends-torrent
 *
 * Isolated dev harness for <FriendsTorrent>. Mounts the component
 * against a full-bleed dark canvas with the real past-events photos
 * and a controls panel for tuning row speeds / scales / opacity /
 * dark overlay before the component is wired into the immersive view.
 *
 * Not linked from anywhere — visit directly.
 */
export default function Page() {
  return <PageClient />;
}
