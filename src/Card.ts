import tl = require("@akashic-extension/akashic-timeline");
import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";
import { MainScene } from "./MainScene";

//カードクラス
export class Card extends g.E {
	private static doubleCard: Card; //ダブルクリック判定用
	public mark: number; //記号
	public num: number; //数字
	public open: (isAnime: boolean) => void;
	public close: () => void;
	public isOpen: boolean;
	public isBfuda: boolean;
	public isKfuda: boolean;
	public isMove: boolean;

	constructor(maingame: MainGame, mark: number, num: number, x: number, y: number) {
		const scene = g.game.scene() as MainScene;

		super({
			scene: scene,
			x: x,
			y: y,
			width: 120,
			height: 180,
			touchable: true,
		});

		const timeline = new tl.Timeline(scene);
		this.isOpen = false;
		this.num = num;
		this.mark = mark;
		this.isBfuda = false;
		this.isKfuda = false;
		this.isMove = false;

		const sprite = new g.FrameSprite({
			scene: scene,
			src: scene.asset.getImageById("card"),
			x: 120 / 2,
			y: 180 / 2,
			anchorX: 0.5,
			anchorY: 0.5,
			width: 120,
			height: 180,
			frames: [0, 1, 2],
			frameNumber: 1,
			parent: this,
		});

		const base = new g.E({
			scene: scene,
			parent: sprite,
		});
		base.hide();

		new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("mark"),
			x: 2,
			y: 2,
			srcX: 40 * mark,
			width: 40,
			parent: base,
		});

		new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("number2"),
			x: 40,
			y: 2,
			srcX: 40 * (num - 1),
			srcY: 50 * Math.floor(mark / 2),
			width: 40,
			height: 40,
			parent: base,
		});

		if (num <= 10) {
			new g.Sprite({
				scene: scene,
				src: scene.asset.getImageById("mark2"),
				x: 10,
				y: 60,
				srcX: 100 * mark,
				width: 100,
				height: 100,
				parent: base,
			});
		} else {
			new g.Sprite({
				scene: scene,
				src: scene.asset.getImageById("mark3"),
				x: 0,
				y: 45,
				srcX: 120 * (num - 11),
				width: 120,
				height: 120,
				parent: base,
			});
		}

		this.open = (isAnime) => {
			if (this.isOpen) return;
			sprite.frameNumber = 0;
			base.show();
			this.isOpen = true;
			if (isAnime) {
				timeline.create(sprite).scaleTo(0, 1, 200).scaleTo(1, 1, 200);
			}
		};

		this.close = () => {
			sprite.frameNumber = 1;
			base.hide();
			this.isOpen = false;
		};

		//カードをつかむ
		let bkCards: Card[] = null;
		let bkArea: CardArea = null;
		let bkP = { x: 0, y: 0 };
		this.onPointDown.add((ev) => {
			bkCards = null;

			if (!scene.isStart) return;
			if (!this.isOpen) return;

			//ダブルクリックで自動移動
			if (Card.doubleCard === this) {
				maingame.autoMoves();
				bkCards = null;
				Card.doubleCard = null;
				return;
			}

			if (this.isMove) return;

			//場札
			maingame.bHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					bkArea = maingame.bAreas[i];
					bkCards = bkArea.getCardsKeep(this);
				}
			});

			//組札
			maingame.kHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					bkArea = maingame.kAreas[i];
					bkCards = bkArea.cards.slice(-1);
				}
			});

			//手札
			if (g.Collision.intersectAreas(this, maingame.tHitArea)) {
				bkArea = maingame.tArea;
				bkCards = bkArea.cards.slice(-1);
			}

			if (!bkCards) return;

			Card.doubleCard = this;
			scene.setTimeout(() => {
				Card.doubleCard = null;
			}, 500);

			bkP = { x: bkCards[0].x, y: bkCards[0].y };

			bkCards.forEach((c) => {
				c.parent.append(c); //最前面へ
			});
		});

		//カードを移動する
		this.onPointMove.add((ev) => {
			if (!scene.isStart) return;
			if (this.isMove) return;
			if (!bkCards) return;
			bkCards.forEach((c) => {
				c.x += ev.prevDelta.x;
				c.y += ev.prevDelta.y;
				c.modified();
			});
		});

		//カードを重ねる
		this.onPointUp.add((ev) => {
			if (!scene.isStart) return;
			if (this.isMove) return;
			if (!bkCards) return;
			let area = bkArea;

			const isRed = (card: Card): boolean => {
				return card.mark < 2;
			};

			//場札
			maingame.bHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(bkCards[0], a)) {
					const a = maingame.bAreas[i];
					if (
						(!a.cards.length && bkCards[0].num === 13) ||
						(a.cards.length && a.cards.slice(-1)[0].num === bkCards[0].num + 1 && isRed(a.cards.slice(-1)[0]) !== isRed(bkCards[0]))
					) {
						area = a;
					}
				}
			});

			//組札
			maingame.kHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(bkCards[0], a)) {
					const a = maingame.kAreas[i];
					if (
						(!a.cards.length && bkCards[0].num === 1) ||
						(a.cards.length && a.cards.slice(-1)[0].num === bkCards[0].num - 1 && a.cards.slice(-1)[0].mark === bkCards[0].mark)
					) {
						area = a;
					}
				}
			});

			if (area !== bkArea) {
				if (bkArea.type === 2) {
					const cards = bkArea.getCards(this);
					area.sortCard(cards.length);
					area.setCards(cards, true, 0);
					bkArea.sortCard(0);
					bkArea.openLast();
				} else {
					const card = bkArea.getCard();
					area.sortCard(1);
					area.setCards([card], true, 0);
				}
				scene.playSound("se_move");
			} else {
				//戻す
				bkCards.forEach((c) => {
					c.isMove = true;
					const x = c.x - (bkCards[0].x - bkP.x);
					const y = c.y - (bkCards[0].y - bkP.y);
					timeline
						.create(c)
						.moveTo(x, y, 200)
						.call(() => {
							c.isMove = false;
						});
				});
				scene.playSound("se_miss");
			}

			//クリア判定
			maingame.clear();
		});
	}
}
