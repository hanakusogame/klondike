//import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { MainScene } from "./MainScene";

//ゲームクラス
export class MainGame extends g.E {
	public bHitAreas: g.E[]; //場札の当たり判定用
	public kHitAreas: g.E[]; //組札の当たり判定用
	public bAreas: CardArea[];
	public hitBase: g.E;

	constructor() {
		const scene = g.game.scene() as MainScene;
		super({ scene: scene, width: g.game.width, height: g.game.height, touchable: true });
		//const timeline = new tl.Timeline(scene);

		// ベース
		const base = new g.E({
			scene: scene,
			x: 0,
			width: g.game.width,
			height: g.game.height,
			parent: this,
		});

		//当たり判定用前面レイヤー
		const hitBase = new g.E({
			scene: scene,
			x: 0,
			width: g.game.width,
			height: g.game.height,
			parent: this,
		});
		this.hitBase = hitBase;

		//場札当たり判定用
		this.bHitAreas = [];
		for (let x = 0; x < 7; x++) {
			const area = new g.FilledRect({
				scene: scene,
				x: 60 + x * 140,
				y: 0,
				width: 40,
				height: g.game.height,
				cssColor: "yellow",
				opacity: 0.2,
				parent: hitBase,
			});
			this.bHitAreas.push(area);
			area.hide();
		}

		// カード置き場を作る
		const createArea: (x: number, y: number) => CardArea = (x, y) => {
			const area = new CardArea(x, y);
			base.append(area);
			return area;
		};

		// 場札置場
		this.bAreas = [];
		for (let x = 0; x < 7; x++) {
			const a = createArea(20 + x * 140, 30);
			this.bAreas.push(a);
		}

		//山札・手札置場
		const yAreas: CardArea[] = [];
		for (let x = 0; x < 2; x++) {
			const a = createArea(1000 + x * 140, 80);
			yAreas.push(a);
		}

		//組札置場
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				createArea(1000 + x * 140, 300 + y * 200);
			}
		}

		//山札作成
		const cards: Card[] = [];
		for (let i = 0; i < 4; i++) {
			for (var j = 1; j <= 13; j++) {
				const card = new Card(this, i, j, 0, 0);
				cards.push(card);
			}
		}

		//山札配置
		while (cards.length > 0) {
			const num = g.game.random.get(0, cards.length - 1);
			yAreas[1].setCard(cards[num], 0);
			cards.splice(num, 1);
		}

		//場札に配置
		let cnt = 1;
		this.bAreas.forEach((area) => {
			for (let i = 0; i < cnt; i++) {
				const card = yAreas[1].getCardNum(1);
				area.setCard(card, 30);
				//card.open();//仮
			}
			cnt++;
		});

		//場札の先頭をめくる
		this.bAreas.forEach((area) => {
			area.top.open();
		});

		//山札をめくる
		const card = yAreas[1].getCardNum(2);
		yAreas[0].setCard(card, 30);
		yAreas[0].openAll();
	}
}
