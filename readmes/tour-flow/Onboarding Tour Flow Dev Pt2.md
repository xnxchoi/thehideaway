# Onboarding Tour Flow Developmnent, Pt.2
Read below, and get to work. I will be sleeping so I won’t be able to respond to prompts. Plan out, self-review once and validate, if valid then go onto implementation per-step. Do this effieicently in a way that minimizes per- consumption volume.

Repeat until you reach the quota.

> Output from the pt.1 prompt has given us a start. Let’s continue developing on this idea.
> Note: Feedback is grouped into cascading levels of scope, ordered from the most generally applicable to most narrow.

## 0. Overall

1. Let’s divide the flow further into overlay vs. focused content.
    1. Overlay is as previously defined.
    2. Focused content: it’s presented as a standalone content. This could mean a dedicated page, or an overlay that completely blocks out the backdrop -doesn’t matter which as long as the “audience” is presented with the intended visual experience.
2. The two tours are now separate in presentation:
    1. Registration - focused content.
    2. Interface - overlay.
3. Both of the tours have rather lacking triggers:
    1. User is given no indication to how & where the tours are triggered
        1. There needs to be an indicator for the tours themselves.

## I.  Interface: Overlay Tour

1. Strategy of how to present the information that : 1) this “overlay tour” exists; 2) it can be accessed via some interaction; 3) this interaction is … well, whatever it turns out to be; and more… Needs more work.
2. The trigger’s method of interaction needs to be reconsidered
    1. Interface tour trigger needs to be easily “found”, but shouldn’t be persistently present either
        1. I don’t want “help” button to be persistently taking up the screenspace, but I need it to be “conditionally shown”
            1. Make it a subtle entry in a popup list maybe? Not sure- needs thinking from UX  perspective in terms of best practices
    2. Keyboard inputs.. not bad, but this means mobile users can’t access this
3. First thing is to show users logging in for the first time a “gentle nudging” - a non-blocking, small popup or something- that tells them that we can give them a quick 10-second* tour of where everything is; when dismissed, we can show them a gentler “highlight” of the location of the tour trigger and say something along the lines of “the hint screen is always accessible here”
    1. *(or whatever time that is relatively accurate & short enough to get most ppl to say “that’s short enough to look..” and willingly take the tour)

## II. Registration: Focus Tour

1. What more information we need from the user needs better handling
    1. right now it’s just firstname lastname
    2. We should just take fields in User doc type that *are* supposed to be user-editable (a lot of them are not), and create a unified form.
        1. This can be inferred via how each field’s access control and admin options are configured. If the field, given a non-admin user, is not editable (”readOnly” :true), hidden from admin panel, or outright not rendered, it’s not meant to be handled by users.
    3. Depending on the method of registration, a varying number of these fields would have been populated with values from the provider (Google, for example, fills out last name, first name, name, username…)
        1. We can, depending on the field, give users the option to overwrite the field value with their own entry.
2. Flow- we divide the fields from step 1, based on two criteria: 1) required vs. optional; 2) level of detail.
    1. All required information should come first, and then we can structure out the flow for the rest as we see fit- to group fields that are more “basic” (single-line, etc.);   while giving the more detail-oriented fields more space of their own  .
    2. The key objective here is to minimize the time users are bound to this page.
        1. so get the required and the easily fill-out-able forms out first, then we let users choose whether to spend more time on the “details” or just get started immediately.
3. Given the flow above, we need to differentiate how we handle the “mid-exit”.
    1. We need the browser-level “work will not be saved” notification for both, but how we accompany this differs:
        1. If exit occurs in “required” section → stronger warning:e.g. “you will need to start over! You cannot use your account until this step is complete”
        2. If exit occurs after required info has been provided - (assuming we pre-save pretty regularly to ensure user input is saved) “Save this?”
4. Reference
    1. website ma sai gon ([https://masaigon.space/](https://masaigon.space/en)) has a “write a letter” section that is a multi-step form.
       - I consider this a major point of inspiration in terms of animations- both the presentation of each step and the transition between steps.
   2. I would have provided, along with the prompt to read this markdown, an upload of a folder containing JS&CSS of relevant code from said website. Carefully study this and pick&choose the bits that are relevant to the project, and implement them into the project in a way that fits our style, both aesthetically and programmatically.
      - I do NOT want the cursor-move-activated 3d tilting effects, though. Also just ignore anything webgl-related too.
      - Basic context is that the website is a Nuxt-based SPA.