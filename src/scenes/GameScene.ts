import { BaseScene } from "@/scenes/BaseScene";
import { Turtle } from "@/components/Turtle";
import { UI } from "@/components/UI";

export class GameScene extends BaseScene {
	private background: Phaser.GameObjects.Image;
	private turtles: Turtle[];
	private ui: UI;

	constructor() {
		super({ key: "GameScene" });
	}

	create(): void {
		this.fade(false, 200, 0x000000);

		this.background = this.add.image(0, 0, "background");
		this.background.setOrigin(0);
		this.fitToScreen(this.background);

		this.turtles = [];
		for (let i = 0; i < 5; i++) {
			this.addTurtle();
		}

		this.ui = new UI(this);
	}

	update(time: number, delta: number) {
		this.turtles.forEach((turtle) => {
			turtle.update(time, delta);
		});
	}

	addTurtle() {
		let x = this.W * (0.25 + 0.5 * Math.random());
		let y = this.H * (0.5 + 0.25 * Math.random());
		let turtle = new Turtle(this, x, y);
		turtle.on("action", () => {
			turtle.doABarrelRoll();
		});
		this.turtles.push(turtle);
	}
}
