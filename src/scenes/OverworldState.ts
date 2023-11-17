import { GameScene, State } from "@/scenes/GameScene";
import { Turtle } from "@/components/Turtle";
import { Button } from "@/components/Button";

export class OverworldState extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private background: Phaser.GameObjects.Image;
	private trampoline: Phaser.GameObjects.Image;
	private turtles: Turtle[];
	private someButton: Button;

	constructor(scene: GameScene) {
		super(scene, 0, 0);
		this.scene = scene;
		this.scene.add.existing(this);

		this.background = scene.add.image(0, 0, "overworld");
		this.background.setOrigin(0);
		scene.fitToScreen(this.background);
		this.add(this.background);

		this.trampoline = scene.add.image(
			0.3 * scene.W,
			0.75 * scene.H,
			"trampoline"
		);
		this.add(this.trampoline);

		this.turtles = [];
		for (let i = 0; i < 5; i++) {
			this.addTurtle();
		}

		this.someButton = new Button(scene, 100, 100);
		this.add(this.someButton);
		let buttonText = scene.addText({
			size: 50,
			weight: 900,
			color: "black",
			text: "Shop",
		});
		buttonText.setOrigin(0.5);
		this.someButton.add(buttonText);
		this.someButton.bindInteractive(buttonText);
		this.someButton.on("click", () => {
			this.scene.setState(State.Shop);
		});
	}

	update(time: number, delta: number) {
		this.turtles.forEach((turtle) => {
			turtle.update(time, delta);
		});
	}

	addTurtle() {
		let x = this.scene.W * (0.5 + 0.4 * Math.random());
		let y = this.scene.H * (0.6 + 0.2 * Math.random());
		let turtle = new Turtle(this.scene, x, y);
		this.add(turtle);
		this.turtles.push(turtle);

		turtle.on("action", () => {
			turtle.doABarrelRoll();
		});
	}
}
