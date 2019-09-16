import BaseComponent = require("../Common/BaseComponent");
import Game = require("./Game");
const { ccclass } = cc._decorator;

@ccclass
class Barrier extends BaseComponent {

    game: Game;

    OnLoad() {

    }
    unuse() {
    }
    reuse() {
    }
    onCollisionEnter(other, self) {
        var self_world = self.world;
        var other_world = other.world;
        // 碰撞组件的 aabb 碰撞框
        var self_aabb: cc.Rect = self_world.aabb;
        var other_aabb: cc.Rect = other_world.aabb;
        var union = new cc.Rect();
        self_aabb.intersection(union, other_aabb);
        let nodePos = this.game.node.convertToNodeSpaceAR(cc.v2(union.x + union.width * 0.5, union.y + union.height * 0.5));
        this.game.CreateCrashEffect(nodePos);
        this.game.OverGame();
    }


}