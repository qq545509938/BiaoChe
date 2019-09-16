let instance: LoadFile;
export class LoadFile {
    static getInstance() {
        if (!instance) {
            instance = new LoadFile();
        }
        return instance
    }
    cacheSpriteDict: { [key: string]: cc.SpriteFrame } = {};
    cacheSoundDict: { [key: string]: cc.AudioClip } = {};
    /**
     *
     */
    constructor() {

    }
    /**预加载图片 */
    LoadSprite(path: string, name: string) {
        cc.loader.loadRes(path, cc.SpriteFrame, (error: Error, loadData: cc.SpriteFrame) => {
            if (error) {
                return
            }
            cc.log(`加载完成${name}`)
            this.cacheSpriteDict[name] = loadData;
        })
    }
    /**预加载音效 */
    LoadSound(path: string, name: string) {
        cc.loader.loadRes(path, cc.AudioClip, (error: Error, loadData: cc.AudioClip) => {
            if (error) {
                return
            }
            this.cacheSoundDict[name] = loadData;
            
        })
    }
}