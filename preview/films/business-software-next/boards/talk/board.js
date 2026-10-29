/**
 * "Business software is next": the film of Ruben's talk (28 Oct 2026), about
 * seven and a half minutes, English, with and without voice. One key frame per
 * scene, in the order of the talk. Each act lives in its own file and draws
 * with ./kit.js only.
 *
 *   board.html?film=business-software-next&v=talk   (board i sits at t = i + 0.5; 16:9, 1920 x 1080)
 */
import { C } from '../../../_lib/brand.js'
import { act1 } from './act1.js'
import { act2to4 } from './act2to4.js'
import { act5to6 } from './act5to6.js'
import { act7to8 } from './act7to8.js'

export const boards = [...act1, ...act2to4, ...act5to6, ...act7to8]

export const meta = {
	id: 'talk',
	title: 'Business software is next',
	logline: 'The talk as a film: last week\'s WordPress holes, the pattern of what got wilded, suite versus workspace, the new math of who builds software, two angry citizens, and the two things that empower them: trust, and a store.',
	format: '16x9',
	background: C.cobalt,
	safe: { top: 96, bottom: 150, left: 120, right: 120 },
}
