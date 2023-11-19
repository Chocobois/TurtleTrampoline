import { Image, SpriteSheet, Audio } from "./util";
import { image, sound, music, loadFont, spritesheet } from "./util";

/* Images */
const images: Image[] = [
	// Backgrounds
	image("backgrounds/overworld", "overworld"),
	image("backgrounds/shop", "shop"),
	image("backgrounds/trampoline", "trampoline"),

	// Characters
	image("characters/turtle_jumping", "turtle_jumping"),
	image("characters/turtle_scared", "turtle_scared"),
	image("characters/turtle_stuck", "turtle_stuck"),
	image("characters/turtle_waiting", "turtle_waiting"),
	image("characters/turtle_waiting_angry", "turtle_waiting_angry"),
	// For walking animation, do this: turtle_walking - turtle_walking1 - turtle_walking - turtle_walking2 -loop
	image("characters/turtle_walking", "turtle_walking"),
	image("characters/turtle_walking1", "turtle_walking1"),
	image("characters/turtle_walking2", "turtle_walking2"),
	// For walking animation, do this: turtle_walking - turtle_walking1 - turtle_walking - turtle_walking2 -loop
	image("characters/turtle_walking_angry", "turtle_walking_angry"),
	image("characters/turtle_walking_angry1", "turtle_walking_angry1"),
	image("characters/turtle_walking_angry2", "turtle_walking_angry2"),

	image("characters/shopper", "shopper"),
	image("characters/raccoon", "raccoon"),

	// Items
	image("items/coin", "coin"),
	image("items/spring", "spring"),
	image("items/screw", "screw"),
	image("items/nail", "nail"),

	// UI
	image("ui/hud", "hud"),
	image("ui/shop_buy_button", "buy_button"),

	// Titlescreen
	image("titlescreen/sky", "title_sky"),
	image("titlescreen/background", "title_background"),
	image("titlescreen/foreground", "title_foreground"),
	image("titlescreen/character", "title_character"),
];

/* Spritesheets */
const spritesheets: SpriteSheet[] = [
	spritesheet('effects/dustyexplosion', 'dust', 256, 256),
];

/* Audios */
const audios: Audio[] = [
	music("tj_drum", "m_tj_drum"),
	music("tj_base", "m_tj_base"),
	music("tj_jump", "m_tj_jump"),
	music("tj_idle", "m_tj_idle"),
	music("tj_full", "m_tj_full"),
	music("tj_shop", "m_tj_shop"),
	music("transition", "m_transition"),
	music("title", "m_main_menu"),
	music("first", "m_first"),
	sound("tree/rustle", "t_rustle", 0.5),
];

/* Fonts */
await loadFont("NerkoOne-Regular", "Game Font");

export { images, spritesheets, audios };
