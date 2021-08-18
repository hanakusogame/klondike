import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";
import { MainScene } from "./MainScene";

//カードを置く場所
export class CardArea extends g.Sprite {
	public cards: Card[];
	public type: number;
	public setCards: (cards: Card[], isAnime: boolean, wait: number) => void;
	//public setCard: (cards: Card, isAanime: boolean) => void;
	public getCard: () => Card;
	public getCards: (card: Card) => Card[];
	public getCardsKeep: (card: Card) => Card[]; //カードを取得するが消さない
	public getAll: () => Card[];
	public openLast: () => void;
	public sortCard: (num: number) => void;
	//this.type : 0　山札　1 手札 2 場札 3 組札
	constructor(x: number, y: number, type: number, base: g.E) {
		const scene = g.game.scene() as MainScene;
		super({
			scene: scene,
			src: scene.asset.getImageById("card"),
			x: x,
			y: y,
			srcX: 120 * 2,
			width: 120,
			height: 180,
			parent: base,
		});

		const timeline = new tl.Timeline(scene);

		this.cards = [];
		this.type = type;
		const bonus = [0.0, 1.0, 1.2, 1.5];

		//ソートする
		this.sortCard = (num: number) => {
			//手札
			if (this.type === 1) {
				this.cards.forEach((c, i) => {
					c.y = this.y;
					c.modified();
				});
			}

			//場札
			if (this.type === 2) {
				const shiftNum = Math.min(50, 520 / (this.cards.length + num));
				this.cards.forEach((c, i) => {
					c.y = this.y + i * shiftNum;
					c.modified();
				});
			}
		};

		//複数枚乗せる
		this.setCards = (cards, isAnime, wait) => {
			const num = cards.length;
			let shiftNum = Math.min(50, 520 / (this.cards.length + num));

			cards.forEach((card, i) => {
				card.isMove = true;
				const x = this.x;
				let y = this.y;
				if (this.type === 2) y += (i + this.cards.length) * shiftNum;
				if (this.type === 1) y += i * 40;
				if (isAnime) {
					timeline
						.create(card)
						.wait(wait)
						.call(() => {
							base.append(card);
						})
						.moveTo(x, y, 200)
						.call(() => {
							card.isMove = false;
						});
				} else {
					base.append(card);
					card.x = x;
					card.y = y;
					card.modified();
				}
			});
			this.cards = this.cards.concat(cards);

			const card = cards[0];
			if (this.type === 2) {
				if (!card.isBfuda) {
					scene.addScore(100 * bonus[scene.level], 300);
					card.isBfuda = true;
				}
			}
			if (this.type === 3) {
				if (!card.isKfuda) {
					let score = 0;
					if (!card.isBfuda) {
						score += 100;
						card.isBfuda = true;
					}
					scene.addScore((score + card.num * 100) * bonus[scene.level], 300);
					card.isKfuda = true;
				}
			}
		};

		//１枚取る
		this.getCard = (): Card => {
			return this.cards.pop();
		};

		//引数のカードとその上にあるカードを取得
		this.getCards = (card): Card[] => {
			const num = this.cards.indexOf(card);
			const c = this.cards.slice(num);
			this.cards = this.cards.slice(0, num);
			return c;
		};

		this.getCardsKeep = (card): Card[] => {
			const num = this.cards.indexOf(card);
			const c = this.cards.slice(num);
			return c;
		};

		//全部取る
		this.getAll = (): Card[] => {
			const cs = this.cards;
			this.cards = [];
			return cs;
		};

		//一番手前をめくる
		this.openLast = (): void => {
			if (this.cards.length && !this.cards.slice(-1)[0].isOpen) {
				this.cards.slice(-1)[0].open(true);
				scene.addScore(100 * bonus[scene.level], 0);
			}
		};
	}
}
