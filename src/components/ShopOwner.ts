import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import { Trampoline } from "./Trampoline";

export class ShopOwner extends Button {
	public scene: GameScene;

	// Sprites
	private spriteSize: number;
	public sprite: Phaser.GameObjects.Sprite;
	private tween: Phaser.Tweens.Tween;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.add.sprite(0, 0, "raccoon");
		this.sprite.setOrigin(0.5, 0.9);
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);

		/* Input */
		this.bindInteractive(this.sprite, true);
	}

	update(time: number, delta: number) {
		const holdX = 1.0 + 0.15 * this.holdSmooth;
		const holdY = 1.0 - 0.2 * this.holdSmooth;
		const squish = 0.03;
		this.setScale(
			(1.0 + squish * Math.sin(-time / 200)) * holdX,
			(1.0 + squish * Math.sin(time / 200)) * holdY
		);
	}
}
