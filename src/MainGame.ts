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
	public clear: () => void;
	public autoMoves: () => void;

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
		const createArea: (x: number, y: number, type: number) => CardArea = (x, y, type) => {
			const area = new CardArea(x, y, type, base);
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
			const a = createArea(20 + x * 140, 10, 2);
			this.bAreas.push(a);
			const ha = createHitArea(80 + x * 140, 0, 10, g.game.height);
			this.bHitAreas.push(ha);
		}

		//山札・手札・手札リサイクル用置き場
		const yAreas: CardArea[] = [];
		for (let x = 0; x < 2; x++) {
			const a = createArea(1000 + x * 140, 50, 1 - x);
			yAreas.push(a);
		}
		this.tArea = yAreas[0];

		//組札置場
		this.kAreas = [];
		this.kHitAreas = [];
		for (let y = 0; y < 2; y++) {
			for (let x = 0; x < 2; x++) {
				const a = createArea(1000 + x * 140, 320 + y * 200, 3);
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
			yAreas[1].setCards([cards[num]], false, 0);
			cards.splice(num, 1);
		}

		//場札に配置
		let cnt = 1;
		this.bAreas.forEach((area) => {
			for (let i = 0; i < cnt; i++) {
				const card = yAreas[1].getCard();
				card.isBfuda = true;
				area.setCards([card], true, 0);
			}
			cnt++;
		});

		//場札の先頭をめくる
		this.bAreas.forEach((area) => {
			area.cards.slice(-1)[0].open(true);
		});

		//山札をめくる
		const next = (): void => {
			if (yAreas[0].cards.length) {
				if (yAreas[0].cards.slice(-1)[0].x !== yAreas[0].x) {
					return;
				}
			}

			//山札がないときカードを山札に戻す
			if (!yAreas[1].cards.length) {
				while (yAreas[0].cards.length) {
					const card = yAreas[0].getCard();
					card.close();
					yAreas[1].setCards([card], false, 0);
				}
			}

			//山札から手札に移動
			const cards: Card[] = [];
			for (let i = 0; i < scene.level; i++) {
				if (!yAreas[1].cards.length) break;
				const card = yAreas[1].getCard();
				cards.push(card);
				card.open(false);
			}

			yAreas[0].sortCard(0);
			yAreas[0].setCards(cards, true, 0);
		};

		this.yHitArea.onPointDown.add(next);

		// 場札から組札への自動移動
		this.autoMoves = (): void => {
			let cnt = 0;
			while (true) {
				let flg = false;
				const areas = this.bAreas.concat(yAreas[0]);
				areas.forEach((ba) => {
					if (!ba.cards.length) return;
					const bc = ba.cards.slice(-1)[0];
					if (!bc.isOpen) return;
					for (let i = 0; i < this.kAreas.length; i++) {
						const ka = this.kAreas[i];
						let isMove = false;
						if (!ka.cards.length) {
							//組札に1枚もない
							if (bc.num === 1) isMove = true;
						} else {
							const kc = ka.cards.slice(-1)[0];
							if (bc.mark === kc.mark && bc.num - 1 === kc.num) isMove = true;
						}

						if (isMove) {
							const c = ba.getCard();
							ka.setCards([c], true, cnt * 100);
							cnt++;
							flg = true;
							break;
						}
					}
				});
				if (!flg) break;
			}

			//場札の一番上をめくる
			this.bAreas.forEach((ba) => {
				ba.openLast();
			});
		};

		//クリア判定
		this.clear = () => {
			//山札手札にカードがない
			for (let i = 0; i < yAreas.length; i++) {
				const area = yAreas[i];
				if (area.cards.length) return;
			}

			//場札に閉じているカードがない
			for (let i = 0; i < this.bAreas.length; i++) {
				for (let j = 0; j < this.bAreas[i].cards.length; j++) {
					const c = this.bAreas[i].cards[j];
					if (!c.isOpen) return;
				}
			}

			//クリア処理
			this.autoMoves();

			scene.addScore(Math.floor(scene.time), 300);
			scene.time = 0;
		};

		next();
	}
}
