import BaseComponent = require("../Common/BaseComponent");
import Game = require("./Game");

const { ccclass } = cc._decorator;
@ccclass
class UIEnd extends BaseComponent {

    game: Game;
    lb_point: cc.Label;
    lb_maxPoint: cc.Label;
    OnLoad() {
        this.JS_Name = "UIEnd";
        this.lb_point = cc.find("now/item",this.node).getComponent(cc.Label);
        this.lb_maxPoint = cc.find("record/item",this.node).getComponent(cc.Label);
    }
    ShowPoint() {
        this.lb_point.string = [this.game.point,"m"].join("")
        let maxPoint = cc.sys.localStorage.getItem("MaxPoint");
        if (!maxPoint) {
            maxPoint = 0;
        }
        this.lb_maxPoint.string = [maxPoint,"m"].join("");
    }

    /**开始游戏 */
    StartGame() {
        this.game.StartGame();
    }

    OnClick() {
        this.game.OnClick()
    }

}