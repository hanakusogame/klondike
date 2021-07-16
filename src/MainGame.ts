import tl = require("@akashic-extension/akashic-timeline");
import { MainScene } from "./MainScene";

//ゲームクラス
export class MainGame extends g.E {
	constructor() {
		const scene = g.game.scene() as MainScene;
		super({ scene: scene, width: g.game.width, height: g.game.height, touchable: true });
		const timeline = new tl.Timeline(scene);

		// ベース
		const base = new g.E({
			scene: scene,
			x: 60,
			width: 1000,
			height: 720,
			parent: this,
		});

	}
}

//カードクラス
