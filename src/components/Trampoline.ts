import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from "@/constants.json";

export class Trampoline extends Button {
	public scene: GameScene;

	// Sprites
	public sprite: Phaser.GameObjects.Sprite;
	public zone: Phaser.Geom.Rectangle;
	public surface: Phaser.Geom.Ellipse;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		this.width = 800;

		/* Sprite */
		this.sprite = this.scene.add.sprite(0, 0, "trampoline");
		this.sprite.setScale(this.width / this.sprite.width);
		this.sprite.setOrigin(0.5, 1.0);
		this.add(this.sprite);

		this.zone = new Phaser.Geom.Rectangle(
			this.x - 0.4 * this.width,
			0,
			0.8 * this.width,
			this.y - 0.65 * this.sprite.displayHeight
		);
		// Debug draw zone
		// this.scene.add
		// 	.graphics({
		// 		fillStyle: { color: 0xff0000, alpha: 0.5 },
		// 	})
		// 	.fillRectShape(this.zone);

		this.surface = new Phaser.Geom.Ellipse(
			this.x,
			this.zone.bottom,
			0.8 * this.width,
			120
		);

		/* Input */
		this.bindInteractive(this.sprite, true);
		this.on("click", () => {
			// Clicked on trampoline
		});
	}

	update(time: number, delta: number) {
		const holdX = 1.0 + 0.2 * this.holdSmooth;
		const holdY = 1.0 - 0.1 * this.holdSmooth;
		const squish = 0.01;
		this.setScale(
			(1.0 + squish * Math.sin(time / 200)) * holdX,
			(1.0 + squish * Math.sin(-time / 200)) * holdY
		);
	}
}
