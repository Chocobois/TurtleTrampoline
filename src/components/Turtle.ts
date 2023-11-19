import { GameScene } from "@/scenes/GameScene";
import { Button } from "./Button";
import constants from '@/constants.json';

const ACCELERATION = 150;
const MAX_SPEED = 400;
const FRICTION = 0.7;
const GROUND_LEVEL = 0.1; //where on the screen is the ground point
const TAPPING_TIMER = 200; // ms
const MAX_SLAP_LENGTH = 500; //cap for smacking force
const SLAP_PERCENT = 5;
const SCALE_SIZE = 1;
const FADETIME = 2000;
const SAVETIME = 3000;
const ASSISTTIME = 1000;
const DEFAULT_BOUNCE = 0.4;
const MAX_DESIRED_BOUNCE = 9;

//states
const IDLE = 0;
const INITIAL = 1;
const BOUNCED = 2;
const LEAVE = 3;
const FALLEN = 4;
const RIP = 5;

console.assert(
	ACCELERATION / (1 - FRICTION) >= MAX_SPEED,
	"Max speed unreachable"
);
const MAX_TIMER = 2000; // max time to aim

export class Turtle extends Button {
	public scene: GameScene;

	//State variables and other Lumie added garbage
	private dribbleCount: number;
	private dribbleState: boolean;
	private hasBeenPickedUp: boolean; //flag for if you picked up turtle, it has a chance of falling down if true
	private fallChance: number; //chance to fall over when landing
	private dropFlag: boolean; //so it doesn't loop sounds when touching ground
	private dragFlag: boolean;
	private bounceFlag: boolean; //have you bounced once on the trampoline
	private timer: number;
	public turtleState: number;
	private saveTimer: number;
	private ripTimer: number;
	private assistTimer: number;
	private beingSaved: boolean;
	private desiredBounces: number;
	public flagDelete: boolean;
	
	// Sprites
	private spriteSize: number;
	public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	private tween: Phaser.Tweens.Tween;
	private t: Phaser.GameObjects.Graphics;
	private saveGUI: Phaser.GameObjects.Graphics;
	private accessories: Phaser.GameObjects.Container;
	private aim: Phaser.GameObjects.Line;

	private bounceAmount: Phaser.GameObjects.Text;

	// Controls
	public velocity: Phaser.Math.Vector2;
	public priorVelocity: Phaser.Math.Vector2;
	private border: { [key: string]: number };
	private isDragged: boolean;
	private dragOffset: Phaser.Math.Vector2;

	constructor(scene: GameScene, x: number, y: number) {
		super(scene, x, y);
		scene.add.existing(this);
		this.scene = scene;

		/* Sprite */
		this.spriteSize = 200;
		this.sprite = this.scene.physics.add.sprite(0, 0, "turtle_waiting");
		this.sprite.setGravityY(constants.physics.gravity);
		this.sprite.setCollideWorldBounds(true, 1, 1, true);
		this.sprite.setBounceY(DEFAULT_BOUNCE);
		this.sprite.setOrigin(0.5, 1.0);
		this.sprite.y += this.spriteSize / 2;
		this.sprite.setScale(this.spriteSize / this.sprite.width);
		this.accessories = this.scene.add.container();
		this.t = scene.add.graphics();
		this.saveGUI = scene.add.graphics();
		this.aim = scene.add.line();
		this.aim.strokeColor = 0xff0000;
		this.desiredBounces = 1+ Math.round(Math.random()*MAX_DESIRED_BOUNCE);
		this.bounceAmount = scene.addText({
			x: this.sprite.x,
			y: this.sprite.y+150,
			size: 50,
			color: "#000",
			text: "",
		});
		this.accessories.add(this.t);
		this.accessories.add(this.aim);
		this.accessories.add(this.saveGUI);
		this.accessories.add(this.bounceAmount);
		this.bounceAmount.setStroke("#FFF", 4);
		this.bounceAmount.setVisible(true);
		this.add(this.accessories);
		this.add(this.sprite);

		/* Controls */
		this.velocity = new Phaser.Math.Vector2(0, 0);
		this.priorVelocity = new Phaser.Math.Vector2(0, 0);
		this.border = {
			left: 100,
			right: scene.W - 100,
			top: 100,
			bottom: scene.H - 100,
		};
		//this.sprite.setBounce(1.1);
		/* Input */
		this.isDragged = false;
		this.dragOffset = new Phaser.Math.Vector2();
		this.bindInteractive(this.sprite, true);
		this.sprite.body.onCollide = true;
		this.sprite.body.onWorldBounds = true;
		this.sprite.on('collide', (body: Phaser.Physics.Arcade.Body) => {
			console.log("Collide")
			this.scene.sound.play("t_rustle", { volume: 0.6 });
		});
		this.turtleState = IDLE;
		this.sprite.setOrigin(0.5, 0.5);
		//drop/drag stuff
		this.dropFlag = false;
		this.bounceFlag = false;
		this.saveTimer = 0;
		this.ripTimer = 0;
		this.assistTimer = 0;
		this.flagDelete = false;
		this.beingSaved = false;
		this.scene.physics.world.on('collide', (gameObject1: Phaser.GameObjects.GameObject, gameObject2: Phaser.GameObjects.GameObject, body1: Phaser.Physics.Arcade.Body, body2: Phaser.Physics.Arcade.Body) =>
			{
				if(body1 == this.sprite.body || body2 == this.sprite.body)
				{
					this.scene.sound.play("t_rustle");
					this.desiredBounces--;
				}
			}
		);
		this.scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body, up: boolean, down: boolean, left: boolean, right: boolean) =>
			{
				if(down)
				{
					if(this.dropFlag && body == this.sprite.body) {
						this.fallOver();
						this.dropFlag = false;
					}
				} else {
					//permutate the velocity a bit on bounce
					this.sprite.body.velocity.x *= (0.9+(Math.random()*0.1));
					this.sprite.body.velocity.y *= (0.9+(Math.random()*0.1));
				}
			}
		);


	}

	update(time: number, delta: number) {
		// Animation (Change to this.sprite.setScale if needed)
		const squish = 0.02 * Math.sin((6 * time) / 1000);
		this.setScale(1.0 + squish, 1.0 - squish);

		//how much time left to move turtles
		this.updateTimers(delta);
		this.updateGraphics(delta);

	}

	updateTimers(delta: number)
	{
		if(this.timer > 0)
		{
			this.timer -= delta;
			if (this.timer <= 0)
			{
				this.timer = 0;
				this.sprite.setGravityY(constants.physics.gravity);
				this.t.clear();	
				this.scene.clearLineGraphics();
				this.setSlappedVelocity();
			}
		}
		if(this.saveTimer > 0)
		{
			if(!this.beingSaved) {
				this.saveTimer -= delta;
				if (this.saveTimer <= 0) {
					this.processRip();
				}
			} else {
				this.assistTimer += delta;
				if (this.assistTimer >= ASSISTTIME)
				{
					this.processSave();
				}
			}

		}
		if(this.ripTimer > 0)
		{
			this.ripTimer -= delta;
			this.setAlpha(this.ripTimer/FADETIME);
			if(this.ripTimer <= 0) {
				this.setAlpha(0);
				this.setVisible(false);
				this.flagDelete;
			}
		}
	}
	updateGraphics(delta: number)
	{
		if(this.desiredBounces > 0)
		{
			this.bounceAmount.setColor("blue");
			this.bounceAmount.setText(this.desiredBounces.toString());
		} else if (this.desiredBounces == 0)
		{
			this.bounceAmount.setColor("green");
			this.bounceAmount.setText("Perfect!");
		} else {
			this.bounceAmount.setColor("red");
			this.bounceAmount.setText("!!!");
		}

		this.bounceAmount.setX(this.sprite.x);
		this.bounceAmount.setY(this.sprite.y-150);
		switch(this.turtleState) {
			case BOUNCED: {
				if(this.timer > 0)
				{
					this.t.clear();
					this.t.slice(this.sprite.x,this.sprite.y-155,50*SCALE_SIZE,Phaser.Math.DegToRad(0-90),Phaser.Math.DegToRad(360-(360*(this.timer/MAX_TIMER))-90),true,0);
					this.t.fillStyle(0x41F835, 1);
					this.t.fillPath();
					this.scene.drawLineToPointer(this.x+this.sprite.x,this.y+this.sprite.y,MAX_SLAP_LENGTH);
					//this.scene.add.image(this.scene.input.activePointer.x, this.scene.input.activePointer.y,'coin',0);
				}
				else{
					this.t.clear();
				}
				return;
			} case FALLEN : {
				this.t.clear();
				this.saveGUI.clear();
				this.bounceAmount.setVisible(false);
				if(!this.beingSaved){
					this.saveGUI.lineStyle(16, 0xFF2323);
				} else {
					this.saveGUI.lineStyle(16, 0xFF2323, 0.5);
				}
				this.saveGUI.beginPath();
				this.saveGUI.arc(this.sprite.x, this.sprite.y, 175, Phaser.Math.DegToRad(0-90), Phaser.Math.DegToRad(360-(360*(this.saveTimer/SAVETIME))-90), true, 0);
				this.saveGUI.strokePath();
				this.saveGUI.closePath();
				if(this.beingSaved) {
					this.drawSaveDots();
				}
				return;

			}
		}
	}

	onDown(pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData): void {
		switch(this.turtleState)
		{
			case IDLE:
			{
				this.turtleState = INITIAL;
			}
			case INITIAL:
			{
				this.sprite.setGravityY(0);
				this.sprite.setVelocity(0, 0);
				this.scene.sound.play("t_rustle", { volume: 0.6 });
				this.dragFlag = true;
				return;
			}
			case BOUNCED: 
			{
				//freeze the turtle and draw the aiming line
				this.sprite.setGravityY(0);
				this.priorVelocity.x = this.sprite.body.velocity.x;
				this.priorVelocity.y = this.sprite.body.velocity.y;
				this.sprite.setVelocity(0, 0);
				this.scene.sound.play("t_rustle", { volume: 0.6 });
				this.timer = MAX_TIMER;
				return;
			}
		}
	}

	onDragStart(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		if(this.turtleState == INITIAL || this.turtleState == IDLE)
		{
			this.isDragged = true;
			this.dragOffset.set(this.x, this.y);
			this.sprite.setTexture("turtle_jumping");
		}
		else if (this.turtleState == BOUNCED)
		{
			
		} else if (this.turtleState == FALLEN)
		{
			this.assistTimer = 0;
			this.beingSaved = true;
		}
	}

	onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number) {
		if(this.turtleState == INITIAL || this.turtleState == IDLE)
		{
			super.onDrag(pointer, dragX, dragY);
			const offsetDifference = new Phaser.Math.Vector2(
				(this.originX - this.sprite.originX) * this.scaleX * this.sprite.width,
				(this.originY - this.sprite.originY) * this.scaleY * this.sprite.height
			)
			this.setPosition(
				dragX + this.dragOffset.x + offsetDifference.x,
				dragY + this.dragOffset.y + offsetDifference.y
			);
		}

	}

	onUp()
	{
		//switch to this after turtles have bounced
	}

	drawSaveDots()
	{
		let p = this.assistTimer/ASSISTTIME;
		this.saveGUI.fillStyle(0xFFFFFF,1);
		this.saveGUI.fillCircle(this.sprite.x-150, this.sprite.y-120, 40);
		this.saveGUI.fillCircle(this.sprite.x-50, this.sprite.y-120, 40);
		this.saveGUI.fillCircle(this.sprite.x+50, this.sprite.y-120, 40);
		this.saveGUI.fillCircle(this.sprite.x+150, this.sprite.y-120, 40);
		this.saveGUI.fillStyle(((p > 0.24) ? 0x00FF6B : 0xA6A6A6));
		this.saveGUI.fillCircle(this.sprite.x-150, this.sprite.y-120, 32);
		this.saveGUI.fillStyle(((p > 0.48) ? 0x00FF6B : 0xA6A6A6));
		this.saveGUI.fillCircle(this.sprite.x-50, this.sprite.y-120, 32);
		this.saveGUI.fillStyle(((p > 0.72) ? 0x00FF6B : 0xA6A6A6));
		this.saveGUI.fillCircle(this.sprite.x+50, this.sprite.y-120, 32);
		this.saveGUI.fillStyle(((p > 0.96) ? 0x00FF6B : 0xA6A6A6));
		this.saveGUI.fillCircle(this.sprite.x+150, this.sprite.y-120, 32);
	}
	
	fallOver()
	{
		//this.sprite.rotation = Math.PI;
		this.sprite.setBounceY(0);
		this.sprite.setVelocity(0, 0);
		this.sprite.setTexture("turtle_stuck");
		this.scene.sound.play("pichuun");
		this.scene.explode(this.sprite.x+this.x, this.sprite.y+this.y);
		this.turtleState = FALLEN;
		this.saveTimer = SAVETIME;
	}

	processRip()
	{
		this.t.clear();
		this.saveGUI.clear();
		this.assistTimer = 0;
		this.beingSaved = false;
		this.sprite.setTexture("turtle_rip");
		this.turtleState = RIP;
		this.ripTimer = FADETIME;
		this.scene.sound.play("rip");
		this.removeInteractive();
		this.sprite.removeInteractive();
	}

	processSave()
	{
		this.t.clear();
		this.saveGUI.clear();
		this.assistTimer = 0;
		this.saveTimer = 0;
		this.beingSaved = false;
		this.sprite.setTexture("turtle_waiting");
		this.turtleState = RIP;
		this.ripTimer = FADETIME;
		this.scene.sound.play("saved");
		this.removeInteractive();
		this.sprite.removeInteractive();
	}

	onDragEnd(
		pointer: Phaser.Input.Pointer,
		dragX: number,
		dragY: number,
		dropped: boolean
	) {
		if(this.turtleState == INITIAL || this.turtleState == IDLE)
		{
			this.isDragged = false;
			this.sprite.setGravityY(constants.physics.gravity)
			//this.sprite.setTexture("turtle_waiting");
			this.dropFlag = true;
			this.dragFlag = false;
			this.t.clear();
			this.turtleState = BOUNCED;
		} else if (this.turtleState == BOUNCED)	{
			if(this.timer > 0)
			{
				this.dropFlag = true;
				this.timer = 0;
				this.sprite.setGravityY(constants.physics.gravity);
				this.t.clear();	
				this.scene.clearLineGraphics();
				this.setSlappedVelocity();
			}
		} else if (this.turtleState == FALLEN) {
			this.beingSaved = false;
			this.assistTimer = 0;
		}
		
	}

	drawLineToPointer()
	{
		let bx = this.sprite.x+this.x;
		let by = this.sprite.y+this.y;
		let p = Phaser.Math.Angle.Between(bx,by,this.scene.input.activePointer.x, this.scene.input.activePointer.y);
		this.t.lineStyle(4, 0xff0000, 1);
		if(Phaser.Math.Distance.Between(bx,by,this.scene.input.activePointer.x, this.scene.input.activePointer.y) > MAX_SLAP_LENGTH)
		{
			this.t.lineBetween(bx, by, bx+MAX_SLAP_LENGTH*Math.cos(p), by+MAX_SLAP_LENGTH*Math.sin(p));
		} else {
			this.t.lineBetween(bx, by, this.scene.input.activePointer.x, this.scene.input.activePointer.y);			
		}
	}

	setSlappedVelocity()
	{
		this.scene.sound.play("slap");
		let p = Phaser.Math.Angle.Between(this.sprite.x+this.x, this.sprite.y+this.y, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
		let dist = Phaser.Math.Distance.Between(this.sprite.x+this.x, this.sprite.y+this.y, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
		if (dist > MAX_SLAP_LENGTH)
		{
			this.sprite.setVelocity(this.priorVelocity.x+(SLAP_PERCENT*MAX_SLAP_LENGTH*Math.cos(p)), this.priorVelocity.y+(SLAP_PERCENT*MAX_SLAP_LENGTH*Math.sin(p)));
		} else {
			this.sprite.setVelocity(this.priorVelocity.x+(SLAP_PERCENT*dist*Math.cos(p)), this.priorVelocity.y+(SLAP_PERCENT*dist*Math.sin(p)));
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
}
