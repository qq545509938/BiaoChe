/*
    自定义基础组件类
*/
import ccclass = cc._decorator.ccclass;

@ccclass
class BaseComponent extends cc.Component {

    JS_Name: string = "BaseComponent";

    // //组件可以在编辑器上显示的属性
    // properties: {
    //     "JS_Name": {
    //         "default": "BaseComponent",
    //         "visible": false
    //     },
    // }

    //是否开发者模式
    IsDevelopment() {
        return true
    }

    Log(...argList: any[]) {
        if (this.IsDevelopment()) {
            //第一个默认是字符串加上文件标示
            argList[0] = this.JS_Name + "\t" + argList[0];
            cc.log.apply(null, argList)
        }
    }

    //网络通信log
    NetLog(...argList: any[]) {
        if (this.IsDevelopment()) {
            argList[0] = this.JS_Name + "\t" + argList[0];
            cc.log.apply(null, argList)
        }
    }

    WarnLog(...argList: any[]) {
        if (this.IsDevelopment()) {
            //第一个默认是字符串加上文件标示
            argList[0] = this.JS_Name + "\t" + argList[0];
            cc.warn.apply(null, argList)
        }
    }

    ErrLog(...argList: any[]) {
        //第一个默认是字符串加上文件标示
        argList[0] = this.JS_Name + "\t" + argList[0];
        cc.error.apply(null, argList)
    }

    //addChild后调用
    protected onLoad() {
        this.OnLoad();
    }

    //载入调用
    protected OnLoad() {

    }

}

export = BaseComponent;
