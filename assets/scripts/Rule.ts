import BaseComponent = require("../Common/BaseComponent");
import Game = require("./Game");

const { ccclass } = cc._decorator;
@ccclass
class Rule extends BaseComponent {

    game: Game;
    OnLoad() {
        this.JS_Name = "Login";
    }
    OnClick() {
        this.game.OnClick()
    }

    Close(){
        this.game.CloseRule();
    }

}