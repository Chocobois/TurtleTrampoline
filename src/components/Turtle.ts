import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from "@/constants.json";
import { Trampoline } from "./Trampoline";

const ACCELERATION = 150;
const MAX_SPEED = 400;
const FRICTION = 0.7;
const TAPPING_TIMER = 200; // ms
const MAX_FADE = 2000;
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
	private flailTimer: number;
	private debug: Phaser.GameObjects.Graphics;

	// Controls
	public physicsPosition: Phaser.Math.Vector2;
	public physicsVelocity: Phaser.Math.Vector2;
	public dragVelocity: Phaser.Math.Vector2;
	public velocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };
	private dragOffset: Phaser.Math.Vector2;

	// Walking
	private ground: Phaser.Geom.Rectangle;
	private onGround: boolean;
	private walkTarget: Phaser.Geom.Point;

	//Score
	private baseScore: number;
	private multiplier: number;
	private desiredBounces: number;
	private totalBounces: number;
	private bounceDisplay: Phaser.GameObjects.Graphics;

	//Fade/leaving variables
	private fadeTimer: number;
	public leaving: boolean;
	private deleteFlag: boolean;

	// Jumping
	private trampoline: Trampoline;
	private feetOffset: number;
	private lostBalance: boolean;
	public hasCrashed: boolean;
	private jumpTarget: Phaser.Geom.Point;
	private jumpTargetTween: Phaser.Tweens.Tween;
	private maxJumpSpeed: number;
	public bounceCount: number;

	constructor(
		scene: GameScene,
		x: number,
		y: number,
		trampoline: Trampoline,
		ground: Phaser.Geom.Rectangle
	) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		this.debug = this.scene.add.graphics().setDepth(1000);

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.add.sprite(0, 0, "turtle_waiting");
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.sprite.play("turtle_waiting");
		// this.add(this.sprite);

		this.flailTimer = 0;

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

		/* Walking */
		this.walkTarget = new Phaser.Geom.Point();
		this.ground = ground;
		this.onGround = true;
		this.newWalkTarget();

		/* Trampoline */
		this.trampoline = trampoline;
		this.feetOffset = 0;
		this.lostBalance = false;
		this.hasCrashed = false;
		this.jumpTarget = new Phaser.Geom.Point();
		this.newJumpTarget();
		this.maxJumpSpeed = Phaser.Math.RND.between(27, 31);
		this.bounceCount = 0;
		this.baseScore = 50 + Math.random() * 100;
		this.multiplier = 1.0;
		this.leaving = false;
		this.fadeTimer = 0;
		this.deleteFlag = false;
		this.desiredBounces = 5 + Math.round(Math.random() * 15);
		this.totalBounces = 0;
		this.bounceDisplay = scene.add.graphics();
		this.add(this.bounceDisplay);

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
				// Bounce on trampoline rug
				//this.scene.addScore(1);
				if (
					this.physicsPosition.y + this.feetOffset >=
					this.trampoline.zone.bottom
				) {
					let maxSpeed = this.maxJumpSpeed;
					let landSpeed = Math.max(this.physicsVelocity.y, 2);
					let jumpSpeed =
						Phaser.Math.Easing.Sine.Out(landSpeed / maxSpeed) * maxSpeed;
					this.physicsVelocity.y = -Math.min(jumpSpeed, maxSpeed);

					if (jumpSpeed > maxSpeed - 10) {
						this.bounceCount += 1;
						//this.scene.addScore(1);
						this.multiplier += 0.05;
						if (this.totalBounces >= this.desiredBounces) {
							if (this.multiplier >= 0.5) {
								this.multiplier -= 0.05;
							}
						}
						this.totalBounces += 1;
						if (this.scene.game.hasFocus) {
							const relSpeed = this.maxJumpSpeed - jumpSpeed;
							this.scene.sound.play(relSpeed < 1e-5 ? "spring" : "spring2", {
								volume: -0.02 * relSpeed + 0.3,
							});
						}
						this.emit("bounce");
					}
				}
				// In air above trampoline
				else {
					// Friction
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
						this.newWalkTarget();
					}
				}
			}

			// Grounded
			else if (this.isGrounded) {
				// Walking
				if (!this.lostBalance) {
					if (!this.onGround) {
						this.emit("land");
						this.physicsPosition.y = this.border.bottom - this.feetOffset;
						this.physicsVelocity.y = 0;
					}
					this.onGround = true;

					const walkDirection = new Phaser.Math.Vector2(
						this.walkTarget.x - this.physicsPosition.x,
						this.walkTarget.y - this.physicsPosition.y - this.feetOffset
					);
					if (walkDirection.lengthSq() > 5) {
						walkDirection.limit(1.5); // Walking speed
						this.physicsVelocity.x += walkDirection.x;
						this.physicsVelocity.y += walkDirection.y;
					}

					if (this.totalBounces > 0) {
						if (this.fadeTimer > 0 && this.leaving) {
							this.fadeTimer -= delta;
							if (this.fadeTimer <= 0) {
								this.fadeTimer = 0;
								this.deleteFlag = true;
							}
							this.sprite.setAlpha(this.fadeTimer / MAX_FADE);
						} else if (!this.leaving) {
							this.turtleLeave();
						}
					}
				}

				// Friction
				this.physicsVelocity.scale(0.5);
				if (this.lostBalance && !this.hasCrashed) {
					this.hasCrashed = true;
					this.physicsPosition.y = this.border.bottom - this.feetOffset;
					this.physicsVelocity.y = 0;
					this.scene.sound.play("trip", { volume: 0.25 });
					this.scene.addDust(this.x, this.y - 90);
					this.emit("crashed");
				}
			}

			// Airborn
			else {
				this.physicsVelocity.x = 0.97 * this.physicsVelocity.x;
				this.physicsVelocity.y += 1;

				if (this.isFallingTooQuickly) {
					this.lostBalance = true;
					this.newWalkTarget();
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
		this.flailTimer = Math.max(0, (this.flailTimer ?? 0) - delta);

		const scale = this.spriteSize / this.sprite.width;
		const facing = -Math.sign(this.physicsVelocity.x) || 1;
		this.sprite.setScale(scale * facing, scale);
		this.sprite.angle = this.dragVelocity.x;

		if (this.hold || this.isOnTrampoline) {
			this.sprite.play("turtle_jumping", true);
		} else if (this.isGrounded) {
			if (this.lostBalance) {
				// if (this.flailTimer > 0) {
				// 	const variant = this.flailTimer < 150 ? "2" : "3";
				// 	this.sprite.play("turtle_stuck" + variant, true);
				// } else {
				// 	this.sprite.play("turtle_stuck", true);
				// }
				this.sprite.play("turtle_stuck", true);
				this.setSpriteOrigin(0.5, 0.8);
				this.sprite.angle = 10 * Math.sin((7 * time) / 1000);
				if (
					this.scene.game.getFrame() % 400 ==
					Phaser.Math.RND.integerInRange(0, 400)
				) {
					this.flailTimer = 300;
					if (this.scene.game.hasFocus)
						this.scene.sound.play("flail", {
							volume: 0.2,
							pan: this.pan * 0.3,
						});
				}
			} else if (this.onGround && this.physicsVelocity.lengthSq() > 0.1) {
				this.sprite.play("turtle_walking", true);
			} else {
				this.sprite.play("turtle_waiting", true);
				if (Math.random() < 0.01) {
					this.newWalkTarget();
				}
			}
		} else {
			if (this.lostBalance) {
				this.sprite.play("turtle_scared", true);
			} else {
				this.sprite.play("turtle_jumping", true);
			}
		}

		//UI stuff
		this.drawBounceDisplay();
		// Depth sorting
		this.sprite.setPosition(this.x, this.y);
		let depth = 100 + (this.y + this.feetOffset) / 100;
		if (this.isOnTrampoline) {
			depth += this.jumpTarget.y / 100;
		}
		if (this.hold) depth += 100;
		this.sprite.setDepth(depth);

		// let feetX = this.physicsPosition.x;
		// let feetY = this.physicsPosition.y + this.feetOffset;
		// this.debug.clear();
		// this.debug.fillStyle(0xff0000);
		// this.debug.lineStyle(2, 0xff0000);
		// this.debug.fillEllipse(feetX, feetY, 20, 20);
		// this.debug.fillEllipse(this.walkTarget.x, this.walkTarget.y, 20, 20);
		// this.debug.beginPath();
		// this.debug.moveTo(feetX, feetY);
		// this.debug.lineTo(this.walkTarget.x, this.walkTarget.y);
		// this.debug.stroke();
	}

	drawBounceDisplay() {
		if (this.isOnTrampoline) {
			this.bounceDisplay.setVisible(true);
			this.bounceDisplay.clear();
			if (this.totalBounces > 0 && this.totalBounces < this.desiredBounces) {
				this.bounceDisplay.lineStyle(24, 0xffffff, 0.75);
				this.bounceDisplay.beginPath();
				this.bounceDisplay.arc(
					0,
					0,
					175,
					Phaser.Math.DegToRad(0 - 90),
					Phaser.Math.DegToRad(
						360 - 360 * (this.totalBounces / this.desiredBounces) - 90
					),
					true,
					0
				);
				this.bounceDisplay.strokePath();
				this.bounceDisplay.closePath();
				this.bounceDisplay.lineStyle(16, 0x4bff55, 1.0);
				this.bounceDisplay.beginPath();
				this.bounceDisplay.arc(
					0,
					0,
					175,
					Phaser.Math.DegToRad(0 - 90),
					Phaser.Math.DegToRad(
						360 - 360 * (this.totalBounces / this.desiredBounces) - 90
					),
					true,
					0
				);
				this.bounceDisplay.strokePath();
				this.bounceDisplay.closePath();
			} else if (this.totalBounces >= this.desiredBounces) {
				this.bounceDisplay.lineStyle(24, 0xffffff, 0.75);
				this.bounceDisplay.beginPath();
				this.bounceDisplay.arc(
					0,
					0,
					175,
					Phaser.Math.DegToRad(0 - 90),
					Phaser.Math.DegToRad(360 - 90),
					true,
					0.01
				);
				this.bounceDisplay.strokePath();
				this.bounceDisplay.closePath();
				this.bounceDisplay.lineStyle(
					16,
					this.totalBounces == this.desiredBounces ? 0x4bff55 : 0xff1212,
					1.0
				);
				this.bounceDisplay.beginPath();
				this.bounceDisplay.arc(
					0,
					0,
					175,
					Phaser.Math.DegToRad(0 - 90),
					Phaser.Math.DegToRad(360 - 90),
					true,
					0.01
				);
				this.bounceDisplay.strokePath();
				this.bounceDisplay.closePath();
			}
		} else {
			this.bounceDisplay.setVisible(false);
			this.bounceDisplay.clear();
		}
	}
	turtleLeave() {
		this.leaving = true;
		this.disableInteractive();
		this.sprite.disableInteractive();
		this.fadeTimer = MAX_FADE;
		let s = Math.round(this.multiplier * this.baseScore);
		this.scene.addScore(s);
		this.scene.sound.play("score", { volume: 1.0 });
		this.scene.addTextParticle(
			this.x,
			this.y - 70,
			"green",
			`+ $` + `${s}!`,
			80
		);
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

	doABarrelRoll(duration = 300, playSound = true) {
		if (!this.tween || !this.tween.isActive()) {
			this.tween = this.scene.tweens.add({
				targets: this.sprite,
				scaleX: {
					from: this.sprite.scaleX,
					to: -this.sprite.scaleX,
					ease: "Cubic.InOut",
				},
				duration,
				yoyo: true,
			});
			if (playSound)
				this.scene.sound.play("trick", {
					volume: 0.4,
					pan: this.pan * 0.4,
				});
		}
	}

	setSpriteOrigin(ox: number, oy: number) {
		this.sprite.x += (ox - this.sprite.originX) * this.sprite.displayWidth;
		this.sprite.y += (oy - this.sprite.originY) * this.sprite.displayHeight;
		this.sprite.setOrigin(ox, oy);
	}

	newWalkTarget() {
		if (this.lostBalance) {
			this.walkTarget.x = this.x;
			this.walkTarget.y = this.ground.bottom;
		}
		else {
			Phaser.Geom.Rectangle.Random(this.ground, this.walkTarget);
			if (this.x < this.scene.CX) {
				this.walkTarget.y = this.ground.bottom;
			}
		}
		this.border.bottom = this.walkTarget.y;
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
		return (
			this.onGround ||
			this.physicsPosition.y + this.feetOffset >= this.border.bottom
		);
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
		this.onGround = false;
		this.lostBalance = false;
		this.hasCrashed = false;
		this.bounceCount = 0;
		this.onDrag(pointer, this.x, this.y);
		this.scene.sound.play("grab", { volume: 0.6, pan: this.pan * 0.2 });
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

		this.newWalkTarget();

		const pV = this.physicsVelocity;

		if (pV.length() > 75 && Math.abs(pV.x) > Math.abs(pV.y)) {
			this.scene.sound.play("toss", { volume: 0.5, pan: this.pan * 0.3 });
			this.scene.time.addEvent(
				this.scene.particles.sparkleTrail(this, 40, 20, 0xddaa00)
			);
			this.doABarrelRoll(100, false);
		} else {
			let intensity = 1;
			if (pV.length() > 25) {
				intensity = 2;
			} else if (!this.isOnTrampoline) {
				if (pointer.upY < 364) intensity++;
				if (pointer.upY < 180) intensity++;
			}
			this.scene.sound.play("letgo" + intensity, {
				volume: intensity / 10 + 0.5,
				rate: ((this.scene.H - pointer.upY) / this.scene.H) * 0.4 + 0.7,
				pan: this.pan * 0.2,
			});
		}
	}
}
