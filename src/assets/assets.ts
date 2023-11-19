import { Image, SpriteSheet, Audio } from './util';
import { image, sound, music, loadFont, spritesheet } from './util';

/* Images */
const images: Image[] = [
	// Backgrounds
	image('backgrounds/overworld', 'overworld'),
	image('backgrounds/shop', 'shop'),
	image('backgrounds/trampoline', 'trampoline'),

	// Characters
	image('characters/player', 'player'),
	image('characters/turtle_jumping', 'turtle_jumping'),
	image('characters/turtle_stuck', 'turtle_stuck'),
	image('characters/turtle_waiting', 'turtle_waiting'),
	image('characters/turtle_rip', 'turtle_rip'),

	// Items
	image('items/coin', 'coin'),

	// UI
	image('ui/hud', 'hud'),

	// Titlescreen
	image('titlescreen/sky', 'title_sky'),
	image('titlescreen/background', 'title_background'),
	image('titlescreen/foreground', 'title_foreground'),
	image('titlescreen/character', 'title_character'),
];

/* Spritesheets */
const spritesheets: SpriteSheet[] = [
	spritesheet('effects/explosion_tiny', 'explosion_tiny', 512, 512),
];

/* Audios */
const audios: Audio[] = [
	music('title', 'm_main_menu'),
	music('first', 'm_first'),
	sound('tree/rustle', 't_rustle', 0.5),
	sound('turtles/pichuun_super', 'pichuun', 0.5),
	sound('turtles/slap', 'slap', 0.5),
	sound('turtles/rip', 'rip', 0.5),
	sound('turtles/saved', 'saved', 0.5),
];

/* Fonts */
await loadFont('Sketch', 'Game Font');

export {
	images,
	spritesheets,
	audios
};