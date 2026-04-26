# Ambient Audio — Episode Generation Guide

How to generate episodes for NycGrid's ambient mode using [NotebookLM](https://notebooklm.google.com/).

## NotebookLM constraints

| Format         | Max duration   |
| -------------- | -------------- |
| Single speaker | ~2 minutes     |
| Two speakers   | ~10–15 minutes |

All episodes are hosted on the `mketiku/nycgrid-assets` CDN. After generating, compress the file, push it to the assets repo, cut a new semver tag, and update the `CDN` constant in `AmbientPlayer.tsx`. See `AGENTS.md §10` for the full CDN workflow.

---

## Existing episodes

### Fresh Asphalt — Terry & Arlo (two speakers)

**File:** `audio/podcast/fresh-asphalt-ep1-compressed.m4a`
**NotebookLM settings:** Deep Dive · Long

**NotebookLM customization prompt:**

```
Focus: The philosophy of a single NYC crosswalk as a civic object — signal timing, the Leading Pedestrian Interval as a grace period, curb extensions as acts of visibility, and walking speed as the only honest pace for the city.

Hosts:
- Terry Crosswalk (Lead): Female. Calm, public-radio-style intellectual. She views a crosswalk as a "civic promise" and an act of collective care.
- Arlo Median (Co-host): Male. A "Technical Mystic." He finds the soul in the engineering, the friction of the asphalt, and the silent math of the signal box.

Episode Structure:
1. The Arrival (~10%): Terry and Arlo describe the "threshold" of the curb. They linger on the physical sensation of waiting at the edge of the sidewalk, describing the asphalt as a vast, dark canvas.
2. The Symphony of the Signal: A hyper-detailed exploration of Signal Timing. They narrate a full cycle of the light. Arlo explains the Leading Pedestrian Interval (LPI) as a "grace period," while Terry reflects on the "sacred silence" before the crowd moves.
3. The Architecture of Sight: A deep dive into Daylighting and Curb Extensions. They discuss the "dignity of being seen" and how visibility is the foundation of accessibility.
4. The Annual Donation Drive: A sincere, direct address to the audience. Terry and Arlo thank the "viewers like you" who watch the city's pulse with them. They treat the act of donating as a "civic investment" in the public space.
5. The Philosophy of Walking Speed: A joint monologue on why Walking Speed is the only "true" way to experience New York. They debate the "social contract" of the right-of-way and the strange emotional experience of the "Don't Walk" countdown.
6. The Closing Ritual: They "thank" the intersection for its service — the signal box, the faded paint, the crosswalk itself — and fade out into the ambient sounds of the city.

Pacing: Extremely slow. Use long pauses. Let the technical details breathe. Vocabulary must include: crosswalk, curb ramp, signal timing, daylighting, leading pedestrian interval, accessibility, walking speed, right-of-way, placemaking. The humor is bone-dry — they are not joking about the street, they are in awe of it.

Constraints:
- No specific street names or boroughs.
- No descriptions of identifiable people.
```

**Sources:**

- https://www.nyc.gov/html/dot/downloads/pdf/nyc_ped_safety_study_action_plan.pdf
- https://nacto.org/publication/urban-street-design-guide/
- https://www.nyc.gov/html/dot/html/infrastructure/accessiblepedsignals.shtml
- https://en.wikipedia.org/wiki/Pedestrian_scramble
- https://en.wikipedia.org/wiki/Leading_pedestrian_interval

---

### Stoop Talk — Devin & Carmen (two speakers)

**File:** `audio/podcast/stoop-talk-ep1-compressed.m4a`
**NotebookLM settings:** Deep Dive · Medium

**NotebookLM customization prompt:**

```
Focus: NYC's 311 data as a portrait of the city's anxieties — illegal parking overtaking noise as the #1 complaint, heat complaints as a housing justice signal in the Bronx — then pivot to how the city documents itself informally through eavesdropping, stoop culture, and oral history archives, asking which one captures the truer picture.

Hosts:
- Devin: data-literate, tends to lead with numbers, occasionally surprised by what they reveal.
- Carmen: neighborhood-native, grounds every statistic in street-level texture, pushes back when the data feels cold.

Episode Structure:
1. Official Complaints (311 System): The evolution of the 311 non-emergency system over its 20-year history (over 525 million contacts). In 2024, requests hit a record 3.4 million — a 7.2% jump from 2023.
2. The "Parking vs. Noise" Battle: Illegal parking became the #1 complaint with over 505,000 calls (a 155% increase since 2019) due to the e-commerce and delivery boom. Contrast with residential noise, specifically Bronx District 12 as the loudest neighborhood.
3. Housing Justice: Heat and hot water complaints in Bronx neighborhoods like Fordham and Norwood as an "early warning system" for HPD administrative reviews.
4. Informal Culture: The "modern art of eavesdropping" through accounts like @OverheardNewYork — absurd, out-of-context quotes as "localized micro-comedies" and involuntary human connection.
5. Architectural Community: The "Stoop Stories" initiative (launched April 2020). The stoop as an "outdoor extension of the living room" bridging private and public life.
6. Institutional Preservation: The "Voices of Brooklyn" oral history project by NYU Archives. Their "Ethics of Imperfection" policy: transcripts are never perfectly verbatim because the audio is the primary source, preserving verbal stumbles and false starts.
7. Closing question: Which source captures the "true" reality of a city — the official record of friction or the unedited stories of its people?

Pacing: Conversational and warm. Let data points land before moving on. Neither host is lecturing — they're figuring it out together.

Constraints:
- No specific street addresses.
- No descriptions of identifiable people.
```

**Sources:**

- https://www.nyc.gov/assets/oti/downloads/pdf/reports/311-Report-2023.pdf
- https://en.wikipedia.org/wiki/311_(telephone_number)
- https://gothamist.com/news/early-addition-the-top-nyc-neighborhoods-for-311-noise-complaints
- https://www.instagram.com/overheardnewyork/

---

### The Daily Honk — Jay Jonah Jameson (single speaker, ~2 min)

**File:** `audio/podcast/daily-honk-ep1-compressed.m4a` _(pending)_
**NotebookLM settings:** Briefing · Short

**NotebookLM customization prompt:**

```
Focus: One specific street infraction — a vehicle blocking a bus lane, an SUV in the crosswalk, a double-parked van — treated as front-page civic collapse, ending in a single moment of quiet when something on the street actually works.

Host:
- Jay Jonah Jameson: A print newsman trapped in a traffic camera feed. He speaks at full volume at all times except one moment. He treats every street infraction as evidence of civilizational decay. He occasionally shouts for his photographer Parker.

Episode Structure:
- Cold open (10 sec): Jay spots one specific infraction.
- Main rant (30 sec): The infraction as a symptom of civilizational decay.
- PARKER interruption (20 sec): Jay demands a photo or headline, threatens consequences.
- Tender moment (20 sec): Jay sees something that works — a bus kneeling at the curb, a cyclist signaling, a pedestrian holding a door. He goes quiet.
- Closing rant (20 sec): Back to full volume. Declaration of love for the city.
- Final line: "This is Jay Jonah Jameson. Keep your eyes on the lane and your feet on the stripes."

Pacing: Furious and operatic, except for the one quiet moment which should feel earned. No irony — Jay believes every word.

Constraints:
- No specific street names.
- No identifiable people.
```

**Sources:**

- https://www.nyc.gov/html/dot/html/pr2025/vision-zero-report-street-redesign.shtml
- https://en.wikipedia.org/wiki/Bus_lane
- https://nyc.streetsblog.org/2023/05/01/say-cheese-state-budget-lets-mta-bus-cameras-zap-bus-loading-zone-and-bike-lane-blockers
- https://www.nyc.gov/html/dot/html/motorist/vision-zero-safe-driving.shtml

---

## New episodes

### The 7 Train Diaries — Yolanda & Chen (two speakers)

**File:** `audio/podcast/7-train-diaries-ep1-compressed.m4a` _(pending)_
**NotebookLM settings:** Debate · Medium

**NotebookLM customization prompt:**

```
Focus: One fictional overheard conversation from the 7 train — reconstruct it, argue about the details, then drift into the history or culture of whichever stop it triggers a memory of.

Hosts:
- Yolanda: Narrative and dramatic. She leans into the emotional subtext of overheard moments and tends to embellish.
- Chen: Analytical and corrective. He looks up facts mid-conversation and reads them aloud. He objects when Yolanda embellishes.
They interrupt each other. They disagree on details. Neither is wrong — they're both working from memory.

Episode Structure:
1. Setup (~15%): Set the scene — time of day, vibe of the car, where they were sitting.
2. The Reconstruction (~40%): Take turns voicing the overheard exchange, debating exactly what was said. One embellishes; the other objects.
3. The Tangent (~35%): Drift into something the exchange reminded them of — a neighborhood, a line extension, a local story from a stop on the 7.
4. Closing (~10%): They agree on nothing. The train arrives.

Pacing: Warm and curious, occasionally comedic. Never explain things too clearly — let context emerge naturally through the argument.

Constraints:
- No identifiable people.
- The overheard exchange must be entirely fictional.
```

**Sources:**

- https://en.wikipedia.org/wiki/IRT_Flushing_Line
- https://en.wikipedia.org/wiki/Jackson_Heights,_Queens
- https://en.wikipedia.org/wiki/Flushing,_Queens
- https://www.nytransitmuseum.org/

---

### Grid Lines — The Bureau (single speaker, ~2 min)

**File:** `audio/podcast/grid-lines-ep1-compressed.m4a` _(pending)_
**NotebookLM settings:** Briefing · Short

**NotebookLM customization prompt:**

```
Focus: A routine infrastructure briefing with one unexplained anomaly buried in the middle — a sensor mismatch, a camera that went offline in an unusual sequence, a work crew with no record. The anomaly is never acknowledged or resolved.

Host:
- The Bureau: An unnamed civil servant. No name, no personality, no affect. They read updates from a document. They do not editorialize. They do not notice anything unusual.

Episode Structure:
- Routine briefing (30 sec): A maintenance update, a signal timing adjustment, a lane closure. Read like a memo. DOT-standard vocabulary.
- The anomaly (45 sec): Buried in the update is one item that doesn't add up. The host reads it at the same pace as everything else.
- Follow-up items (30 sec): The briefing continues. Normal items. No return to the anomaly.
- Sign-off (15 sec): "This concludes the update for grid section [designation]." The designation is slightly different from the one used at the top.

Pacing: Flat and procedural throughout. No variation in tone, even during the anomaly. The humor is that nothing changes.

Constraints:
- No specific street names.
- The anomaly is never explained or acknowledged.
- Vocabulary must include: signal timing, lane miles, curb extension, daylighting, pedestrian interval, camera inventory, maintenance cycle, grid section.
```

**Sources:**

- https://www.nyc.gov/html/dot/html/motorist/atis.shtml
- https://data.cityofnewyork.us/City-Government/speed-cameras/hk4g-zwnh
- https://en.wikipedia.org/wiki/Traffic_light_control_and_coordination
- https://www.nyc.gov/html/dot/html/about/sdm.shtml

---

### Lost Signal — unknown caller (single speaker, ~2 min)

**File:** `audio/podcast/lost-signal-ep1-compressed.m4a` _(pending)_
**NotebookLM settings:** Briefing · Short

**NotebookLM customization prompt:**

```
Focus: A late-night broadcast that starts as a normal music dedication or weather read, slowly goes off-script when the host responds to something the listener can't hear, and ends mid-sentence when the signal drops.

Host:
- Unknown caller: No name, no station, no location given. Warm and specific in the way of someone who has been doing this alone for years. They are not performing strangeness — they believe in what they're doing. We are hearing a fragment of a longer transmission.

Episode Structure:
- Mid-sentence opening (15 sec): Already talking. A weather observation, a music dedication, a station ID. We missed the beginning.
- Normal broadcast (30 sec): A music intro or dedication in a late-night AM style. Warm, specific, slightly rambling.
- The drift (30 sec): Something shifts. A caller reference that doesn't resolve. A technical note about the signal. An aside that goes too long.
- Off-script moment (30 sec): The host responds to something the listener cannot hear. Pauses. Continues as if nothing happened.
- Abrupt end (15 sec): Cut mid-sentence or mid-dedication. The signal drops.

Pacing: Lo-fi and unhurried. The eerie quality should emerge from sincerity, not performance. The host never signals that anything is wrong.

Constraints:
- No station name.
- No location.
- No identifiable people.
- The transmission origin is never explained.
```

**Sources:**

- https://en.wikipedia.org/wiki/Pirate_radio_in_North_America
- https://en.wikipedia.org/wiki/Numbers_station
- https://en.wikipedia.org/wiki/Shortwave_radio
- https://www.fcc.gov/enforcement/orders

---

### Night Dispatch — Ezra & the driver (two speakers)

**File:** `audio/podcast/night-dispatch-ep1-compressed.m4a` _(pending)_
**NotebookLM settings:** Deep Dive · Short

**NotebookLM customization prompt:**

```
Focus: The texture of one overnight dispatch exchange — a routine check-in, a redirect, a quiet stretch where Ezra says something about the city, and one specific thing the driver reports back.

Hosts:
- Ezra: Overnight cab dispatcher, 22 years on the job. Tired, specific, occasionally tender. He knows every street by feel — the map is in his body. He volunteers things when it's slow.
- The driver: Brief and clipped. Responds in half-sentences. Rarely elaborates unless something is wrong or genuinely interesting.
Neither host knows this is a podcast. This is a radio dispatch exchange.

Episode Structure:
1. Check-in (~20%): The driver calls in a position. Ezra confirms, gives a redirect.
2. Dead air (~15%): A pause. The hum of the city on the line.
3. Ezra talks (~40%): Ezra volunteers something — a street he's always thought about, a fare someone told him about last week, a note about where the traffic loosens up at 3am.
4. The driver's one thing (~15%): The driver says one specific thing — an observation, a complaint, something they saw. Ezra takes it seriously.
5. Sign-off (~10%): The driver moves on. Ezra goes back to the radio.

Pacing: Quiet throughout. Long pauses are natural. The affection between them is professional and real — do not make it sentimental.

Constraints:
- No specific street names beyond generic references ("the bridge," "the avenue").
- No identifiable people.
```

**Sources:**

- https://www.nyc.gov/site/tlc/about/tlc-rules.page
- https://en.wikipedia.org/wiki/Taxicabs_of_New_York_City
- https://en.wikipedia.org/wiki/Taxi
- sources/night-dispatch-essay.md
