import { BaseScene } from "@/scenes/BaseScene";
import { OverworldState } from "@/scenes/OverworldState";
import { ShopState } from "@/scenes/ShopState";
import { UI } from "@/components/UI";

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

		this.setState(this.state);
	}

	update(time: number, delta: number) {
		this.overworld.update(time, delta);
		this.shop.update(time, delta);
		this.ui.update(time, delta);
	}

	setState(state: State) {
		this.state = state;
		this.events.emit(`state_${state}`);
		this.overworld.setVisible(state == State.Overworld);
		this.shop.setVisible(state == State.Shop);
	}
}
