import { BaseScene } from "@/scenes/BaseScene";
import { OverworldState } from "@/scenes/OverworldState";
import { ShopState } from "@/scenes/ShopState";
import { UI } from "@/components/UI";
import { TextParticle, TextParticleEffects } from "../components/TextParticle";

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

	//hacky rerooted text particles
	public textParticles: TextParticle;

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
		this.textParticles = new TextParticle(this);
		this.setState(this.state);
	}

	update(time: number, delta: number) {
		this.overworld.update(time, delta);
		this.shop.update(time, delta);
		this.ui.update(time, delta);
		this.textParticles.update(time, delta);
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
	}

	addScore(score: number)
	{
		this.ui.addScore(score);
	}

	get SCALE() {
		return this.H / 1080;
	}
}
