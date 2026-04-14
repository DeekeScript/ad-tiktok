let T = require('app/dy/T.js');
const Common = {
    /**
     * 通过ID获取控件
     * @param {string} name 
     * @returns Object
     */
    id(name) {
        return UiSelector().id(this.packageName() + ':id/' + name);
    },

    /**
     * 通过android:id获取控件
     * @param {string} name 
     * @returns Object
     */
    aId(name) {
        return UiSelector().id('android:id/' + name);
    },

    /**
     * 休眠
     * @param {number} time 
     */
    sleep(time) {
        this.log("js休眠时间：" + time);
        let slow = Storage.getInteger('setting_slow') || 0;
        System.sleep(time * (1 + slow / 100));
    },

    clickRange(tag, top, bottom) {
        if (tag.bounds().top + tag.bounds().height() <= top) {
            return false;
        }

        if (tag.bounds().top >= bottom) {
            return false;
        }

        if (tag.bounds().top > top && tag.bounds().top + tag.bounds().height() < bottom) {
            this.click(tag);
            return true;
        }

        //卡在top的上下
        if (tag.bounds().top <= top && tag.bounds().top + tag.bounds().height() > top) {
            let topY = tag.bounds().top + tag.bounds().height() - top;
            Gesture.click(tag.bounds().left + tag.bounds().width() * Math.random(), (tag.bounds().top + 1) + (topY - 1) * Math.random());
            return true;
        }

        if (tag.bounds().top < bottom && tag.bounds().top + tag.bounds().height() >= bottom) {
            let topY = bottom - tag.bounds().top;
            Gesture.click(tag.bounds().left + tag.bounds().width() * Math.random(), tag.bounds().top + (topY - 1) * Math.random());
            return true;
        }
        return false;
    },

    /**
     * 获取包名
     * @returns string
     */
    packageName() {
        return 'com.zhiliaoapp.musically';
    },

    /**
     * 返回主页
     * @returns boolean
     */
    backHome() {
        this.openApp();
        this.backHomeOnly();
        return true;
    },

    /**
     * 仅返回主页  需要简单模式下执行
     * @returns boolean
     */
    backHomeOnly() {
        let i = 0;
        while (i++ < 5) {
            let homeTag = UiSelector().text(T('首页')).filter(v => {
                return v.parent().isVisibleToUser() && v.bounds().width() > 0;//滑动到用户页面，也能看到首页，但是width是负数
            }).findOne();

            if (!homeTag) {
                this.log("没有找到homeTag，返回一次");
                this.back();
                this.sleep(1000);
                continue;
            }
            this.log("找到了homeTag");
            break;
        }
        return true;
    },

    /**
     * 点击控件
     * @param {Object} tag 
     * @param {number} rate 
     * @returns boolean
     */
    click(tag, rate = 0.05) {
        if (!rate) {
            rate = 0.05;
        }

        let p = 1 - rate * 2;
        let width = tag.bounds().width() * (rate + Math.random() * p);
        let height = tag.bounds().height() * (rate + Math.random() * p);

        try {
            return Gesture.click(tag.bounds().left + Math.floor(width), tag.bounds().top + Math.floor(height));
        } catch (e) {
            this.log(e);
            try {
                return Gesture.click(tag.bounds().left + Math.floor(width), tag.bounds().top + 1);
            } catch (e) {
                this.log(e);
                return false;
            }
        }
    },

    /**
     * 打开抖音
     * @returns {boolean}
     */
    openApp() {
        this.log('打开应用');
        App.launch(this.packageName());//打开抖音

        let i = 5;
        while (i-- > 0) {
            this.sleep(2000);
            let homeTag = UiSelector().text(T('首页')).filter(v => {
                return v.parent().isVisibleToUser();
            }).findOne();

            if (homeTag) {
                this.log('进入应用');
                return true;
            }
        }

        this.log('进入应用');
        return true;
    },

    /**
     * 返回app
     */
    backApp() {
        App.backApp();
    },


    /**
     * 打印日志
     */
    log() {
        //这里需要做日志记录处理
        Log.log(arguments);
        console.log(arguments);
    },

    /**
     * 模拟返回
     * @param i
     * @param time
     * @param randTime
     */
    back(i, time, randTime) {
        if (i === undefined) {
            i = 1;
        }

        if (time == undefined) {
            time = 700;
        }

        this.log('返回次数： ' + i);
        while (i--) {
            Gesture.back();
            if (randTime) {
                this.sleep(time + randTime * Math.random());
                continue;
            }
            this.sleep(time);
        }
    },

    /**
     * 提取字符串中的数字
     * @param {string} content 
     * @returns {number}
     */
    numDeal(content) {
        content = content.replace(/\s*/g, '');
        let text = /[\d.]+[w|万|亿|K|k|M|m]*/.exec(content);
        this.log('数字：', content, text);
        let num = 0;
        if (!text) {
            return num;
        }

        text[0] = text[0].replace(',', '').replace(',', '').replace(',', '');
        if (text[0].indexOf('w') !== -1 || text[0].indexOf('万') !== -1) {
            num = parseFloat(text[0].replace('w', '').replace('万', '')) * 10000;
        } else if (text[0].indexOf('亿') !== -1) {
            num = parseFloat(text[0].replace('w', '').replace('亿', '')) * 10000 * 10000;
        } else if (text[0].indexOf('M') !== -1 || text[0].indexOf('m') !== -1) {
            num = parseFloat(text[0].replace('m', '').replace('M', '')) * 1000 * 1000;
        } else if (text[0].indexOf('K') !== -1 || text[0].indexOf('k') !== -1) {
            num = parseFloat(text[0].replace('k', '').replace('K', '')) * 1000;
        } else {
            num = parseInt(text[0]);
        }

        this.log('数字：', num);
        return num;//可能存在多个逗号
    },

    /**
     * 向上滑或者下滑 【这个方法稳定性可能不太好，不太推荐使用】
     * @param {number} type 0表示向上滑
     * @param {number} sensitivity 
     * @param {number} rate 
     * @returns 
     */
    swipe(type = 0, sensitivity = 1, rate = 12) {
        const width = Device.width();
        const height = Device.height();

        // 横坐标随机化，避免死板
        const x = width * (0.3 + Math.random() * 0.4); // 30%~70%屏幕宽

        // rate 控制滑动距离，避免原来的 1/rate 逻辑不直观
        const distance = height / rate;

        let startY, endY;

        if (type === 0) { // 向上滑动
            startY = height * 0.7 * sensitivity + height * 0.1 * Math.random(); // 底部偏移
            endY = startY - distance;
            if (endY < 0) endY = 0;
        } else if (type === 1) { // 向下滑动
            startY = height * 0.3 * sensitivity + height * 0.1 * Math.random(); // 顶部偏移
            endY = startY + distance;
            if (endY > height) endY = height;
        } else {
            console.warn("swipe: type 只能是 0（上）或 1（下）");
            return false;
        }

        // duration 随机化，200~300ms 左右
        const duration = 200 + 100 * Math.random();
        Gesture.swipe(x, startY, x, endY, duration);
        return true;
    },

    /**
     * 滑动搜索用户列表
     * @returns boolean  默认用户页面
     */
    swipeSearchUserOp(filterRootLayout = false) {
        let tag = UiSelector().className('androidx.recyclerview.widget.RecyclerView').scrollable(true).filter(v => {
            if (filterRootLayout) {
                return !!v.children().findOne(this.id('viewpager').isVisibleToUser(true));
            }
            return true;
        }).isVisibleToUser(true).findOne();
        if (!tag) {
            this.log('scroll failed');
            return null;
        }

        if (tag.scrollForward()) {
            this.log('scroll success');
            return true;
        }
        this.log('scroll to bottom');
        return false;
    },

    /**
     * 滑动粉丝列表
     * @returns {boolean}
     */
    swipeFansListOp() {
        return this.swipeSearchUserOp();
    },

    /**
     * 滑动关注列表
     * @returns {boolean}
     */
    swipeFocusListOp() {
        return this.swipeSearchUserOp();
    },

    /**
     * 滑动评论列表
     * @returns {boolean}
     */
    swipeCommentListOp() {
        return this.swipeSearchUserOp();
    },

    /**
     * 搜索列表滑动到左侧
     * @returns {boolean}
     */
    swipeSearchTabToLeft() {
        let tag = UiSelector().scrollable(true).className('android.widget.HorizontalScrollView').isVisibleToUser(true).findOne();
        if (!tag) {
            this.log('scroll failed');
            return null;
        }
        if (tag.scrollForward()) {
            this.log('scoll success');
            return true;
        }
        this.log('scroll failed');
        return false;
    },

    /**
     * 粉丝群列表滑动
     * @returns {boolean}
     */
    swipeFansGroupListOp() {
        return this.swipeSearchUserOp();
    },

    /**
     * 消息列表滑动
     * @param type {boolean}
     * @returns {boolean}
     */
    swipeMessageList(type) {
        let tag = UiSelector().className('androidx.recyclerview.widget.RecyclerView').scrollable(true).filter(v => {
            return v.bounds().height() > Device.height() / 2;
        }).isVisibleToUser(true).findOne();
        if (type == true) {
            return tag.scrollBackward();
        }
        return tag.scrollForward();
    },

    /**
     * 互动消息列表滑动
     * @returns {boolean}
     */
    swipeMessageDetailsList() {
        return this.swipeSearchUserOp();
    },

    /**
    * 作品赞列表滑动
    * @returns {boolean}
    */
    swipeWorkZanList() {
        return this.swipeSearchUserOp();
    },

    /**
     * 关闭弹窗
     * @param type
     */
    closeAlert(type) {
        if (!type) {
            return;
        }

        this.log('开启线程监听弹窗');
        let f = function (v) {
            return v && v.bounds() && v.bounds().top > Device.height() / 5 && v.bounds().top + v.bounds().height() < Device.height() * 0.8 && v.bounds().left > Device.width() / 10 && v.bounds().left + v.bounds().width() < Device.width() * 0.9;//只有在中间的位置才是弹窗
        }

        try {
            let cancelTexts = [T('不再提醒'), T('稍后'), T('以后再说'), T('我知道了'), T('直接退出'), T('不多'), T('下次再说'), T('满意'), T('不感兴趣'), T('好的'), T('确定'), T('取消'), T('拒绝'), T('关闭'), T('暂不隔开'), T('忽略本次'), T('暂不使用')];
            for (let i = 0; i < cancelTexts.length; i++) {
                let cancelTag = UiSelector().text(cancelTexts[i]).clickable(true).filter(f).isVisibleToUser(true).findOne();
                if (cancelTag) {
                    cancelTag.click();
                    this.log('click cancle button', cancelTag);
                    return;
                }
            }
        } catch (e) {
            this.log("close dialog exception");
            this.log(e);
        }
    },

    /**
     * 执行方法后修复
     * @param func
     * @param time
     * @param randomTime
     */
    sleepFunc(func, time, randomTime) {
        if (!randomTime) {
            randomTime = 0;
        }
        func();
        this.sleep(time + randomTime * Math.random());
    },

    /**
     * 显示提示
     * @param msg
     */
    showToast(msg) {
        FloatDialogs.toast(msg);
        this.log(msg);
    },

    /**
     * 切分关键词
     * @param msg
     */
    splitKeyword(keyword) {
        keyword = keyword.replace(/，/g, ',');
        keyword = keyword.split(',');
        let ks = [];
        for (let i in keyword) {
            if (keyword[i] === '') {
                continue;
            }

            let tmp = keyword[i];
            if (keyword[i].indexOf('&') !== -1) {
                tmp = keyword[i].split('&');
            } else if (keyword[i].indexOf('+') !== -1) {
                tmp = keyword[i].split('+');
            }
            ks.push(tmp);
        }
        return ks;
    },

    /**
     * 检测标题是否包含关键词
     * @param contain
     * @param title
     * @returns {Array|null}
     */
    containsWord(contain, title) {
        contain = this.splitKeyword(contain);
        for (let con of contain) {
            if (typeof (con) === 'string' && title.indexOf(con) !== -1) {
                return [con];
            }

            if (typeof (con) === 'object') {
                let _true = true;
                for (let i in con) {
                    if (title.indexOf(con[i]) === -1) {
                        _true = false;
                    }
                }
                if (_true) {
                    return con;
                }
            }
        }
        return null;
    },

    /**
     * 获取标题中是否不包含的关键字
     * @param contain
     * @param title
     * @returns {boolean}
     */
    noContainsWord(noContain, title) {
        noContain = this.splitKeyword(noContain);
        for (let con of noContain) {
            if (typeof (con) === 'string' && title.indexOf(con) !== -1) {
                return false;
            }

            if (typeof (con) === 'object') {
                let len = 0;
                for (let i in con) {
                    if (title.indexOf(con[i]) !== -1) {
                        len++;
                    }
                }
                if (len === con.length) {
                    return false;
                }
            }
        }
        return noContain;
    },

    /**
     * 判断是否有备注
     * @param remark
     * @returns {boolean}
     */
    getRemark(remark) {
        return remark.indexOf('#') == 0 || remark.indexOf('＃') == 0;
    },

    rgbToColorName(rgbaStr) {
        // 解析 rgba
        const match = rgbaStr.match(/rgba?\(([^)]+)\)/i);
        if (!match) return "其他";

        const parts = match[1].split(",").map(s => parseFloat(s.trim()));
        const [r, g, b] = parts;

        // 转 HSL
        const { h, s, l } = this.rgbToHsl(r, g, b);

        // ===== 先判断黑白灰 =====
        if (l <= 0.08) return "黑";
        if (l >= 0.92) return "白";
        if (s <= 0.1) return "灰";

        // ===== 再判断色相 =====
        if ((h >= 0 && h < 30) || (h >= 330 && h <= 360)) return "红";
        if (h >= 30 && h < 70) return "黄";
        if (h >= 70 && h < 170) return "绿";
        if (h >= 170 && h < 260) return "蓝";

        return "其他";
    },

    // RGB 转 HSL
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h *= 60;
        }

        return {
            h: h || 0,
            s: s || 0,
            l: l || 0
        };
    },
}

module.exports = Common;
