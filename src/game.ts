import Phaser from "phaser";
import { PreloadScene } from "@/scenes/PreloadScene";
import { TitleScene } from "@/scenes/TitleScene";
import { GameScene } from "@/scenes/GameScene";
import OutlinePipelinePlugin from "phaser3-rex-plugins/plugins/outlinepipeline-plugin.js";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	width: 1920,
	height: 1080,
	scale: {
		mode: Phaser.Scale.FIT,
	},
	scene: [PreloadScene, TitleScene, GameScene],

	plugins: {
		global: [
			{
				key: "rexOutlinePipeline",
				plugin: OutlinePipelinePlugin,
				start: true,
			},
		],
	},
	// physics: {
	// 	default: 'arcade',
	// 	arcade: {
	// 		debug: import.meta.env.DEV
	// 	}
	// }
};

const game = new Phaser.Game(config);
