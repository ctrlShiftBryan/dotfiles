The **ACE method** is a lightweight organizational pattern for **Obsidian** that’s meant to replace complicated PARA/Zettelkasten setups with something closer to a **personal operating system**. The core idea is that every note fits into one of **three durable contexts**, plus an **inbox**.

ACE = **Atlas · Calendar · Efforts**

And usually there’s also a **+ Inbox**.

---

# ACE Structure

```
/
+ Inbox
Atlas
Calendar
Efforts
```

## 1. + Inbox

Temporary capture.

- quick notes
- ideas
- links
- AI outputs
- random thoughts
- meeting notes

Nothing stays here long. You periodically **triage it into ACE**.

Example:

```
+ Inbox/
  2026-03-11 random idea.md
  podcast idea.md
  screenshot notes.md
```

---

## 2. Atlas (the map of your world)

**Stable areas of life.**
Things that **don’t end**.

Think **domains**.

Examples:

```
Atlas/
  Career/
  Dynasty Nerds/
  AI Tools/
  Family/
  Health/
  Baseball Coaching/
```

Atlas is basically your **knowledge base**.

Notes here are:

- evergreen
- reference material
- long-term thinking
- systems
- philosophy
- documentation

Example notes:

```
Atlas/Dynasty Nerds/Architecture ideas.md
Atlas/AI Tools/Claude Code notes.md
Atlas/Baseball/Hitting drills.md
```

---

## 3. Calendar (time-based notes)

Anything tied to **a specific date or time**.

Usually:

```
Calendar/
  Daily/
  Weekly/
  Monthly/
```

Examples:

```
Calendar/Daily/2026-03-11.md
Calendar/Weekly/2026-W11.md
```

Typical contents:

- daily journal
- quick notes
- tasks
- meetings
- reflections
- what happened today

Obsidian’s **Daily Notes plugin** works perfectly here.

---

## 4. Efforts (projects)

**Finite things you're working on.**

These have **starts and finishes**.

Examples:

```
Efforts/
  Dynasty GM 3.0
  Brain Frame
  Harry Travel Baseball
  AI Dev Talk
```

Inside an effort:

```
Efforts/Dynasty GM 3.0/
  Overview.md
  Tasks.md
  Ideas.md
  Architecture.md
```

When finished, you can:

- archive it
- or move relevant knowledge to **Atlas**

---

# How information flows

```
Capture → + Inbox

Then organize:

+ Inbox
   ↓
Atlas      (knowledge)
Calendar   (time)
Efforts    (projects)
```

The idea is **low friction capture, deliberate organization**.

---

# Why people like ACE

Compared to PARA:

| PARA      | ACE      |
| --------- | -------- |
| Projects  | Efforts  |
| Areas     | Atlas    |
| Resources | Atlas    |
| Archives  | implicit |
| —         | Calendar |

ACE advantages:

- **simpler mental model**
- emphasizes **time (Calendar)**
- emphasizes **domains (Atlas)**
- avoids the confusing **Areas vs Resources** distinction.

---

# Why it works well with Obsidian

Because Obsidian naturally supports:

- **daily notes** → Calendar
- **linking knowledge** → Atlas
- **project folders** → Efforts
- **quick capture** → Inbox

So the structure stays **very lightweight**.

---

# One tweak I see engineers do (you might like this)

Add a **Systems layer inside Atlas**.

Example:

```
Atlas/
  Systems/
      AI Workflow.md
      Personal Knowledge System.md
  Dynasty Nerds/
  Career/
```

Because engineers tend to build **meta-systems**.

---

# One more trick (power users)

Use **tags for state**, not folders.

Example:

```
#idea
#draft
#active
#waiting
```

So a note can live in **Atlas** but still be `#active`.
