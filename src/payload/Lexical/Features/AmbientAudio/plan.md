# Objective
Create a feature for Lexical that provides capacity to play a background music, where the playing/stopping is each 
linked to a point in the editor's stored content, configurable via intuitive interface

# Idea sketch

- Essentially, this is a way to dynamically link the entry/exit of a "background music" to specific points of an 
  article, presenting an immersive experience.
- I'm imagining a flow that goes something like this:
  - Feature is toggleable in context menus that pop up with a right click
  - This is defined as a "block" that encases other (set list of) blocks. Its boundaries are defined by anchoring 
    nodes- 
    one each 
    for 
    beginning 
    and end
    - This Feature has a toggleable select mode.
      - While in select mode, we will be adding listeners for: if pc - keydown events for arrow keys, esc key, enter 
        key, command/ctrl+arrow key and more; if mobile- i don't know, long-presses, press-then-drag, touch... 
        whatever the right event listeners are for effectively delivering a good UX for text selection/navigation 
        without interrupting scrolling
      - We follow the caret. if the text isn't focused, then we calculate the node closest to the
        midpoint of the viewport, consider it "focused", set editor to focus & set the caret right after the
        "focused" node.
      - navigation differs by pc/mobile:
        - PC: arrow-based navigation while select mode is active; moving the cursor will enable hover-interactions 
          for nodes. Hovering on a non-focused node will show a popover "click to focus" or something- upon clicking,
          we move the caret to the clicked node and set it "focused".
        - Mobile: we just show a small indicator showing ""
    - When activated, we get 
      - 
      - The node selected to be an anchor node for this feature is decorated similarly to a highlighted node in 
        @/components/UX/Highlightr.
        - 
          - 
      - there is no explicit selection at the time of activation, we consider the entire 