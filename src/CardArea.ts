import { Card } from "./Card";

//カードを置く場所
export class CardArea extends g.E {
	public base: Card; //末尾のカードではなく置く場所
	public top: Card; //先頭のカード
	public getCardNum: (num: number) => Card;
	public getCard: (card: Card) => void;
	public setCard: (card: Card, y: number) => void;
	public openAll: () => void;
	constructor(x: number, y: number) {
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
			card.prev.next = null;
			this.top = card.prev;
			//card.prev = null;
		};

		//カードを置く
		this.setCard = (card, y) => {
			this.top.append(card);
			card.prev = this.top;
			this.top.next = card;
			while (card) {
				card.x = 0;
				if (this.top.frameNumber === 2) {
					card.y = 0;
				} else {
					card.y = y;
				}
				card.modified();
				this.top = card;
				card = card.next;
			}
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
