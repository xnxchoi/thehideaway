import { GuestsView } from "./GuestsView";
import type { GuestProfile } from "./types";

type Props = {
  guests: GuestProfile[];
  viewerId: string | null;
};

export function DayNNightGuests({ guests, viewerId }: Props) {
  return <GuestsView guests={guests} viewerId={viewerId} />;
}
