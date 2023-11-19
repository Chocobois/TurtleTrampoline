import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from "@/constants.json";
import { Trampoline } from "./Trampoline";

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
	private debug: Phaser.GameObjects.Ellipse;
	private debugLand: Phaser.GameObjects.Ellipse;

	// Controls
	public physicsPosition: Phaser.Math.Vector2;
	public physicsVelocity: Phaser.Math.Vector2;
	public dragVelocity: Phaser.Math.Vector2;
	public velocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };
	private dragOffset: Phaser.Math.Vector2;

	// Jumping
	private trampoline: Trampoline;
	private feetOffset: number;
	private lostBalance: boolean;
	private hasCrashed: boolean;
	private jumpTarget: Phaser.Geom.Point;
	private jumpTargetTween: Phaser.Tweens.Tween;
	public bounceCount: number;

	constructor(scene: GameScene, x: number, y: number, trampoline: Trampoline) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		this.debugLand = this.scene.add
			.ellipse(0, 0, 30, 30, 0xff0000)
			.setDepth(1000);
		this.debug = this.scene.add.ellipse(0, 0, 20, 20, 0x007700).setDepth(1000);

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.add.sprite(0, 0, "turtle_waiting");
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		// this.add(this.sprite);

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

		/* Trampoline */
		this.trampoline = trampoline;
		this.feetOffset = 0;
		this.lostBalance = false;
		this.hasCrashed = false;
		this.jumpTarget = new Phaser.Geom.Point();
		this.newJumpTarget();
		this.bounceCount = 0;

		/* Input */
		this.dragOffset = new Phaser.Math.Vector2();
		this.bindInteractive(this.sprite, true);
	}

	update(time: number, delta: number) {
		// Feet
		this.updateFeetOffset();

		// "Physics"
		if (!this.hold) {
			// Trampoline
			if (this.isOnTrampoline) {
				this.sprite.setDepth(100 * Math.random());

				// Bounce on trampoline rug
				if (
					this.physicsPosition.y + this.feetOffset >=
					this.trampoline.zone.bottom
				) {
					let maxSpeed = 30;
					let landSpeed = Math.max(this.physicsVelocity.y, 2);
					let jumpSpeed =
						Phaser.Math.Easing.Sine.Out(landSpeed / maxSpeed) * maxSpeed;
					this.physicsVelocity.y = -Math.min(jumpSpeed, maxSpeed);

					if (jumpSpeed > maxSpeed - 10) {
						this.bounceCount += 1;
						this.emit("bounce");
					}
				}
				// In air above trampoline
				else {
					// Driction
					this.physicsVelocity.x = 0.97 * this.physicsVelocity.x;

					// Drift towards desired location on trampoline
					if (this.bounceCount > 0) {
						this.physicsPosition.x +=
							0.01 * (this.jumpTarget.x - this.physicsPosition.x);

						if (this.physicsPosition.y < 300) {
							if (Math.random() < 0.01) {
								this.newJumpTarget();
							}
						}
					}

					this.physicsVelocity.y += 1;
					if (this.isFallingTooQuickly) {
						this.lostBalance = true;
					}
				}
			}

			// Grounded
			else if (this.isGrounded) {
				// Friction
				this.physicsVelocity.x = 0.5 * this.physicsVelocity.x;
				// Stop fall
				this.physicsVelocity.y = 0;
				this.physicsPosition.y = this.border.bottom - this.feetOffset;
				if (this.lostBalance && !this.hasCrashed) {
					this.hasCrashed = true;
					this.scene.addDust(this.x+this.sprite.x, this.y+this.sprite.y);
					this.emit("crashed");
				}
			}

			// Airborn
			else {
				this.physicsVelocity.x = 0.97 * this.physicsVelocity.x;
				this.physicsVelocity.y += 1;

				if (this.isFallingTooQuickly) {
					this.lostBalance = true;
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
		this.debug.setPosition(this.x, this.physicsPosition.y + this.feetOffset);
		this.debugLand.setPosition(this.jumpTarget.x, this.jumpTarget.y);

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

		if (this.isOnTrampoline) {
			this.sprite.setTexture("turtle_jumping");
		} else if (this.isGrounded) {
			if (this.lostBalance) {
				this.sprite.setTexture("turtle_stuck");
				this.setSpriteOrigin(0.5, 0.8);
				this.sprite.angle = 10 * Math.sin((7 * time) / 1000);
			} else {
				this.sprite.setTexture("turtle_waiting");
			}
		} else {
			if (this.lostBalance) {
				this.sprite.setTexture("turtle_scared");
			} else {
				this.sprite.setTexture("turtle_jumping");
			}
		}

		// Depth sorting
		this.sprite.setPosition(this.x, this.y);
		let depth = this.jumpTarget.y;
		if (this.hold) depth += 100;
		this.sprite.setDepth(depth);
	}

	/* Jumping */

	updateFeetOffset() {
		// Stuck on back on ground
		if (this.lostBalance) {
			this.feetOffset = 0.0 * this.sprite.displayHeight;
		}
		// Trampoline landing location
		else if (this.isOnTrampoline) {
			this.feetOffset =
				this.trampoline.zone.bottom -
				this.jumpTarget.y +
				0.4 * this.sprite.displayHeight;
		}
		// Standing on ground
		else {
			this.feetOffset = 0.4 * this.sprite.displayHeight;
		}
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

	newJumpTarget() {
		let target = Phaser.Geom.Ellipse.Random(this.trampoline.surface);

		if (!this.jumpTargetTween || !this.jumpTargetTween.isActive()) {
			this.jumpTargetTween = this.scene.tweens.add({
				targets: this.jumpTarget,
				x: {
					from: this.jumpTarget.x,
					to: target.x,
				},
				y: {
					from: this.jumpTarget.y,
					to: target.y,
				},
				ease: "Cubic.Out",
				duration: 500,
			});
		}
	}

	get isGrounded() {
		return this.physicsPosition.y + this.feetOffset >= this.border.bottom;
	}

	get isOnTrampoline(): boolean {
		return (
			!this.lostBalance &&
			this.trampoline.zone.contains(this.x, this.y + this.feetOffset - 10)
		);
	}

	get isFallingTooQuickly(): boolean {
		if (this.isOnTrampoline) {
			// Random chance to fail their jump
			return (
				this.physicsVelocity.y < -10 &&
				this.physicsVelocity.y > -15 &&
				Math.random() < 0.0
			);
		} else {
			// When falling after player drops them
			return this.physicsVelocity.y > 25;
		}
	}

	/* Input */

	onDragStart(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.dragOffset.set(dragX, dragY);
		this.lostBalance = false;
		this.hasCrashed = false;
		this.bounceCount = 0;
		this.onDrag(pointer, this.x, this.y);
	}

	onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.setSpriteOrigin(0.5, 0.3);
		this.physicsPosition.set(
			dragX + this.dragOffset.x,
			dragY + this.dragOffset.y
		);
	}

	onDragEnd(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		this.setSpriteOrigin(0.5, 0.5);
		// this.y += this.sprite.height / 2;

		this.dragVelocity.scale(0.5);
		this.physicsVelocity.add(this.dragVelocity);
	}
}
