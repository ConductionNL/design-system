/**
 * Plays film pages inside the Film section, frame-exact, from the parent page.
 *
 * Markup:
 *   <figure class="demo" data-src="../../films/x/index.html?capture" data-still="1.2" data-label="the lock recipe">
 *     <div class="frame"></div>
 *     <div class="controls"><button type="button" data-play>Play</button></div>
 *   </figure>
 *
 * The iframe is created when the figure scrolls near the viewport, so a page with many demos does not
 * load every film at once. The film page exposes window.__render(t) and window.__film; this script
 * drives it with requestAnimationFrame and loops. With prefers-reduced-motion nothing plays on its own:
 * the frame shows the still at data-still until the reader presses Play. Without it, a demo plays while
 * it is on screen and pauses when it leaves. A demo with data-audio="#id" follows that <audio> element's
 * clock instead (used by the voice demo).
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

function setup(fig) {
	const frame = fig.querySelector('.frame')
	const btn = fig.querySelector('[data-play]')
	const audio = fig.dataset.audio ? document.querySelector(fig.dataset.audio) : null
	const state = { win: null, film: null, playing: false, t0: 0, wall: 0, t: +(fig.dataset.still || 0), visible: false, user: false }
	const label = fig.dataset.label || 'the demo'

	const draw = (t) => { if (state.win) { state.t = t; state.win.__render(t); fig.dispatchEvent(new CustomEvent('demo:time', { detail: t })) } }
	const tick = (now) => {
		if (!state.playing) return
		let t
		if (audio) t = audio.currentTime
		else {
			t = state.t0 + (now - state.wall) / 1000
			if (t >= state.film.duration) { state.t0 = 0; state.wall = now; t = 0 }
		}
		draw(Math.min(t, state.film.duration - 1e-4))
		requestAnimationFrame(tick)
	}
	const setBtn = () => {
		if (!btn) return
		btn.textContent = state.playing ? 'Pause' : 'Play'
		btn.setAttribute('aria-label', `${state.playing ? 'Pause' : 'Play'} ${label}`)
		btn.setAttribute('aria-pressed', String(state.playing))
	}
	const play = (on) => {
		if (!state.film) return
		state.playing = on
		if (on) { state.t0 = state.t >= state.film.duration - 0.05 ? 0 : state.t; state.wall = performance.now(); requestAnimationFrame(tick) }
		setBtn()
	}
	const load = () => {
		if (state.win || frame.querySelector('iframe')) return
		const f = document.createElement('iframe')
		f.title = fig.dataset.title || `Film demo: ${label}`
		f.src = fig.dataset.src
		f.setAttribute('tabindex', '-1')
		f.setAttribute('aria-hidden', 'true')
		frame.appendChild(f)
		f.addEventListener('load', () => {
			const wait = () => {
				const w = f.contentWindow
				if (w && w.__ready && w.__film) {
					state.win = w
					state.film = w.__film
					draw(state.t)
					fig.dispatchEvent(new CustomEvent('demo:ready', { detail: w }))
					if (audio && !audio.paused) play(true)
					else if (!audio && !reduce.matches && state.visible && !state.user) play(true)
				} else setTimeout(wait, 60)
			}
			wait()
		})
	}
	if (btn) {
		setBtn()
		btn.addEventListener('click', () => { state.user = true; load(); play(!state.playing) })
	}
	if (audio) {
		audio.addEventListener('play', () => { load(); play(true) })
		audio.addEventListener('pause', () => play(false))
		audio.addEventListener('seeked', () => draw(audio.currentTime))
	}
	new IntersectionObserver((entries) => {
		for (const e of entries) {
			state.visible = e.isIntersecting
			if (e.isIntersecting) load()
			if (audio || state.user) continue
			if (!e.isIntersecting && state.playing) play(false)
			else if (e.isIntersecting && state.film && !reduce.matches) play(true)
		}
	}, { rootMargin: '200px' }).observe(fig)
	reduce.addEventListener?.('change', () => { if (reduce.matches && !state.user) play(false) })
}

document.querySelectorAll('figure.demo').forEach(setup)
