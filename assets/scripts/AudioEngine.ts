import BaseComponent = require("../Common/BaseComponent");
import { LoadFile } from "./LoadFile";

const { ccclass } = cc._decorator;
@ccclass
class AudioEngine extends BaseComponent {
    loadFile: LoadFile;
    BackGround;
    OnLoad() {
        this.JS_Name = "AudioEngine";
        this.loadFile = LoadFile.getInstance();
        this.loadFile.LoadSound("Sound/Lose", "Lose");
        this.loadFile.LoadSound("Sound/button", "button");
    }

    PlayBackGround() {

        if (this.BackGround) {
            cc.audioEngine.playMusic(this.BackGround, true);
        }
        else {
            cc.loader.loadRes("Sound/BackGound", cc.AudioClip, (error: Error, loadData: cc.AudioClip) => {
                if (error) {
                    return
                }
                this.BackGround = loadData
                cc.audioEngine.playMusic(loadData, true);
            })
        }

    }

    PlayLoseSound() {
        if (this.loadFile.cacheSoundDict.hasOwnProperty("Lose")) {
            cc.audioEngine.playEffect(this.loadFile.cacheSoundDict["Lose"], false);
        }
    }
    /**播放按钮音效 */
    PlayBtnSound() {
        if (this.loadFile.cacheSoundDict.hasOwnProperty("button")) {
            cc.audioEngine.playEffect(this.loadFile.cacheSoundDict["button"], false);
        }

    }

    StopAllSound() {
        cc.audioEngine.stopAll();
    }

}
export = AudioEngine