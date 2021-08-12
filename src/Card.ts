import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";

//カードクラス
export class Card extends g.FrameSprite {
	public mark: number; //記号
	public num: number; //数字
	public open: () => void;
	public close: () => void;
	public isRed: () => boolean;
	public prev: Card;
	public next: Card;

	constructor(maingame: MainGame, mark: number, num: number, x: number, y: number) {
		const scene = g.game.scene();
		super({
			scene: scene,
			src: scene.asset.getImageById("card"),
			x: x,
			y: y,
			width: 120,
			height: 180,
			frames: [0, 1, 2],
			frameNumber: num === 0 ? 2 : 1,
			touchable: true,
		});

		const marks = ["♡", "♦", "♧", "♠"];

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
			parent: this,
		});

		label.hide();

		this.num = num;
		this.mark = mark;

		//赤かどうか
		this.isRed = (): boolean => {
			return mark < 2;
		};

		//めくる
		this.open = () => {
			this.frameNumber = 0;
			label.show();
			this.modified();
		};

		//閉じる
		this.close = () => {
			this.frameNumber = 1;
			label.hide();
			this.modified();
		};

		//グローバル座標での当たり判定
		const collision = (a: g.E, b: g.E): boolean => {
			const aa = a.localToGlobal({ x: 0, y: 0 });
			const bb = b.localToGlobal({ x: 0, y: 0 });
			return g.Collision.intersect(aa.x, aa.y, a.width, a.height, bb.x, bb.y, b.width, b.height);
		};

		//選択
		let gp = { x: 0, y: 0 };
		let cardArea: CardArea;
		let isSelect = false;
		this.onPointDown.add((ev) => {
			isSelect = false;
			if (this.frameNumber !== 0) return;

			const select = (): void => {
				isSelect = true;
				gp = this.localToGlobal({ x: 0, y: 0 });
				maingame.hitBase.append(this);
				this.x = gp.x;
				this.y = gp.y;
				this.modified();
			};

			//自身の列を取得
			for (let i = 0; i < maingame.bHitAreas.length; i++) {
				if (collision(this, maingame.bHitAreas[i])) {
					cardArea = maingame.bAreas[i];
					cardArea.getCard(this);
					select();
					return;
				}
			}

			//手札かどうか
			if (collision(this, maingame.tHitArea)) {
				if (this === maingame.tArea.top) {
					cardArea = maingame.tArea;
					cardArea.getCard(this);
					select();
					return;
				}
			}
		});

		//移動
		this.onPointMove.add((ev) => {
			if (!isSelect) return;
			if (this.frameNumber !== 0) return;

			this.x = ev.startDelta.x + gp.x;
			this.y = ev.startDelta.y + gp.y;
			this.modified();
		});

		//重ねる　もしくは　戻す
		this.onPointUp.add((ev) => {
			if (!isSelect) return;
			if (this.frameNumber !== 0) return;

			let dstCardArea = cardArea;

			//場札との重なり判定
			for (let i = 0; i < maingame.bHitAreas.length; i++) {
				if (g.Collision.intersectAreas(this, maingame.bHitAreas[i])) {
					const area = maingame.bAreas[i];
					//重ねられるかどうかの判定
					if (
						(area.top.frameNumber === 0 && this.isRed() !== area.top.isRed() && this.num === area.top.num - 1) ||
						(area.top.frameNumber === 2 && this.num === 13)
					) {
						dstCardArea = area;
					}
				}
			}

			//組札との重なり判定
			for (let i = 0; i < maingame.kHitAreas.length; i++) {
				if (g.Collision.intersectAreas(this, maingame.kHitAreas[i])) {
					const area = maingame.kAreas[i];
					if ((area.top.frameNumber === 2 && this.num === 1) || (area.top.mark === this.mark && this.num === area.top.num + 1)) {
						dstCardArea = area;
					}
				}
			}

			if (cardArea !== dstCardArea && cardArea.top.frameNumber === 1) {
				cardArea.top.open();
			}

			dstCardArea.setCard(this);
		});
	}
}
