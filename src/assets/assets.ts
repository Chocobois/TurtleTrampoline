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
	image('characters/turtle_scared', 'turtle_scared'),
	image('characters/turtle_stuck', 'turtle_stuck'),
	image('characters/turtle_waiting', 'turtle_waiting'),
	image('characters/turtle_walking1', 'turtle_walking1'),
	image('characters/turtle_walking2', 'turtle_walking2'), // For walking animation, do this: turtle_waiting - turtle_walking1 - turtle_waiting - turtle_walking2 -loop

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

];

/* Audios */
const audios: Audio[] = [
	music('title', 'm_main_menu'),
	music('first', 'm_first'),
	sound('tree/rustle', 't_rustle', 0.5),
];

/* Fonts */
await loadFont('NerkoOne-Regular', 'Game Font');

export {
	images,
	spritesheets,
	audios
};