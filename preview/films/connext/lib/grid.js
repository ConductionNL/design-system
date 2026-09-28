/**
 * ConNext film: the musical grid and the frame grid, 24 fps.
 *
 * G(bar, beat, sixteenth) comes from boards/A18/timing.js (round 5) (bars and beats
 * count from 1, as the storyboard writes them). Continuous motion runs on
 * exact grid times. Stepped states (a cell turning orange, a ring stepping
 * off, a digit typing) switch on whole frames: fq(t) is the frame a time
 * belongs to, rounded, so the motion-blur sub-samples of one frame all see
 * the same step instead of blending two.
 */
import { FPS, SPB, G, F, T, BAR } from '../boards/A18/timing.js'

export { FPS, SPB, G, F, T, BAR }
export const S16 = SPB / 4
export const fq = (t) => Math.round(t * FPS + 1e-6) / FPS
/** True from the frame nearest to te onwards (use with fq(t)). */
export const on = (tq, te) => tq >= fq(te) - 1e-6
export const within = (tq, a, b) => on(tq, a) && !on(tq, b)
