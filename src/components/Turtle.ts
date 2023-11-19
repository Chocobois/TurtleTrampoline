import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from "@/constants.json";

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
	public sprite: Phaser.GameObjects.Sprite;
	private tween: Phaser.Tweens.Tween;

	// Controls
	public physicsPosition: Phaser.Math.Vector2;
	public physicsVelocity: Phaser.Math.Vector2;
	public dragVelocity: Phaser.Math.Vector2;
	public velocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };
	private dragOffset: Phaser.Math.Vector2;

	// Jumping
	private trampolineZone?: Phaser.Geom.Rectangle;
	private isStuck: boolean;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.add.sprite(0, 0, "turtle_waiting");
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.add(this.sprite);

		/* Controls */
		this.physicsPosition = new Phaser.Math.Vector2(x, y);
		this.physicsVelocity = new Phaser.Math.Vector2(0, 0);
		this.dragVelocity = new Phaser.Math.Vector2(0, 0);
		this.border = {
			left: 100,
			right: scene.W - 100,
			top: 0,
			bottom: scene.H - 200,
		};
		this.isStuck = false;

		/* Input */
		this.dragOffset = new Phaser.Math.Vector2();
		this.bindInteractive(this.sprite, true);

		this.sprite.on("collide", () => {
			console.log("Collide");
		});
	}

	update(time: number, delta: number) {
		// "Physics"
		if (!this.hold) {
			// Trampoline
			if (this.trampolineZone) {
				if (
					this.physicsPosition.y <
					this.trampolineZone.bottom - this.feetOffset
				) {
					this.physicsVelocity.x = 0.97 * this.physicsVelocity.x;
					this.physicsVelocity.y += 1;
				} else {
					let maxSpeed = 30;
					let landSpeed = Math.max(this.physicsVelocity.y, 1);
					let jumpSpeed =
						Phaser.Math.Easing.Sine.Out(landSpeed / maxSpeed) * maxSpeed;
					this.physicsVelocity.y = -Math.min(jumpSpeed, maxSpeed);
				}
			}

			// Grounded
			else if (this.isGrounded) {
				// Friction
				this.physicsVelocity.x = 0.5 * this.physicsVelocity.x;
				// Stop fall
				this.physicsVelocity.y = 0;
				this.physicsPosition.y = this.border.bottom;
			}

			// Airborn
			else {
				this.physicsVelocity.x = 0.97 * this.physicsVelocity.x;
				this.physicsVelocity.y += 1;

				if (this.physicsVelocity.y > 25) {
					this.isStuck = true;
				}
			}

			// Apply velocity
			this.physicsPosition.add(this.physicsVelocity);
		} else {
			this.physicsVelocity.reset();
		}

		// Movement
		this.x += 0.5 * (this.physicsPosition.x - this.x);
		this.y += 0.5 * (this.physicsPosition.y - this.y);

		if (this.hold) {
			this.dragVelocity.set(
				this.physicsPosition.x - this.x,
				this.physicsPosition.y - this.y
			);
		} else {
			this.dragVelocity.scale(0.9);
		}

		// Animation
		const squish = 0.02 * Math.sin((6 * time) / 1000);
		this.setScale(1.0 + squish, 1.0 - squish);

		this.sprite.angle = this.dragVelocity.x;

		if (this.hold || this.trampolineZone) {
			this.sprite.setTexture("turtle_jumping");
		} else if (this.isGrounded) {
			if (this.isStuck) {
				this.sprite.setTexture("turtle_stuck");
				this.setSpriteOrigin(0.5, 0.8);
				this.sprite.angle = 10 * Math.sin((7 * time) / 1000);
			} else {
				this.sprite.setTexture("turtle_waiting");
			}
		} else {
			if (this.isStuck) {
				this.sprite.setTexture("turtle_scared");
			} else {
				this.sprite.setTexture("turtle_jumping");
			}
		}
	}

	/* Jumping */

	setTrampolineZone(zone?: Phaser.Geom.Rectangle) {
		this.trampolineZone = zone;
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

	setSpriteOrigin(ox: number, oy: number) {
		this.sprite.x += (ox - this.sprite.originX) * this.sprite.displayWidth;
		this.sprite.y += (oy - this.sprite.originY) * this.sprite.displayHeight;
		this.sprite.setOrigin(ox, oy);
	}

	get isGrounded() {
		return this.physicsPosition.y >= this.border.bottom - this.feetOffset;
	}

	get feetOffset() {
		if (!this.isStuck) {
			return 0.4 * this.sprite.displayHeight;
		} else {
			return 0.0 * this.sprite.displayHeight;
		}
	}

	/* Input */

	onDragStart(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.dragOffset.set(dragX, dragY);
		this.physicsPosition.set(dragX, dragY);

		this.setSpriteOrigin(0.5, 0.3);
		this.sprite.setTexture("turtle_jumping");

		this.isStuck = false;
	}

	onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.physicsPosition.set(
			dragX + this.dragOffset.x,
			dragY + this.dragOffset.y
		);
	}

	onDragEnd(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.setSpriteOrigin(0.5, 0.5);
		// this.y += this.sprite.height / 2;
		this.sprite.setTexture("turtle_waiting");

		this.dragVelocity.scale(0.5);
		this.physicsVelocity.add(this.dragVelocity);
	}
}
