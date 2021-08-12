//import tl = require("@akashic-extension/akashic-timeline");
import { Card } from "./Card";

//カードを置く場所
export class CardArea extends g.E {
	public base: Card; //末尾のカードではなく置く場所
	public top: Card; //先頭のカード
	public getCardNum: (num: number) => Card;
	public getCard: (card: Card) => Card;
	public setCard: (card: Card) => void;
	public getBaseCard: () => Card;
	public getTopCard: () => Card;
	public openAll: () => void;
	constructor(x: number, y: number, shift: number) {
		const scene = g.game.scene();
		super({
			scene: scene,
			x: x,
			y: y,
			width: 120,
			height: 180,
		});

		this.top = new Card(null, 0, 0, 0, 0);
		this.append(this.top);
		this.base = this.top;

		//カードを上から指定枚数取得
		this.getCardNum = (num) => {
			let top: Card;
			while (num > 0) {
				top = this.top;
				this.top = top.prev;
				num--;
			}
			this.top.next = null;
			return top;
		};

		//カードを取得
		this.getCard = (card) => {
			if (!card) return null;
			card.prev.next = null;
			this.top = card.prev;
			return card;
		};

		//一番下のカードを取得
		this.getBaseCard = (): Card => {
			return this.getCard(this.base.next);
		};

		//一番上のカードを取得
		this.getTopCard = (): Card => {
			return this.getCard(this.top);
		};

		//カードを置く
		this.setCard = (card) => {
			if (!card) return;

			card.prev = this.top;
			this.top.next = card;

			let c = card;
			while (c) {
				this.top = c;
				c = c.next;
			}

			card.x = 0;
			card.y = this.top === this.base.next ? 0 : shift;
			card.modified();
			this.top.prev.append(card);
		};

		//すべて開く
		this.openAll = () => {
			let card = this.base.next;
			while (card) {
				card.open();
				card = card.next;
			}
		};
	}
}
