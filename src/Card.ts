import tl = require("@akashic-extension/akashic-timeline");
import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";

//カードクラス
export class Card extends g.E {
	public mark: number; //記号
	public num: number; //数字
	public open: (isAnime: boolean) => void;
	public close: () => void;
	public isOpen: boolean;

	constructor(maingame: MainGame, mark: number, num: number, x: number, y: number) {
		const scene = g.game.scene();

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

		const marks = ["♡", "♦", "♧", "♠"];

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

		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: "sans-serif",
			size: 40,
		});

		const label = new g.Label({
			scene: scene,
			fontSize: 40,
			font: font,
			text: marks[mark] + "" + num,
			textColor: mark < 2 ? "red" : "black",
			parent: sprite,
		});
		label.hide();

		this.open = (isAnime) => {
			if (this.isOpen) return;
			sprite.frameNumber = 0;
			label.show();
			this.isOpen = true;
			if (isAnime) {
				timeline.create(sprite).scaleTo(0, 1, 200).scaleTo(1, 1, 200);
			}
		};

		this.close = () => {
			sprite.frameNumber = 1;
			label.hide();
			this.isOpen = false;
		};

		//カードをつかむ
		let bkCards: Card[] = null;
		let bkArea: CardArea = null;
		this.onPointDown.add((ev) => {
			bkCards = null;
			//場札
			maingame.bHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					bkArea = maingame.bAreas[i];
					bkCards = bkArea.getCards(this);
				}
			});

			//組札
			maingame.kHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					bkArea = maingame.kAreas[i];
					bkCards = bkArea.getCards(this);
				}
			});

			//手札
			if (g.Collision.intersectAreas(this, maingame.tHitArea)) {
				bkArea = maingame.tArea;
				bkCards = [bkArea.getCard()];
			}

			if (!bkCards) return;

			bkCards.forEach((c) => {
				c.parent.append(c); //最前面へ
			});
		});

		//カードを移動する
		this.onPointMove.add((ev) => {
			if (!bkCards) return;
			bkCards.forEach((c) => {
				c.x += ev.prevDelta.x;
				c.y += ev.prevDelta.y;
				c.modified();
			});
		});

		//カードを重ねる
		this.onPointUp.add((ev) => {
			if (!bkCards) return;
			let area = bkArea;

			//場札
			maingame.bHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					const a = maingame.bAreas[i];
					if (
						(!a.cards.length && this.num === 13) ||
						(a.cards.length && a.cards.slice(-1)[0].num === this.num + 1 && a.cards.slice(-1)[0].mark !== this.mark)
					) {
						area = a;
					}
				}
			});

			//組札
			maingame.kHitAreas.forEach((a, i) => {
				if (g.Collision.intersectAreas(this, a)) {
					const a = maingame.kAreas[i];
					if (
						(!a.cards.length && this.num === 1) ||
						(a.cards.length && a.cards.slice(-1)[0].num === this.num - 1 && a.cards.slice(-1)[0].mark === this.mark)
					) {
						area = a;
					}
				}
			});

			area.setCards(bkCards, true);
			if (area !== bkArea) bkArea.openLast();
		});
	}
}
