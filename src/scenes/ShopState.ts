import { GameScene, State } from "@/scenes/GameScene";
import { Button } from "@/components/Button";
import { Shopper } from "@/components/Shopper";
import { ShopOwner } from "@/components/ShopOwner";

type Item = {
	title: string[];
	description: string[];
	image: string[];
	prices: number[],
	onBuy: (() => null | null)[]
}

const shopItems: Item[] = [
	/*
	{
		name: 'Duct Tape',
		description: 'Will fix your trampoline 100% of the time!',
		image: 'tape',
		prices: [500],
		onBuy: []
	},
	*/
	{
		title: ['Spring'],
		description: ['Enhances the bounce'],
		image: ['spring'],
		prices: [100],
		onBuy: []
	}
];

import Vector2 = Phaser.Math.Vector2;

const itemPositions: Vector2[] = [
	new Vector2( 0, 0 ),
	new Vector2( 1, 0 ),
	new Vector2( 2, 0 ),
	new Vector2( 3, 0 ),
	new Vector2( 0, 2 ),
];


export class ShopState extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private background: Phaser.GameObjects.Image;
	private someButton: Button;

	private itemsForSale: Item[];
	private shopper: Shopper;
	private owner: ShopOwner;

	constructor(scene: GameScene) {
		super(scene, 0, 0);
		this.scene = scene;
		this.scene.add.existing(this);

		this.background = scene.add.image(0, 0, "shop");
		this.background.setOrigin(0);
		scene.fitToScreen(this.background);
		this.add(this.background);

		this.someButton = new Button(scene, 100, 100);
		this.add(this.someButton);
		let buttonText = scene.addText({
			size: 50,
			weight: 900,
			color: "black",
			text: "Back",
		});
		buttonText.setOrigin(0.5);
		this.someButton.add(buttonText);
		this.someButton.bindInteractive(buttonText);
		this.someButton.on("click", () => {
			this.scene.setState(State.Overworld);
		});

		this.itemsForSale = [];
		this.scene.events.addListener('state_Shop', () => {
			this.populateShop();
		});

		this.shopper = new Shopper(scene, 0.5, 0.5);
		this.add(this.shopper);

		this.owner = new ShopOwner(scene, 0.5, 0.5);
		this.add(this.owner);
	}

	populateShop() {
		this.itemsForSale = shopItems;
		const Wstart = this.scene.W * 0.5;
		const Hstart = this.scene.H * 0.375;
		const Wdist = this.scene.W * 0.13;
		const Hdist = this.scene.H * 0.15;

		const items = itemPositions.map((pos, i) =>
			this.scene.add.image(Wstart + pos.x * Wdist, Hstart + pos.y * Hdist, 'screw').setScale(1.1)
		);
		items.forEach(this.add.bind(this));
	}

	update(time: number, delta: number) {
		if (!this.visible) return;
		this.shopper.update(time, delta);
		this.owner.update(time, delta);
	}
}
