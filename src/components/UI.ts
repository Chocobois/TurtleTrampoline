import { GameScene } from "@/scenes/GameScene";

export class UI extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private panel: Phaser.GameObjects.Container;
	private background: Phaser.GameObjects.Image;
	private text: Phaser.GameObjects.Text;

	constructor(scene: GameScene) {
		super(scene, 0, 0);
		scene.add.existing(this);
		this.scene = scene;

		const panelHeight = 150;

		this.panel = this.scene.add.container(0, 0);
		this.add(this.panel);

		this.background = this.scene.add.image(0, 0, "hud");
		this.background.setScale(panelHeight / this.background.height);
		this.background.setAlpha(0.2);
		this.panel.add(this.background);

		this.text = this.scene.addText({
			x: -50,
			y: 0,
			size: 60,
			color: "#FFFFFF",
			text: "Score: 123",
		});
		this.text.setStroke("black", 8);
		this.text.setOrigin(0, 0.5);
		this.panel.add(this.text);

		this.panel.setPosition(
			this.scene.W - this.background.displayWidth / 2 - 30,
			this.background.displayHeight / 2 + 30
		);
	}

	update(time: number, delta: number) {}
}
