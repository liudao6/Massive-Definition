import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    fetchPost
} from "siyuan";
import "@/index.scss";


import { SettingUtils } from "./libs/setting-utils";
const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    customTab: () => IModel;
    private isMobile: boolean;
    private settingUtils: SettingUtils;
    private observer: MutationObserver;

    async onload() {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>`);
        let savedEnabled = await this.loadData('kpsHighlightEnabled');
        if(savedEnabled){
            this.initKpsHighlight();
        }

        const topBarElement = this.addTopBar({
            icon: "iconFace",
            title: this.i18n.addTopBarIcon,
            position: "right",
            callback: () => {
                if (this.isMobile) {
                    this.addMenu();
                } else {
                    let rect = topBarElement.getBoundingClientRect();
                    // 如果被隐藏，则使用更多按钮
                    if (rect.width === 0) {
                        rect = document.querySelector("#barMore").getBoundingClientRect();
                    }
                    if (rect.width === 0) {
                        rect = document.querySelector("#barPlugins").getBoundingClientRect();
                    }
                    this.addMenu(rect);
                }
            }
        });


        this.settingUtils = new SettingUtils({
            plugin: this, name: STORAGE_NAME
        });
        
        this.settingUtils.addItem({
            key: "kpsHighlightStyle",
            value: true,
            type: "checkbox",
            title: "kps文章摘要",
            description: "layer1~3，在原文高亮，通过摘要的格式，凸显出来",
            action: {
                callback: () => {
                    let value = !this.settingUtils.get("kpsHighlightStyle");
                    this.settingUtils.set("kpsHighlightStyle", value);
                    this.saveData('kpsHighlightEnabled', value);
                    if(value){
                        console.log("开启kps文章摘要");
                        this.initKpsHighlight();
                    }else{
                        console.log("关闭kps文章摘要");
                        this.destroyKpsHighlight();
                    }
                }
            }
        });
        try {
            this.settingUtils.load();
        } catch (error) {
            console.error("Error loading settings storage, probably empty config json:", error);
        }
 
    }
  

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
         
        menu.addSeparator();
        menu.addItem({
            icon: "iconSettings",
            label: "样式设置",
            click: () => {
                this.openSetting();
            }
        });
       
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }

    private initKpsHighlight() {
        // 创建观察器
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.processElement(node as Element);
                    }
                });
            });
        });

        // 开始观察
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 处理现有内容
        this.processElement(document.body);
    }

    private processElement(element: Element) {
        const divs = element.getElementsByTagName('div');
        for (const div of Array.from(divs)) {
            const text = div.textContent?.trim().toLowerCase() || '';
            if (text.startsWith('kps:') || text.startsWith('kps：') || 
                text.startsWith('kps:') || text.startsWith('kps：')) {
                div.classList.add('kps-highlight');
            }
        }
    }

    private destroyKpsHighlight() {
        // 停止观察
        if (this.observer) {
            this.observer.disconnect();
        }

        // 移除所有高亮样式
        document.querySelectorAll('.kps-highlight').forEach(element => {
            element.classList.remove('kps-highlight');
        });
    }

    async onunload() {
        this.destroyKpsHighlight();
    }
}