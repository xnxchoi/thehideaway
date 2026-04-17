HideawayFM is an effort to streamline and stabilize the music playing functionality of The Hideaway, once and for all.

The current state of implementation is observable in src/stores/Radio/Radio.tsx (Zustand-based store implementation)
and @/providers/RadioProvider (a context wrapper component for Zustand stores).

I could never get the current code to work exactly as I expect; much of it is owed to the disorganized code
structure, and the lack of trimming - a lot of the code is either redundant, unused or incomplete.

# Objective

Create a clean, maintainable, performant and extensible implementation of a "Radio" component for the website.

# Concept and functionality

While the backend structure is no different from any other sites providing "audio streaming" functions, the frontend
does hit a niche - UX similar to that of "Internet Radios".

- I want to intentionally limit the user's range of control: a user can only play/pause - skipping, rewinding,
  rate-changing are all limited to a regular user / guest.
- To impart an authentic radio experience, the player component will randomly select an index, and track time to
  seek before it starts playing for the first time after loading.
- My head reference for this component is the 24 hour Internet Radio on hotelcostes.com - no control other than
  play/pause.
- What is in focus, tho, is the music itself- we would make the artist, track title and the album title clickable -
  which then would prompt a small, engaging, sleek popup/overlay displaying detailed info, every one of which has a
  "More on this artist" type of "click to find out more!" links for the artist, the album and the track.   
  in a
  way that
  entices
  the
  user to click and explore.
    - On a similar note - I've never been able to implement the function to have the browser display the actual album,
      artist name and track title instead of the page name in the "now playing info." This needs to be fixed.
- One critical aspect of implementation is crossfading and seamless playback. This requires preloading, cross-fading
  with meticulous timing (which should be a function); uninterrupted playback between navigations has never been a
  problem, but finding the right balance between continuity and 'annoying thing that won't shut up easily' for users
  is important- pending validation/research.
- One headache came from the bidirectional relationship between the website UI, the Howler API and the actual
  playing status. "I press a button to toggle between pause and play" - this requires the tracking of 1)  the "real"
  state; 2) the previous state; and 3) the "optimistic" state - where the update is interaction/UI driven and not
  always assuredly synced to accurately reflect the actual media control status. Note that the RadioProvider's
  context is used across a wide range of components, and not always for the same scope/reasons. It is also important
  to distinguish each consumer of the context in their intention - is it reactive? Or bidirectional?
- Another thing that needs work: support flexible source swapping beteween Payload and manual. The original
  code was implemented with hard-coded values; while the end goal is indeed to fetch the values, I feel that being
  able to
  feed
  hardcoded
  values would
  immensely
  streamline
  the dev process; otherwise every new instance of a dev environment requires seeding and wiring the Track, Playlist,
  Album docs in order to just not break anything.
