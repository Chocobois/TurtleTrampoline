import { BaseScene } from "@/scenes/BaseScene";
import { OverworldState } from "@/scenes/OverworldState";
import { ShopState } from "@/scenes/ShopState";
import { UI } from "@/components/UI";
import { Particles } from "@/components/Particles";
import { TextParticle, TextParticleEffects } from "../components/TextParticle";
import { Music } from "@/components/Music";
import { MusicKey } from "@/components/MusicData";
import { Turtle } from "@/components/Turtle";

export enum State {
	Overworld = "Overworld",
	Shop = "Shop",
}

export class GameScene extends BaseScene {
	private overworld: OverworldState;
	private shop: ShopState;
	private ui: UI;

	private state: State;
	private health: number;

	public particles: Particles;
	//hacky rerooted text particles
	public textParticles: TextParticle;

	private musicTracks: Music[];
	private musicBase: Music;
	private musicDrum: Music;
	private musicJump: Music;
	private musicIdle: Music;
	private musicFull: Music;
	private musicShop: Music;
	private musicSwap: Music;

	public musicTransition: {
		active: boolean,
		bar: number
	};

	constructor() {
		super({ key: "GameScene" });
	}

	create(): void {
		this.fade(false, 200, 0x000000);

		this.state = State.Overworld;
		this.health = 0;

		this.overworld = new OverworldState(this);
		this.shop = new ShopState(this);
		this.ui = new UI(this);
		this.particles = new Particles(this);
		this.textParticles = new TextParticle(this);
		this.musicTransition = { active: false, bar: 0 };

		const volume = 0.4;
		if (!this.musicBase) this.musicBase = new Music(this, "m_tj_base", {volume});
		if (!this.musicDrum) this.musicDrum = new Music(this, "m_tj_drum", {volume});
		if (!this.musicJump) this.musicJump = new Music(this, "m_tj_jump", {volume});
		if (!this.musicIdle) this.musicIdle = new Music(this, "m_tj_idle", {volume});
		if (!this.musicFull) this.musicFull = new Music(this, "m_tj_full", {volume});
		if (!this.musicShop) this.musicShop = new Music(this, "m_tj_shop", {volume});
		if (!this.musicSwap) this.musicSwap = new Music(this, "m_transition", {volume});

		this.musicTracks = [
			this.musicBase, this.musicDrum,
			this.musicJump, this.musicIdle,
			this.musicFull, this.musicShop,
			this.musicSwap
		];

		this.musicTracks.forEach(track => track.play());
		this.musicBase.on("bar", (bar: number) => this.onBar(bar));

		this.setState(this.state);
		this.musicTransition.active = false;
	}

	update(time: number, delta: number) {
		this.overworld.update(time, delta);
		this.shop.update(time, delta);
		this.ui.update(time, delta);
		this.particles.update(time, delta);
		this.textParticles.update(time, delta);
		this.updateMusic(this.overworld.turtles);
	}

	addDust(x: number, y: number)
	{
		this.overworld.addDust(x,y);
	}

	addTextParticle(x: number, y: number, color: string, content: string, size: number)
	{
		this.textParticle(x, y, color, content, undefined, size);
	}

	textParticle(x: number, y: number, color: string, content: string, outline: boolean=true, size: number=40,
		duration: number=1.5, effects: TextParticleEffects={ wave: {enable: true}, fadeOut: {enable: true} }) {

		const text = this.createText(x, y, size, color, content);
		if(outline) text.setStroke("rgba(0,0,0,0.5)", 120*this.SCALE);

		// Prevent text from going too far right **not working due to shenanignas with TS
		const diff = this.W - 80 * this.SCALE;
		if(diff < 0) text.setX(text.x+diff);

		this.textParticles.push(text, duration, effects);
	}

	setState(state: State) {
		this.state = state;
		this.events.emit(`state_${state}`);
		this.overworld.setVisible(state == State.Overworld);
		this.shop.setVisible(state == State.Shop);
		this.musicTransition = {
			active: true,
			bar: this.wrapMusicBar(
				Math.ceil(this.musicBase.getBarTime() + 0.5)
			),
		};
	}

	onBar(bar: number) {
		if (bar === this.musicTransition.bar)
		this.musicTransition.active = false;
	}

	updateMusic(allTurtles: Turtle[], globalMute=false) {
		// TODO: Move to new file (Mato)
		const tracks = this.musicTracks;
		const turtles = allTurtles.filter(t => !t.leaving)

		// Skip update if uninitialized
		if (tracks.some(track => track === undefined)) return;

		// Skip layer logic if music is muted
		if (globalMute) {
			tracks.forEach(track => track.setMute(true));
			return;
		}

		const bouncing = turtles.some(turtle => turtle.isOnTrampoline && turtle.bounceCount > 0);
		const perished = turtles.every(turtle => turtle.hasCrashed);
		const bouncingAll = turtles.every(turtle => turtle.isOnTrampoline  && turtle.bounceCount > 0);

		// TODO: Smooth volume fades
		this.musicJump.setMute(perished || !bouncing);
		this.musicFull.setMute(perished || !bouncingAll);
		this.musicIdle.setMute(perished || this.state != "Overworld");
		this.musicShop.setMute(perished || this.state != "Shop");
		this.musicDrum.setMute(this.musicTransition.active);
		this.musicSwap.setMute(!this.musicTransition.active);
	}

	wrapMusicBar(bar: number, firstLoopBar=3, lastLoopBar=98) {
		return (bar <= lastLoopBar) ? bar
		: bar % (lastLoopBar) + firstLoopBar
	}

	addScore(score: number)
	{
		this.ui.addScore(score);
	}

	get SCALE() {
		return this.H / 1080;
	}
}
