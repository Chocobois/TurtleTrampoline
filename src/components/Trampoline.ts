import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from '@/constants.json';

export class Trampoline extends Button {
	public scene: GameScene;

	// Sprites
	public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.sprite = this.scene.physics.add.sprite(0, 0, "trampoline");
		this.sprite.setImmovable(true);

        //this.sprite.static;
		this.sprite.setOrigin(0.5, 1.0);
		this.add(this.sprite);

        /* Input */
		this.bindInteractive(this.sprite, true);
	}

}
