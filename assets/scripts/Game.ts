import BaseComponent = require("../Common/BaseComponent");
import AudioEngine = require("./AudioEngine");
import { LoadFile } from "./LoadFile";
const { ccclass, property } = cc._decorator;

/**跑道总道数 */
const BandCount = 4;
/**游戏状态 */
enum GameState {
    Init,
    Playing,
    Pause,
    End,
}
@ccclass
class Game extends BaseComponent {
    @property({ tooltip: "操作节点移动一次需要的总时间", type: cc.Float })
    moveTime: number = 0.1

    @property({ tooltip: "每过多少分数,创建障碍物时间和障碍物速度发生变化", type: cc.Float })
    changePoint: number = 10;

    @property({ tooltip: "初始障碍物速度", type: cc.Float })
    InitBarrierSpeed: number = 10;

    @property({ tooltip: "每次变化创建障碍物速度变化", type: cc.Float })
    changebarrierSpeed: number = 1;

    @property({ tooltip: "障碍物最大速度", type: cc.Float })
    MaxBarrierSpeed: number = 20;

    @property({ tooltip: "下一次创建障碍物时,上一次创建障碍物的Y轴坐标", type: [cc.Float] })
    NextCreatePosYList: number[] = [50, 200];

    @property({ tooltip: "碰撞特效节点", type: cc.Prefab })
    Prefab_CrashEffect: cc.Prefab = null;

    CrashEffectNodePool = new cc.NodePool();

    @property({ tooltip: "登录界面", type: cc.Prefab })
    Prefab_Login: cc.Prefab = null;
    nd_Login: cc.Node;
    @property({ tooltip: "规则界面", type: cc.Prefab })
    Prefab_Rule: cc.Prefab = null;
    nd_Rule: cc.Node;
    @property({ tooltip: "游戏结束界面", type: cc.Prefab })
    Prefab_End: cc.Prefab = null;
    nd_End: cc.Node;

    @property(cc.Node)
    uiLayer: cc.Node = null;

    audioEngine: AudioEngine;

    /**分数显示节点 */
    lb_socre: cc.Label = null;

    //背景1
    backGround: cc.Node = null;
    @property({ tooltip: "移动节点", type: cc.Prefab })
    Prefab_Move: cc.Prefab = null;
    /**左手移动节点 */
    leftMoveNode: cc.Node;
    /**右手移动节点 */
    rightMoveNode: cc.Node;
    @property({ tooltip: "障碍物节点", type: cc.Prefab })
    Prefab_Barrier: cc.Prefab = null;
    /**左边按钮样式 */
    btn_left: cc.Node;
    /**右边按钮样式 */
    btn_right: cc.Node;

    press_color = new cc.Color(125, 125, 125, 255);
    normal_color = new cc.Color(255, 255, 255, 255);
    loadFile: LoadFile

    /**4道跑道的X轴 */
    posXList = [-245, -85, 85, 245];
    /**障碍物回收节点 */
    barrierNodePool = new cc.NodePool("Barrier");
    /**当前分数 */
    point: number = 0;
    /**当前游戏状态 */
    gameState: GameState;
    /**上次创建障碍物的时间 */
    lastRecodeTime = 0;
    /**当前创建障碍物的时间 */
    CreateBarrierTime = 0;
    /**当前障碍物的速度 */
    BarrierSpeed = 0;
    /**最后一次创建障碍物的Y轴到达时在创建下一个障碍物 */
    NextCreatePosY = 0;

    //背景相关
    initHeight: number = 0;//图片本来的宽度
    maxHeight: number = 0;//最大宽度，避免宽度无限增加
    minHeight: number = 0;//最小宽度，避免穿帮

    maxPoint = 0;//最高分

    OnLoad() {
        window["t"] = this;
        this.JS_Name = "Game";
        this.loadFile = LoadFile.getInstance();
        this.loadFile.LoadSprite("texture/zuo", "btn_normal");
        this.loadFile.LoadSprite("texture/biaoqing", "btn_fail");
        this.gameState = GameState.Init;
        this.audioEngine = this.node.addComponent("AudioEngine");
        this.ShowLogin();
        //开启碰撞系统
        var manager = cc.director.getCollisionManager();
        manager.enabled = true;
        this.lb_socre = cc.find("New Label/New Label", this.node).getComponent(cc.Label);
        this.lb_socre.string = "0m";

        this.backGround = cc.find("BackGround", this.node);
        this.backGround.getComponent(cc.Sprite).type = cc.Sprite.Type.TILED;

        this.btn_left = cc.find("btn_left", this.node);
        this.btn_right = cc.find("btn_right", this.node);
        this.initHeight = this.backGround.height;//获取原本的宽度
        this.minHeight = Math.ceil(cc.director.getScene().getChildByName('Canvas').height / this.initHeight) * this.initHeight;//最少放几个图才能保证覆盖屏幕
        this.maxHeight = this.minHeight + this.initHeight;//最大宽度比最小宽度多一个图片宽度,减去一个滚动速度好像可以避免重置宽度的时候不自然
        this.backGround.width = cc.director.getScene().getChildByName('Canvas').width;//把图片初始成屏幕宽度避免穿帮

        this.point = 0;
        this.CreateMoveNode();
        this.node.on("touchstart", this.OnPoker_TouchStart, this);
        this.node.on("touchend", this.OnPoker_TouchEnd, this);
        this.node.on("touchcancel", this.OnPoker_TouchCancel, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.Event_OnKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.Event_OnKeyUp, this);
        cc.game.on(cc.game.EVENT_HIDE, this.OnEventHide, this);
        this.maxPoint = cc.sys.localStorage.getItem("MaxPoint");
        if (!this.maxPoint) {
            this.maxPoint = 0;
        }

        //初始化创建8个障碍物放入缓冲池
        for (let i = 0; i < 8; i++) {
            this.CreateBarrier();
        }
        for (let i = 0; i < this.node.childrenCount; i++) {
            let node = this.node.children[i];
            if (node.name == "barrier") {
                this.barrierNodePool.put(node);
            }
        }
    }


    update(dt) {
        if (this.gameState == GameState.Init) {
        }
        else if (this.gameState == GameState.Playing) {
            this.MoveBackGround();
            this.MoveBarrier();
        }
        else if (this.gameState == GameState.End) {
        }
        else if (this.gameState == GameState.Pause) {
        }
    }
    /**移动障碍物 */
    MoveBarrier() {
        let maxBarrirPosY = null;
        for (let i = 0; i < this.node.childrenCount; i++) {
            let node = this.node.children[i];
            if (node.name == "barrier") {
                node.y -= this.BarrierSpeed;
                if (maxBarrirPosY == null || maxBarrirPosY < node.y && node.active) {
                    maxBarrirPosY = node.y;
                }
                //回收障碍物
                if (node.y < -this.node.height * 0.5 - node.width * 0.5 && node.active) {
                    this.scheduleOnce(() => {
                        node.active = true;
                        this.barrierNodePool.put(node);
                    })
                    node.active = false;
                    this.point++;
                    this.lb_socre.string = [this.point, "m"].join("");
                    if (this.point % this.changePoint == 0) {
                        this.BarrierSpeed += this.changebarrierSpeed;
                        this.BarrierSpeed = Math.min(this.BarrierSpeed, this.MaxBarrierSpeed);
                    }
                }
            }

        }
        //最上方的障碍物到中间的时候 在创建一个障碍物
        if (maxBarrirPosY == null || maxBarrirPosY < this.NextCreatePosY) {
            this.NextCreatePosY = this.ListChoice(this.NextCreatePosYList);
            this.CreateBarrier();
        }
    }
    /**移动背景 */
    MoveBackGround() {
        this.backGround.height += this.BarrierSpeed;//增加宽度就会滚动了
        if (this.node.height >= this.maxHeight) {
            this.node.height = this.minHeight;
        }//超过最大宽度就重置一次，避免无限增长
    }

    /**开始游戏 */
    StartGame() {
        this.CloseLogin();
        this.CloseRule();
        this.CloseEnd();
        this.btn_left.getComponent(cc.Sprite).spriteFrame = this.loadFile.cacheSpriteDict["btn_normal"];
        this.btn_right.getComponent(cc.Sprite).spriteFrame = this.loadFile.cacheSpriteDict["btn_normal"];
        this.btn_right.rotation = 180;
        this.btn_left.color = this.btn_right.color = this.normal_color;
        if (this.gameState == GameState.Playing) {
            return;
        }
        this.BarrierSpeed = this.InitBarrierSpeed;
        this.NextCreatePosY = this.NextCreatePosYList[0];
        this.point = 0;
        this.lb_socre.string = "0m";
        this.gameState = GameState.Playing;
        this.audioEngine.PlayBackGround();
        this.InitMoveNodePos();
        this.ReCycleAllBarrier();
    }

    /**游戏结束 */
    OverGame() {
        this.maxPoint = Math.max(this.maxPoint, this.point);
        cc.sys.localStorage.setItem("MaxPoint", this.maxPoint);

        this.btn_left.getComponent(cc.Sprite).spriteFrame = this.loadFile.cacheSpriteDict["btn_fail"];
        this.btn_right.getComponent(cc.Sprite).spriteFrame = this.loadFile.cacheSpriteDict["btn_fail"];
        this.btn_right.rotation = 0;
        this.btn_left.color = this.btn_right.color = this.normal_color;

        this.gameState = GameState.End;
        this.audioEngine.StopAllSound();
        this.audioEngine.PlayLoseSound();
        this.leftMoveNode.stopAllActions();
        this.rightMoveNode.stopAllActions();
    }
    /**游戏暂停 */
    PauseGame() {
        this.gameState = GameState.Pause;
    }
    /**恢复游戏 */
    ResumeGame() {
        this.gameState = GameState.Playing;

    }
    //回收所有障碍物
    ReCycleAllBarrier() {
        for (let i = this.node.childrenCount - 1; i >= 0; i--) {
            let node = this.node.children[i];
            if (node.name == "barrier") {
                this.barrierNodePool.put(node);
            }
        }
    }
    /**初始化操作节点位置 */
    InitMoveNodePos() {
        this.leftMoveNode.stopAllActions();
        this.rightMoveNode.stopAllActions();
        this.leftMoveNode.setPosition(this.posXList[1], -300);
        this.rightMoveNode.setPosition(this.posXList[2], -300);
    }

    OnClick() {
        this.audioEngine.PlayBtnSound()
    }
    //-------------------创建新界面相关-----------
    /**显示登录界面 */
    ShowEnd() {
        let UIEnd = null
        if (!this.nd_End) {
            this.nd_End = cc.instantiate(this.Prefab_End);
            UIEnd = this.nd_End.getComponent("UIEnd");
            UIEnd.game = this;
        }
        this.nd_End.parent = this.uiLayer;

    }
    /**关闭登录界面 */
    CloseEnd() {
        if (this.nd_End)
            this.nd_End.removeFromParent(false);
    }

    /**显示登录界面 */
    ShowLogin() {
        if (!this.nd_Login) {
            this.nd_Login = cc.instantiate(this.Prefab_Login);
            let Login = this.nd_Login.getComponent("Login");
            Login.game = this;
        }
        this.nd_Login.parent = this.uiLayer;
    }
    /**关闭登录界面 */
    CloseLogin() {
        if (this.nd_Login)
            this.nd_Login.removeFromParent(false);
    }
    /**显示规则界面 */
    ShowRule() {
        if (!this.nd_Rule) {
            this.nd_Rule = cc.instantiate(this.Prefab_Rule);
            let Rule = this.nd_Rule.getComponent("Rule");
            Rule.game = this;
        }
        this.nd_Rule.parent = this.uiLayer;
    }

    CloseRule() {
        if (this.nd_Rule)
            this.nd_Rule.removeFromParent(false);
    }

    /**绘制操作节点 */
    CreateMoveNode() {
        this.leftMoveNode = cc.instantiate(this.Prefab_Move);
        this.rightMoveNode = cc.instantiate(this.Prefab_Move);
        this.leftMoveNode.parent = this.rightMoveNode.parent = this.node;
        this.leftMoveNode.setSiblingIndex(2);
        this.rightMoveNode.setSiblingIndex(2);
        this.InitMoveNodePos();
    }
    posX1List = [];
    /**绘制障碍物 */
    CreateBarrier() {
        let create = (num) => {
            let posX = this.posXList[num];
            let barrier = null;
            if (this.barrierNodePool.size() > 0) {
                barrier = this.barrierNodePool.get();
            } else {
                barrier = cc.instantiate(this.Prefab_Barrier);
                let Barrier = barrier.addComponent("Barrier");
                barrier.name = "barrier";
                Barrier.game = this;
            }
            barrier.parent = this.node;
            barrier.setSiblingIndex(2);
            barrier.setPosition(posX, this.node.height * 0.5 - barrier.width * 0.5);
        }

        let pos1X = this.RandInt(0, 1);
        let pos2X = this.RandInt(2, 3);
        if (this.posX1List.length == 2) {
            if (this.posX1List[0][0] == this.posX1List[1][0] && this.posX1List[0][1] == this.posX1List[1][1]) {
                pos1X = this.posX1List[0][0] == 0 ? 1 : 0;
                pos2X = this.posX1List[0][1] == 2 ? 3 : 2;
            }
        }
        this.posX1List.push([pos1X, pos2X]);
        if (this.posX1List.length == 3) {
            this.posX1List.shift();
        }
        create(pos1X);
        create(pos2X);
    }
    /** 创建碰撞特效并播放*/
    CreateCrashEffect(pos: cc.Vec2) {
        let node = null;
        if (this.CrashEffectNodePool.size() > 0) {
            node = this.CrashEffectNodePool.get();
        }
        else {
            node = cc.instantiate(this.Prefab_CrashEffect);
        }
        node.parent = this.node;
        node.setPosition(pos);
        let animation: cc.Animation = node.getComponent(cc.Animation);
        animation.once("finished", () => {
            this.CrashEffectNodePool.put(node);
            this.ShowEnd();
            if (this.nd_End) {
                let UIEnd = this.nd_End.getComponent("UIEnd");
                UIEnd.ShowPoint();
            }
        }, this)
        animation.play();

    }
    //----------------------注册事件相关
    /**移动左边 */
    MoveToLeftNode() {
        if (this.gameState != GameState.Playing) {
            return;
        }
        this.btn_left.color = this.press_color;
        this.leftMoveNode.stopAllActions();
        this.leftMoveNode.runAction(cc.moveTo(this.moveTime, this.posXList[0], this.leftMoveNode.y))
    }
    /**移动左边返回 */
    MoveBackLeftNode() {
        if (this.gameState != GameState.Playing) {
            return;
        }
        this.btn_left.color = this.normal_color;
        this.leftMoveNode.stopAllActions();
        this.leftMoveNode.runAction(cc.moveTo(this.moveTime, this.posXList[1], this.leftMoveNode.y))
    }
    /**移动右边 */
    MoveToRightNode() {
        if (this.gameState != GameState.Playing) {
            return;
        }
        this.btn_right.color = this.press_color;
        this.rightMoveNode.stopAllActions();
        this.rightMoveNode.runAction(cc.moveTo(this.moveTime, this.posXList[3], this.rightMoveNode.y))
    }
    /**移动右边返回 */
    MoveBackRightNode() {
        if (this.gameState != GameState.Playing) {
            return;
        }
        this.btn_right.color = this.normal_color;
        this.rightMoveNode.stopAllActions();
        this.rightMoveNode.runAction(cc.moveTo(this.moveTime, this.posXList[2], this.rightMoveNode.y))
    }
    OnPoker_TouchStart(event) {
        let touchPos = event.getLocation();
        let nodePos = this.node.convertToNodeSpaceAR(touchPos);
        if (nodePos.x > 0) {
            this.MoveToRightNode()
        }
        else {
            this.MoveToLeftNode();
        }

    }

    OnPoker_TouchEnd(event) {
        let touchPos = event.getLocation();
        let nodePos = this.node.convertToNodeSpaceAR(touchPos);
        if (nodePos.x > 0) {
            this.MoveBackRightNode()
        }
        else {
            this.MoveBackLeftNode()
        }
    }
    OnPoker_TouchCancel(event) {
        this.OnPoker_TouchEnd(event);
    }
    rightIsDown = false;
    leftIsDown = false;
    /**按钮按下时 */
    Event_OnKeyDown(event) {
        let keyCode = event.keyCode
        //右
        if (keyCode == "39" && !this.rightIsDown) {
            this.rightIsDown = true;
            this.MoveToRightNode()
        }
        //左
        else if (keyCode == "37") {
            this.leftIsDown = true;
            this.MoveToLeftNode();
        }
    }
    /**按钮松开时 */
    Event_OnKeyUp(event) {
        let keyCode = event.keyCode
        //右
        if (keyCode == "39") {
            this.rightIsDown = false;
            this.MoveBackRightNode()
        }
        //左
        else if (keyCode == "37") {
            this.rightIsDown = false;
            this.MoveBackLeftNode();
        }
        else if (keyCode == 13 && (this.gameState != GameState.Playing)) {
            this.StartGame();
        }
    }
    /**游戏切换后台 */
    OnEventHide() {
        if (this.gameState == GameState.Playing) {
            this.PauseGame()
        }
    }
    //------------------------------------
    //列表随机1个出来
    RandInt(start: number, end: number) {
        return Math.floor(Math.random() * (end + 1 - start) + start);
    }
    //列表随机1个出来
    ListChoice(targetList: any[]) {
        var length = targetList.length;
        if (length < 1) {
            return null;
        }
        return targetList[Math.floor(Math.random() * (length))];
    }

}
export =Game