# Camera Teardown

**[camera.cyantan.com](https://camera.cyantan.com)**

A scroll-driven 3D teardown of a camera, built entirely in code.

Scrolling pulls the camera apart into 36 components, walks through four
subsystems one at a time, and puts it back together. You can drag at any
point to orbit the model.

## The constraint

**No imported models. No texture maps. No image files of any kind.**

Every part is a `BufferGeometry` generated at runtime from lathed
profiles, extruded shells and displaced vertices. Every surface is one
custom GLSL shader. The aperture scale, distance scale and name plate
are drawn onto a `<canvas>` when the page loads.

That constraint is the point of the project — it forces the detail to
come from geometry and light rather than from assets.

## What's in it

| | |
|---|---|
| Components | 36 — optics 8, barrel 9, mechanism 8, body 11 |
| Sections | 7 |
| Part annotations | 12, projected from 3D to screen space |
| Shaders | 1 material shader + 1 backdrop shader |
| External 3D assets | 0 |

The material shader carries a GGX/Smith specular lobe, Fresnel, thin-film
iridescence for the glass, chromatic dispersion, a clearcoat layer tuned
to read as painted metal, and procedural micro-surface noise with
`fwidth` anti-aliasing.

## How the choreography works

Scroll position is normalised into a single `raw` value. Each subsystem
gets its own explode amount from `apart × (1 − home)`, so parts separate
together and settle independently as their section arrives. Nothing that
moves per frame goes through React state — the scroll engine, the camera
rig, the model and the annotation projector all write to the DOM or to
mutable objects directly inside `useFrame`.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 ·
three.js · @react-three/fiber · GSAP (SplitText) · Lenis

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Build

```bash
npm run build
```

The site is a fully static export — the build writes plain HTML, JS and
CSS into `dist/`, which can be dropped onto any static host. There is no
server component.

### Debug flags

| Flag | Effect |
|---|---|
| `?debug=1` | Shows scroll state and exposes the scroll engine on `window` |
| `?at=2.5` | Freezes the teardown at a given scroll position |
| `?bg=dark` | Switches to the dark backdrop |
| `?post=1` | Enables the post-processing chain |
| `?exp=1.6` | Overrides exposure |

## Known issue

Enabling the post-processing chain (`?post=1`) causes intermittent
flickering at some viewing angles. The cause has not been pinned down —
the suspicion is that grazing-angle highlights on the glass overflow the
HDR buffer and poison Bloom's mipmap reduction. The default path skips
post-processing entirely and is stable; the chain is loaded as a separate
chunk so it costs nothing when unused.
