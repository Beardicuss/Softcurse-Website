# Hero Image Configuration Guide

This document explains exactly which files to edit and what to change to control
the hero banner image on each detail page — position, visibility, size, and more.

---

## Which file controls which page

| Page URL | CSS File to Edit |
|---|---|
| `/lab/{tool}` — Lab tool pages | `src/pages/lab/AppDetail.module.css` |
| `/experiments/{id}` — Experiment pages | `src/pages/lab/ExperimentDetail.module.css` |
| `/studio/{game}` — Game pages | `src/pages/studio/GameDetail.module.css` |
| `/chronicles/{book}` — Chronicle/book pages | `src/pages/studio/ChronicleDetail.module.css` |

---

## The CSS blocks that control the hero

Inside each of the files above, find these two blocks:

### `.hero` — controls the banner container size and position

```css
.hero {
  position: relative;
  width: 100%;
  height: 65vh;          /* ← banner height as % of screen height */
  min-height: 400px;     /* ← minimum height in pixels */
  max-height: 650px;     /* ← maximum height in pixels */
  overflow: hidden;
  margin-top: var(--nav-h);  /* ← pushes banner below the fixed navbar (68px) */
}
```

### `.heroImg` — controls how the image fills the banner

```css
.heroImg {
  width: 100%;
  height: 100%;
  object-fit: cover;              /* ← how image fills the box */
  object-position: center center; /* ← which part of the image is visible */
  filter: brightness(0.65) saturate(1.1);  /* ← image darkness */
}
```

---

## Adjustments — copy and change the value

### Move hero DOWN (more space above it)
```css
margin-top: calc(var(--nav-h) + 20px);   /* push 20px lower */
margin-top: calc(var(--nav-h) + 40px);   /* push 40px lower */
```

### Move hero UP (less space above it)
```css
margin-top: calc(var(--nav-h) - 10px);   /* pull 10px higher */
margin-top: 0;                            /* flush to very top (goes under navbar) */
```

### Make banner taller
```css
height: 80vh;          /* taller — 80% of screen */
min-height: 500px;
max-height: 800px;
```

### Make banner shorter
```css
height: 45vh;
min-height: 300px;
max-height: 450px;
```

### Control which part of the image is visible

`object-position` accepts: `top`, `center`, `bottom`, `left`, `right`,
or pixel/percent values like `center 20%`.

```css
object-position: center top;     /* shows the top of the image */
object-position: center center;  /* shows the middle — default */
object-position: center bottom;  /* shows the bottom */
object-position: center 30%;     /* shows 30% from the top */
object-position: left center;    /* shows the left side */
```

### Control image brightness (how dark the overlay makes it)
```css
filter: brightness(0.3);   /* very dark */
filter: brightness(0.5);   /* dark */
filter: brightness(0.7);   /* medium — shows image clearly */
filter: brightness(0.9);   /* almost full brightness */
```

### Make image fill without cropping (for portrait images like book covers)
```css
object-fit: contain;   /* full image visible, black bars if ratio doesn't match */
object-fit: cover;     /* crops to fill — default */
```

---

## Mobile adjustments

Each file also has a `@media (max-width: 768px)` block at the bottom.
Find this section and adjust the `.hero` override inside it:

```css
@media (max-width: 768px) {
  .hero {
    height: 50vw;            /* ← height relative to screen width on mobile */
    min-height: 260px;
    max-height: 380px;
    margin-top: var(--nav-h);  /* ← keep same navbar offset on mobile */
  }
}
```

To make mobile banner taller:
```css
height: 70vw;
min-height: 320px;
max-height: 500px;
```

---

## The navbar height value

The fixed navbar is `68px` tall, stored as `--nav-h` in `src/styles/variables.css`.
All margin calculations use `var(--nav-h)` so if you ever change the navbar height,
the hero positions update automatically everywhere.

---

## Quick reference — one change per page

If you just want to shift one page's hero up or down, find the file in the table above,
search for `.hero {`, and change only `margin-top`.

```
Up 20px   →  margin-top: calc(var(--nav-h) - 20px);
Down 20px →  margin-top: calc(var(--nav-h) + 20px);
Flush     →  margin-top: var(--nav-h);
```

