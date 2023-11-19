import { GameScene, State } from "@/scenes/GameScene";
import { Button } from "@/components/Button";
import { Shopper } from "@/components/Shopper";
import { ShopOwner } from "@/components/ShopOwner";
import { ShopItem } from "@/components/ShopItem";

import Vector2 = Phaser.Math.Vector2;

type Item = {
	title: string[];
	description: string[];
	image: string[];
	prices: number[];
	onBuy: (() => null | null)[];
};

const shopItems: Item[] = [
	{
		title: ["Spring"],
		description: ["Enhances the bounce"],
		image: ["spring"],
		prices: [100],
		onBuy: []
	},
	{
		title: ['Nail'],
		description: ['Got to keep the turt down'],
		image: ['nail'],
		prices: [100],
		onBuy: []
	},
	{
		title: ['Screw'],
		description: ['Tighten those springs'],
		image: ['screw'],
		prices: [100],
		onBuy: []
	},
	{
		title: ['Spring'],
		description: ['Enhances the bounce'],
		image: ['spring'],
		prices: [100],
		onBuy: []
	},
];

const itemPositions: Vector2[] = [
	new Vector2(0, 0),
	new Vector2(1, 0),
	new Vector2(2, 0),
	new Vector2(3, 0),
	new Vector2(0, 2),
];

export class ShopState extends Phaser.GameObjects.Container {
	public scene: GameScene;

	private background: Phaser.GameObjects.Image;
	private someButton: Button;

	private itemsForSale: Item[];
	private shopper: Shopper;

	private selectedItem: ShopItem | undefined;

	private buyButton: Button;

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
		this.scene.events.addListener("state_Shop", () => {
			this.populateShop();
		});

		this.shopper = new Shopper(scene, 0.5, 0.5);
		this.add(this.shopper);

		this.buyButton = new Button(this.scene, this.scene.W * 0.6, this.scene.H * 0.6);
		const buySign = this.scene.add.sprite(0, 0, 'buy_button').setOrigin(0.3, 0.35);
		this.buyButton.add(buySign);
		this.buyButton.add(this.scene.add.text(0, 0, 'BUY', {fontSize: 80, fontStyle: 'bold', align: 'center'}));
		this.buyButton.bindInteractive(buySign, true);
		this.buyButton.on('click', () => {
			if(this.selectedItem)
				console.log('Buying', this.selectedItem);
			else
				console.log('Select item first')
		});
		this.add(this.buyButton);

	}

	populateShop() {
		this.itemsForSale = shopItems;
		const Wstart = this.scene.W * 0.5;
		const Hstart = this.scene.H * 0.375;
		const Wdist = this.scene.W * 0.13;
		const Hdist = this.scene.H * 0.15;

		this.itemsForSale = shopItems;

		const items = this.itemsForSale.map((item, i) => 
			new ShopItem(this.scene, Wstart + itemPositions[i].x * Wdist, Hstart + itemPositions[i].y * Hdist, item.image[0])
		);

		items.forEach((item) => {
			this.add(item);
			item.on('click', () => {
				this.selectedItem = item;
			});
		});
	}

	update(time: number, delta: number) {
		if (!this.visible) return;
		this.shopper.update(time, delta);
	}
}
