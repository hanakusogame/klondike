import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";

//カードを置く場所
export class CardArea extends g.Sprite {
	public cards: Card[];
	public setCards: (cards: Card[], isAnime: boolean) => void;
	public setCard: (cards: Card, isAanime: boolean) => void;
	public getCard: () => Card;
	public getCards: (card: Card) => Card[];
	public getAll: () => Card[];
	public openLast: () => void;
	constructor(x: number, y: number, shift: number, base: g.E) {
		const scene = g.game.scene();
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

		//複数枚乗せる
		this.setCards = (cards, isAnime) => {
			cards.forEach((card, i) => {
				base.append(card);
				const x = this.x;
				const y = this.y + (i + this.cards.length) * shift;
				if (isAnime) {
					timeline.create(card).moveTo(x, y, 100);
				} else {
					card.x = x;
					card.y = y;
				}
			});
			this.cards = this.cards.concat(cards);
		};

		//一枚乗せる
		this.setCard = (card, isAnime) => {
			base.append(card);
			const x = this.x;
			const y = this.y + this.cards.length * shift;
			if (isAnime) {
				timeline.create(card).moveTo(x, y, 100);
			} else {
				card.x = x;
				card.y = y;
			}
			this.cards.push(card);
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

		//全部取る
		this.getAll = (): Card[] => {
			const cs = this.cards;
			this.cards = [];
			return cs;
		};

		//一番手前をめくる
		this.openLast = (): void => {
			if (this.cards.length) {
				this.cards.slice(-1)[0].open(true);
			}
		};
	}
}
