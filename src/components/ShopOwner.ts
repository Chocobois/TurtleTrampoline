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
		this.spriteSize = 150;
		this.sprite = this.scene.add.sprite(this.scene.W*0.85, this.scene.H*0.95, "raccoon");
        this.sprite.setOrigin(0.5, 1);

		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);

		/* Input */
		this.bindInteractive(this.sprite, true);
	}

	update(time: number, delta: number) {
        const squish = 0.02 * Math.sin((6 * time) / 1000);
		this.sprite.setScale(
            (1.0 + squish) + this.spriteSize / this.sprite.width,
            (1.0 - squish) + this.spriteSize / this.sprite.height
        );
	}


	setSpriteOrigin(ox: number, oy: number) {
		this.sprite.x += (ox - this.sprite.originX) * this.sprite.displayWidth;
		this.sprite.y += (oy - this.sprite.originY) * this.sprite.displayHeight;
		this.sprite.setOrigin(ox, oy);
	}

}
