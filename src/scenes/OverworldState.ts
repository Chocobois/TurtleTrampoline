import { GameScene, State } from "@/scenes/GameScene";
import { ShopOwner } from "@/components/ShopOwner";
import { Turtle } from "@/components/Turtle";
import { Button } from "@/components/Button";
import { Trampoline } from "@/components/Trampoline";

export class OverworldState extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private background: Phaser.GameObjects.Image;
	private owner: ShopOwner;
	private trampoline: Trampoline;
	public turtles: Turtle[];
	private someButton: Button;

	private ground: Phaser.Geom.Rectangle;

	constructor(scene: GameScene) {
		super(scene, 0, 0);
		this.scene = scene;
		this.scene.add.existing(this);

		this.background = scene.add.image(0, 0, "overworld");
		this.background.setOrigin(0);
		scene.fitToScreen(this.background);
		this.add(this.background);

		this.ground = new Phaser.Geom.Rectangle(
			0.5 * this.scene.W,
			0.7 * this.scene.H,
			0.45 * this.scene.W,
			0.2 * this.scene.H
		);
		// this.scene.add
		// 	.rectangle(
		// 		this.ground.x,
		// 		this.ground.y,
		// 		this.ground.width,
		// 		this.ground.height,
		// 		0xff0000,
		// 		0.2
		// 	)
		// 	.setOrigin(0);

		this.owner = new ShopOwner(scene, 0.4 * this.scene.W, 0.62 * scene.H);
		this.add(this.owner);

		this.trampoline = new Trampoline(scene, 0.25 * scene.W, 0.85 * scene.H);
		this.add(this.trampoline);

		this.turtles = [];
		for (let i = 0; i < 10; i++) {
			this.addTurtle();
		}

		this.someButton = new Button(scene, 100, 100);
		this.add(this.someButton);
		let buttonText = scene.addText({
			size: 50,
			color: "black",
			text: "Shop",
		});
		buttonText.setOrigin(0.5);
		this.someButton.add(buttonText);
		this.someButton.bindInteractive(buttonText);
		this.someButton.on("click", () => {
			this.scene.setState(State.Shop);
		});
		const expl = {
			key: "dust_explosion",
			frames: "dust",
			frameRate: 12,
			showOnStart: true,
			hideOnComplete: true,
		};

		this.scene.anims.create(expl);
	}

	update(time: number, delta: number) {
		if (!this.visible) return;

		this.owner.update(time, delta);
		this.trampoline.update(time, delta);
		this.turtles.forEach((turtle) => {
			turtle.update(time, delta);
		});
	}

	setVisible(value: boolean): this {
		this.turtles.forEach((turtle) => {
			turtle.sprite.setVisible(value);
		});

		return super.setVisible(value);
	}

	addDust(x: number, y: number) {
		let xpl = this.scene.add.sprite(x, y, "dust_explosion");
		xpl.play({ key: "dust_explosion", delay: 0 });
	}

	addTurtle() {
		let x = this.scene.W * (0.5 + 0.4 * Math.random());
		let y = this.scene.H * (0.6 + 0.2 * Math.random());
		let turtle = new Turtle(this.scene, x, y, this.trampoline, this.ground);
		this.add(turtle);
		this.turtles.push(turtle);

		turtle.on("land", () => {
			// Land safely!
		});

		turtle.on("bounce", () => {
			// Bounce!
			this.trampoline.addRecoil();
		});

		turtle.on("crashed", () => {
			// Landed on its back!
		});
	}
}
