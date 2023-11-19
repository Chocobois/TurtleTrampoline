import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";

export class ShopItem extends Button {
	public scene: GameScene;

	// Sprites
	public sprite: Phaser.GameObjects.Sprite;

	constructor(scene: GameScene, x: number, y: number, img: string) {
		super(scene, 0, 0);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.sprite = this.scene.add.sprite(x, y, img);
		this.add(this.sprite);

		this.bindInteractive(this.sprite, true);
	}
}
