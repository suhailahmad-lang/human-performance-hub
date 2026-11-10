# Exercise-specific 3D animation pipeline

## Product rule

Exercise demonstrations are in-platform 3D character animations. External video links, stock exercise videos, and one generic animation reused across exercises are not accepted as the demo experience.

## First procedural asset prototype

- Exercise: air squat
- Asset format: GLB
- Source scene: [Human Performance – Exercise Animation Asset Lab](https://higgsfield.ai/3d-jutsu/3178c141-2a79-4112-abbe-a6923ed55160)
- Scene revision: 1
- Export size: 181,560 bytes
- Character: original articulated 3D fitness mannequin built from 13 independently animated mesh parts
- Movement keys: frames 1, 13, 25, 37 and 49 at 24 fps
- Controls planned in the web viewer: play, pause, replay, loop and playback speed

This is a first movement prototype, not a final anatomically detailed character or a verified skeletal rig. Its movement and form still require visual review and refinement before being used as coaching guidance.

## Second procedural asset prototype

- Exercise: push-up
- Source scene: [Human Performance – Push-Up Animation Asset](https://higgsfield.ai/3d-jutsu/b0294181-09f9-4c48-a6d7-4a675a2fb836)
- Scene revision: 1
- Export size: 181,320 bytes
- Character: same visual system, independently authored push-up movement
- Movement keys: frames 1, 13, 25, 37 and 49 at 24 fps
- Structural check: 13 animated character mesh parts confirmed

## Web integration status

`src/components/Exercise3DAnimation.tsx` provides the model-viewer interface and per-exercise asset registry. The registry remains empty until a reviewed GLB is placed in durable application storage and its stable URL is registered. The signed preview URL returned by the 3D workspace expires and must not be hard-coded into the production app.

## Per-exercise acceptance gate

1. Dedicated movement clip authored for that exact exercise.
2. Correct start, transition, peak position, return and loop seam.
3. Review from front and side views; check joint paths, contact and proportions.
4. Export GLB and confirm animation clips survive export.
5. Upload to durable app storage and register the exact exercise slug.
6. Confirm the embedded viewer plays, pauses, loops and changes speed on desktop and mobile.

Until all gates pass, the exercise must show an honest “3D movement asset pending” state rather than a video link or an unrelated animation.
