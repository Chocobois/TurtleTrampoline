import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";

const ACCELERATION = 150;
const MAX_SPEED = 400;
const FRICTION = 0.7;
const TAPPING_TIMER = 200; // ms
console.assert(
	ACCELERATION / (1 - FRICTION) >= MAX_SPEED,
	"Max speed unreachable"
);

export class Turtle extends Button {
	public scene: GameScene;

	// Sprites
	private spriteSize: number;
	private sprite: Phaser.GameObjects.Sprite;
	private tween: Phaser.Tweens.Tween;

	// Controls
	public velocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };
	private isDragged: boolean;
	private dragOffset: Phaser.Math.Vector2;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.add.sprite(0, 0, "turtle_waiting");
		this.sprite.setOrigin(0.5, 1.0);
		this.sprite.y += this.spriteSize / 2;
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);

		/* Controls */
		this.velocity = new Phaser.Math.Vector2(0, 0);
		this.border = {
			left: 100,
			right: scene.W - 100,
			top: 100,
			bottom: scene.H - 100,
		};

		/* Input */
		this.isDragged = false;
		this.dragOffset = new Phaser.Math.Vector2();
		this.bindInteractive(this.sprite, true);
	}

	update(time: number, delta: number) {
		// this.x += (this.velocity.x * delta) / 1000;
		// this.y += (this.velocity.y * delta) / 1000;

		// Border collision
		// if (this.x < this.border.left) {
		// 	this.x = this.border.left;
		// }
		// if (this.x > this.border.right) {
		// 	this.x = this.border.right;
		// }
		// if (this.y < this.border.top) {
		// 	this.y = this.border.top;
		// }
		// if (this.y > this.border.bottom) {
		// 	this.y = this.border.bottom;
		// }

		// Animation (Change to this.sprite.setScale if needed)
		const squish = 0.02 * Math.sin((6 * time) / 1000);
		this.setScale(1.0 + squish, 1.0 - squish);
	}

	onDragStart(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.isDragged = true;
		this.dragOffset.set(dragX, dragY);
		this.sprite.setTexture("turtle_jumping");
	}

	onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		super.onDrag(pointer, dragX, dragY);
		this.setPosition(dragX + this.dragOffset.x, dragY + this.dragOffset.y);
	}

	onDragEnd(
		pointer: Phaser.Input.Pointer,
		dragX: number,
		dragY: number,
		dropped: boolean
	) {
		this.isDragged = false;
		this.sprite.setTexture("turtle_waiting");
	}

	doABarrelRoll() {
		if (!this.tween || !this.tween.isActive()) {
			this.tween = this.scene.tweens.add({
				targets: this.sprite,
				scaleX: {
					from: this.sprite.scaleX,
					to: -this.sprite.scaleX,
					ease: "Cubic.InOut",
				},
				duration: 300,
				yoyo: true,
			});
		}
	}
}
