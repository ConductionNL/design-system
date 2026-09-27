/**
 * Variant A16: the timing of the take, on the round-3 grid (Ruben, 2026-09-27).
 *
 * 18.75 s = 10 bars at 128 BPM, 24 fps: every bar is exactly 45 frames, a
 * beat 11.25 frames, a sixteenth 2.8125 frames. G(bar, beat, sixteenth)
 * counts bars and beats from 1, as the storyboard writes them ("3.2" is
 * G(3, 2); G(2, 3, 2) is the "and" of 2.3). F(n) is frame n.
 *
 * The storyboard prose (board.js) and the film (../../film.js) both read
 * these numbers, so the words on the board and the motion stay the same.
 *
 * Caption timing follows the director's handover rules: a caption rises
 * (4 frames) once the ground behind it is settled, holds at least
 * max(1.5 s, 0.4 s x words) from the frame it is fully up, and leaves through
 * its clip (4 frames) before the world moves over it; the next one rises at
 * least 2 clear frames later. Captions are timed on frames, the picture on
 * the musical grid.
 */
export const BPM = 128
export const FPS = 24
export const SPB = 60 / BPM
export const BAR = 4 * SPB
export const BARS = 10
export const DURATION = BARS * BAR // 18.75
export const G = (bar, beat = 1, s16 = 0) => ((bar - 1) * 4 + (beat - 1)) * SPB + (s16 * SPB) / 4
export const F = (n) => n / FPS
/** Rise and exit of a caption line, in seconds: rises take 4 frames, exits 4 (3 where a hand-off is tight). */
export const RISE = F(4)
export const EXIT = F(4)
export const EXIT3 = F(3)

export const T = {
	/* s1 · close on your client (frame 1 is the thumbnail and the loop point) */
	openOut: F(48), // 2.00: the opener leaves as the push eases into the pull back
	/* s2 · the ring settles, the brand */
	pull: [F(48), 2.75], // pull back, zoom 2.30 to 0.85, the client drifting left; eased in, so the opener has gone before it runs
	land: { // each cell lands on a sixteenth, flying in along a honeycomb axis from the nearest frame edge that is not the type column
		'0,-1': G(2, 2), // Files, from the top
		'1,-1': G(2, 2, 1), // Mail, from the right
		'1,0': G(2, 2, 2), // Calendar, from the right
		'-1,0': G(2, 2, 3), // Talk, from the top
		'-1,1': G(2, 3), // Filinq, from below
		'0,1': G(2, 3), // Portaliq, from below
		'1,1': G(2, 3, 1), // Nextcloud, along the story row from the right
		'2,1': G(2, 3, 1), // Hermiq, leading it
	},
	wmIn: F(59), // 2.46: the ConNext wordmark rises once the pull back has all but settled
	orange: [G(2, 3, 1), G(2, 3, 3)], // the client is the one orange cell, from the ring closing to the push
	key2: 3.1,
	/* s3 · inside Filinq */
	push: [G(2, 3, 3), 3.95], // push into Filinq; the wordmark rides out with the world
	s3In: F(87), // 3.63: once the white hex covers the type column
	fill: [G(3, 1), G(3, 2), G(3, 3)], // name (bar 3, the kick enters), address, the amount starts typing
	amountLands: G(3, 4), // its last digit lands with the orange caret
	key3: 5.2,
	/* s4 · inside Portaliq */
	hop1: [F(139), G(4, 2, 3)], // 5.79 to 6.45
	s4In: F(151),
	tap: G(4, 4), // 7.03
	sig: G(4, 4) + 0.24, // 7.27: the signature lands, the one orange
	key4: 7.45,
	/* s5 · inside Nextcloud */
	hop2: [F(191), G(5, 3, 2)], // 7.96 to 8.67
	s5In: F(204),
	badge: G(5, 4), // 8.91: the badge pops, the popover drops open
	notice: G(6, 1), // 9.38: the new notice slides in on top (claps enter)
	key5: 9.9,
	/* s6 · inside Hermiq */
	hop3: [F(266), G(7, 2)], // 11.08 to 11.72
	s6In: F(277),
	answer: G(7, 2, 1), // 11.84: the answer grows, rows a sixteenth apart
	rows: [G(7, 2, 2), G(7, 2, 3), G(7, 3)],
	key6: 12.6,
	approval: G(8, 1), // 13.13: the change it asks you to allow lands, its pip the one orange
	s6Out: F(320), // "Ask about your clients." leaves (3 frames)...
	s6bIn: F(325), // ...and "It asks first." rises in its place, two clear frames later
	key6b: 14.3,
	s6bOut: F(365), // 15.21: it leaves before the camera moves
	/* s7 · pull out: the whole honeycomb, and where to install it */
	pullOut: [F(369), 16.1], // 15.38 to 16.10
	ripple: [G(9, 2, 1), G(9, 2, 2), G(9, 2, 3), G(9, 3)], // four more apps
	ctaIn: F(376), // 15.67: the wordmark and the install call rise, once the lit cells have passed the type
	key7: 16.4,
	/* s8 · the honeycomb steps off, back to your client */
	step: [G(10, 1), G(10, 1, 1), G(10, 1, 2)], // rings 3, 2, 1 toward the client: the bell (sonic logo)
	pushIn: [G(10, 2), 18.1], // push back in on the client once the first ring has stepped off, onto frame 1's camera
	ctaOut: F(438), // 18.25: the end card leaves (3 frames)...
	openIn: F(443), // 18.46: ...and "Open a client in Nextcloud." rises: frames 447 to 449 are frame 1
	key8: 18.1,
}

/** Every caption: when it is fully up, when it starts to leave, and how long the exit takes (for the checks). */
export const CAPTIONS = [
	{ id: 's1', text: 'Open a client\nin Nextcloud.', up: 0, out: T.openOut, exit: EXIT },
	{ id: 's3', text: 'The contract\nfills itself in.', up: T.s3In + RISE, out: T.hop1[0], exit: EXIT },
	{ id: 's4', text: 'Your client\nsigns.', up: T.s4In + RISE, out: T.hop2[0], exit: EXIT },
	{ id: 's5', text: 'The right person\nhears about it.', up: T.s5In + RISE, out: T.hop3[0], exit: EXIT },
	{ id: 's6', text: 'Ask about\nyour clients.', up: T.s6In + RISE, out: T.s6Out, exit: EXIT3 },
	{ id: 's6b', text: 'It asks first.', up: T.s6bIn + RISE, out: T.s6bOut, exit: EXIT },
	{ id: 's7', text: 'Install from the\nNextcloud app store', up: T.ctaIn + RISE, out: T.ctaOut, exit: EXIT3 },
]
export const words = (text) => text.split(/\s+/).filter(Boolean).length
export const budget = (text) => Math.max(1.5, 0.4 * words(text))
