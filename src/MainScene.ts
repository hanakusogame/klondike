import tl = require("@akashic-extension/akashic-timeline");
import { Button } from "./Button";
import { Config } from "./Config";
import { MainGame } from "./MainGame";
import { GameMainParameterObject, RPGAtsumaruWindow } from "./parameterObject";
declare const window: RPGAtsumaruWindow;

export class MainScene extends g.Scene {
	public addScore: (score: number, x: number) => void;
	public playSound: (name: string) => void;
	public reset: () => void;
	public isStart = false;
	public font: g.Font;
	public level: number;
	public time: number;

	constructor(param: GameMainParameterObject) {
		super({
			game: g.game,
			// このシーンで利用するアセットのIDを列挙し、シーンに通知します
			assetIds: [
				"title",
				"score",
				"time",
				"start",
				"glyph",
				"number",
				"number_red",
				"config",
				"volume",

				"card",
				"mark",
				"mark2",
				"mark3",
				"number2",
				"cursor",

				"bgm",
				"se_start",
				"se_timeup",

				"se_move",
				"se_clear",
				"se_miss",
			],
		});

		const timeline = new tl.Timeline(this);
		const timeLimit = 180; // 制限時間
		const isDebug = false;
		const version = "ver. 1.05";
		this.level = 1;

		// ミニゲームチャット用モードの取得と乱数シード設定
		let mode = "";
		if (typeof window !== "undefined") {
			const url = new URL(location.href);
			const seed = url.searchParams.get("date");
			// eslint-disable-next-line radix
			if (seed) g.game.random = new g.XorshiftRandomGenerator(parseInt(seed));
			mode = url.searchParams.get("mode");
		}

		// 市場コンテンツのランキングモードでは、g.game.vars.gameState.score の値をスコアとして扱います
		g.game.vars.gameState = { score: 0 };
		this.onLoad.add(() => {
			const bgm = this.asset.getAudioById("bgm").play();
			bgm.changeVolume(isDebug ? 0.0 : 0.2);

			//背景
			const bg = new g.FilledRect({
				scene: this,
				width: g.game.width,
				height: g.game.height,
				cssColor: "green",
				parent: this,
				opacity: param.isAtsumaru || isDebug ? 1.0 : 0.8,
			});

			const base = new g.E({
				scene: this,
				parent: this,
			});

			let maingame: MainGame;

			// タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.asset.getImageById("title"), x: 0 });
			this.append(sprTitle);

			const font = new g.DynamicFont({
				game: g.game,
				fontFamily: "monospace",
				size: 24,
			});

			//バージョン情報
			new g.Label({
				scene: this,
				font: font,
				fontSize: 24,
				text: version,
				parent: sprTitle,
			});

			//レベル変更
			for (let i = 0; i < 3; i++) {
				const area = new g.FilledRect({
					scene: this,
					x: 576 + 208 * i,
					y: 560,
					width: 190,
					height: 112,
					cssColor: "yellow",
					opacity: 0.0,
					parent: sprTitle,
					touchable: true,
				});
				area.onPointDown.add(() => {
					cursor.x = area.x;
					this.level = i + 1;
				});
			}

			const cursor = new g.Sprite({
				scene: this,
				src: this.asset.getImageById("cursor"),
				x: 576,
				y: 555,
				parent: sprTitle,
			});

			timeline
				.create(sprTitle, {
					modified: sprTitle.modified,
				})
				.wait(isDebug ? 1000 : 5000)
				.moveBy(-1280, 0, 200)
				.call(() => {
					init();
				});

			//コンフィグ画面
			const config = new Config(this, 770, 10);
			config.bg = bg;
			config.hide();

			config.bgmEvent = (num) => {
				bgm.changeVolume(0.6 * num);
			};

			const init = (): void => {
				// 上で生成した font.png と font_glyphs.json に対応するアセットを取得
				var fontGlyphAsset = this.asset.getTextById("glyph");

				// テキストアセット (JSON) の内容をオブジェクトに変換
				var glyphInfo = JSON.parse(fontGlyphAsset.data);

				// ビットマップフォントを生成
				var font = new g.BitmapFont({
					src: this.asset.getImageById("number"),
					glyphInfo: glyphInfo,
				});
				this.font = font;

				// ビットマップフォントを生成
				var fontRed = new g.BitmapFont({
					src: this.asset.getImageById("number_red"),
					glyphInfo: glyphInfo,
				});

				new g.Sprite({
					scene: this,
					src: this.asset.getImageById("score"),
					width: 192,
					height: 64,
					x: 340,
					y: 640,
					parent: this,
				});

				// スコア表示用のラベル
				const scoreLabel = new g.Label({
					scene: this,
					text: "0P",
					font: font,
					fontSize: 32,
					x: 380,
					y: 640,
					width: 450,
					widthAutoAdjust: false,
					textAlign: "right",
					parent: this,
				});

				//時間の時計アイコン
				new g.Sprite({
					scene: this,
					src: this.asset.getImageById("time"),
					x: 5,
					y: 635,
					parent: this,
				});

				// 残り時間表示用ラベル
				const timeLabel = new g.Label({
					scene: this,
					text: "0",
					font: font,
					fontSize: 32,
					x: 105,
					y: 640,
					parent: this,
				});

				//点滅用
				const sprFG = new g.FilledRect({
					scene: this,
					width: g.game.width,
					height: g.game.height,
					cssColor: "red",
					opacity: 0,
				});
				this.append(sprFG);

				//スタート・終了表示用
				const stateSpr = new g.FrameSprite({
					scene: this,
					src: this.asset.getImageById("start"),
					width: 800,
					height: 250,
					x: (g.game.width - 800) / 2,
					y: (g.game.height - 250) / 2,
					frames: [0, 1],
					frameNumber: 0,
					parent: this,
				});

				if (param.isAtsumaru || isDebug || mode === "game") {
					//コンフィグ表示ボタン
					const btnConfig = new g.Sprite({
						scene: this,
						src: this.asset.getImageById("config"),
						x: 1200,
						touchable: true,
						parent: this,
					});

					btnConfig.onPointDown.add(() => {
						if (config.state & 1) {
							config.show();
						} else {
							config.hide();
						}
					});
				}

				let btnReset: Button;
				let btnRanking: Button;
				let btnExtend: Button;

				if (param.isAtsumaru || isDebug || mode === "game") {
					// 継続ボタン
					btnExtend = new Button(this, ["継続"], 1000, 280, 260);
					btnExtend.modified();
					this.append(btnExtend);
					btnExtend.pushEvent = () => {
						this.isStart = true;
						stateSpr.hide();
						sprFG.opacity = 0;
						btnReset?.hide();
						btnRanking?.hide();
						btnExtend?.hide();
					};

					// リセットボタン
					btnReset = new Button(this, ["リセット"], 1000, 520, 260);
					btnReset.modified();
					this.append(btnReset);
					btnReset.pushEvent = () => {
						this.reset();
					};

					// ランキングボタン
					btnRanking = new Button(this, ["ランキング"], 1000, 400, 260);
					btnRanking.modified();

					this.append(btnRanking);
					btnRanking.pushEvent = () => {
						//スコアを入れ直す応急措置
						//window.RPGAtsumaru.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
						//window.RPGAtsumaru.scoreboards.display(1);
						//});
						window.RPGAtsumaru.scoreboards.display(2);
					};
				}

				this.append(config);

				//効果音再生
				this.playSound = (name: string) => {
					(this.assets[name] as g.AudioAsset).play().changeVolume(config.volumes[1]);
				};

				const updateHandler = (): void => {
					if (this.time < 0) {
						// RPGアツマール環境であればランキングを設定
						this.setTimeout(() => {
							const scoreboadsNums = [1, 3, 2];
							if (param.isAtsumaru) {
								const boardId = scoreboadsNums[this.level];
								const board = window.RPGAtsumaru.scoreboards;
								board.setRecord(boardId, g.game.vars.gameState.score).then(() => {
									btnReset?.show();
									btnRanking?.show();
									btnExtend?.show();
								});
							}

							// ミニゲームチャット用ランキング設定
							if (mode === "game") {
								(window as Window).parent.postMessage({ score: g.game.vars.gameState.score, id: 1 }, "*");
								btnReset.show();
							}

							if (isDebug) {
								btnReset?.show();
								btnRanking?.show();
								btnExtend?.show();
							}
						}, 500);

						//終了表示
						stateSpr.frameNumber = 1;
						stateSpr.modified();
						stateSpr.show();

						this.isStart = false;

						this.onUpdate.remove(updateHandler);
						this.playSound("se_timeup");

						sprFG.cssColor = "black";
						sprFG.opacity = 0.3;
						sprFG.modified();
					}
					// カウントダウン処理
					this.time -= 1 / g.game.fps;
					timeLabel.text = "" + Math.ceil(this.time);
					timeLabel.invalidate();

					//ラスト5秒の点滅
					if (this.time <= 5) {
						sprFG.opacity = (this.time - Math.floor(this.time)) / 3;
						sprFG.modified();
					}
				};

				// スコア追加
				this.addScore = (score, x) => {
					// if (time < 0) return;
					g.game.vars.gameState.score += score;
					timeline.create(this).every((e: number, p: number) => {
						scoreLabel.text = "" + (g.game.vars.gameState.score - Math.floor(score * (1 - p))) + "P";
						scoreLabel.invalidate();
					}, 500);

					// スコア表示用のラベル
					const label = new g.Label({
						scene: this,
						text: "+" + score,
						font: fontRed,
						fontSize: 32,
						x: x,
						y: 580,
						width: 410,
						widthAutoAdjust: false,
						textAlign: "right",
						opacity: 0.0,
						parent: this,
					});

					timeline
						.create(label)
						.every((e: number, p: number) => {
							label.opacity = p;
						}, 100)
						.wait(500)
						.call(() => {
							label.destroy();
						});
				};

				//リセット処理
				this.reset = (): void => {
					this.isStart = true;
					maingame?.destroy();
					maingame = new MainGame();
					base.append(maingame);
					this.time = timeLimit;
					timeLabel.text = "" + this.time;
					timeLabel.invalidate();

					g.game.vars.gameState.score = 0;
					scoreLabel.text = "0";
					scoreLabel.invalidate();

					stateSpr.frameNumber = 0;
					stateSpr.modified();
					stateSpr.show();
					this.setTimeout(() => {
						stateSpr.hide();
					}, 1000);

					btnExtend?.hide();
					btnReset?.hide();
					btnRanking?.hide();

					this.playSound("se_start");

					sprFG.opacity = 0;
					sprFG.cssColor = "red";
					sprFG.modified();

					this.onUpdate.remove(updateHandler);
					this.onUpdate.add(updateHandler);
				};
				this.reset();
			};
		});
	}
}
