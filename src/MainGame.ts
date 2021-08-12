//import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { MainScene } from "./MainScene";

//ゲームクラス
export class MainGame extends g.E {
	public yHitArea: g.E; //山札
	public tHitArea: g.E; //手札
	public bHitAreas: g.E[]; //場札の当たり判定用
	public kHitAreas: g.E[]; //組札の当たり判定用
	public tArea: CardArea;
	public bAreas: CardArea[];
	public kAreas: CardArea[];
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

		// カード置き場を作る
		const createArea: (x: number, y: number, shift: number) => CardArea = (x, y, shift) => {
			const area = new CardArea(x, y, shift);
			base.append(area);
			return area;
		};

		// 当たり判定を作る
		const createHitArea: (x: number, y: number, w: number, h: number) => g.FilledRect = (x, y, w, h) => {
			const area = new g.FilledRect({
				scene: scene,
				x: x,
				y: y,
				width: w,
				height: h,
				cssColor: "yellow",
				opacity: 0.0,
				parent: hitBase,
			});
			//area.hide();
			return area;
		};

		// 山札用の当たり判定を作成
		this.yHitArea = createHitArea(1120, 60, 160, 220);
		this.yHitArea.touchable = true;

		//手札用の当たり判定を作成
		this.tHitArea = createHitArea(1060, 180, 10, 10);

		// 場札置場
		this.bAreas = [];
		this.bHitAreas = [];
		for (let x = 0; x < 7; x++) {
			const a = createArea(20 + x * 140, 30, 40);
			this.bAreas.push(a);
			const ha = createHitArea(80 + x * 140, 0, 10, g.game.height);
			this.bHitAreas.push(ha);
		}

		//山札・手札・手札リサイクル用置き場
		const yAreas: CardArea[] = [];
		for (let x = 0; x < 3; x++) {
			const shift = x === 0 ? 30 : 0;
			const a = createArea(1000 + x * 140, 80, shift);
			yAreas.push(a);
		}
		this.tArea = yAreas[0];

		//組札置場
		this.kAreas = [];
		this.kHitAreas = [];
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				const a = createArea(1000 + x * 140, 320 + y * 200, 0);
				this.kAreas.push(a);
				const ha = createHitArea(1060 + x * 140, 400 + y * 200, 10, 10);
				this.kHitAreas.push(ha);
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
			yAreas[1].setCard(cards[num]);
			cards.splice(num, 1);
		}

		//場札に配置
		let cnt = 1;
		this.bAreas.forEach((area) => {
			for (let i = 0; i < cnt; i++) {
				const card = yAreas[1].getCardNum(1);
				area.setCard(card);
			}
			cnt++;
		});

		//場札の先頭をめくる
		this.bAreas.forEach((area) => {
			area.top.open();
		});

		//山札をめくる
		const next = (): void => {
			//手札がある時どかす
			if (yAreas[0].base.next) {
				const card = yAreas[0].getBaseCard();
				yAreas[2].setCard(card);
			}

			//山札がないときどかしたカードを山札に戻す
			if (!yAreas[1].base.next) {
				while (yAreas[2].base.next) {
					const card = yAreas[2].getTopCard();
					card.close();
					yAreas[1].setCard(card);
				}
				return;
			}

			//山札から手札に移動
			for (let i = 0; i < 3; i++) {
				if (!yAreas[1].base.next) return;
				const card = yAreas[1].getTopCard();
				yAreas[0].setCard(card);
				card.open();
			}
		};

		this.yHitArea.onPointDown.add(next);

		next();
	}
}
