import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import { Trampoline } from "./Trampoline";

export class Shopper extends Button {
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
		this.spriteSize = 800;
		this.sprite = this.scene.add.sprite(-40, this.scene.H, "shopper");
        this.sprite.setOrigin(0, 1);

		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);

		this.bindInteractive(this.sprite, true);
	}

	update(time: number, delta: number) {
	}


	setSpriteOrigin(ox: number, oy: number) {
		this.sprite.x += (ox - this.sprite.originX) * this.sprite.displayWidth;
		this.sprite.y += (oy - this.sprite.originY) * this.sprite.displayHeight;
		this.sprite.setOrigin(ox, oy);
	}

}
