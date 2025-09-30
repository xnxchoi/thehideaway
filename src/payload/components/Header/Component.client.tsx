"use client";

import type { Header } from "@/payload-types";

import { InitiateHeader } from "@/payload/components/Header/InitiateHeader";
import dynamic from "next/dynamic";

interface HeaderClientProps {
  header: Header;
}
const HeaderWrapper = dynamic(
  () => import("./HeaderClient").then((r) => r.HeaderClient),
  { ssr: false }
);
export const HeaderClient: React.FC<HeaderClientProps> = (props) => {
  const { header } = props;

  return (
    <HeaderWrapper>
      <InitiateHeader header={header} />
    </HeaderWrapper>
  );
};

// useEffect(() => {
//   const fetchTracks = async () => {
//     if ((tracks && tracks.length > 0) || (header.radio && typeof header.radio === "object")) {
//       const racks = header?.radio && (typeof header.radio === "object" && 'tracks' in header.radio) && header.radio.tracks || tracks
//       if (Array.isArray(racks)) {
//         const radioTracks: RP_Track[] = []
//         for (const r of racks) {
//           if (r && typeof r === "object") {
//             const { id, url } = r
//             if (!url) continue
//             const strt = await fetch(url, {
//               headers: {
//                 "Content-Type": "audio/ogg",
//               },
//             })
//             const webStream = strt.body
//             // Parse the metadata from the web stream
//             if (!webStream) continue
//             const metadata = await parseWebStream(webStream, 'audio/ogg')
//             console.log(metadata)
//             const { title, artist, album } = metadata.common || {}
//             if (!id || !title || !url || !artist) continue
//             radioTracks.push({
//               id,
//               title,
//               album: album || 'hideaway sessions',
//               url,
//               artist,
//             })
//           }
//         }
//         if (radioTracks.length > 0) {
//           console.log(radioTracks)
//           setTracks(radioTracks)
//         }
//       }
//     }
//   }
//   !tracks.length && fetchTracks()
// }, [header])
