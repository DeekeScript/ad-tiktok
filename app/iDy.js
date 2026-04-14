let DyCommon = require('app/dy/Common.js');
let DyVideo = require('app/dy/Video.js');
let DyUser = require('app/dy/User.js');
let DyIndex = require('app/dy/Index.js');
let DyComment = require('app/dy/Comment.js');
let storage = require('common/storage.js');
let machine = require('common/machine.js');
let baiduWenxin = require('service/baiduWenxin.js');
let statistics = require('common/statistics.js');

let iDy = {
    me: {},//当前账号的信息
    taskConfig: {},
    titles: [],//今日刷视频的所有标题  标题+'@@@'+昵称   保证唯一，从而减少请求后台接口
    provices: [],
    isCity: false,//是否是同城
    nicknames: [],//所有的昵称，重复的忽略

    /**
     * type 0 评论，1私信
     * @param {number} type 
     * @param {string} title 
     * @param {number} age 
     * @param {number} gender 
     * @returns {object}
     */
    getMsg(type, title, age = undefined, gender = undefined) {
        if (storage.get('setting_baidu_wenxin_switch', 'bool')) {
            return { msg: type === 1 ? baiduWenxin.getChat(title, age, gender) : baiduWenxin.getComment(title) };
        }
        return machine.getMsg(type) || false;//永远不会结束
    },

    /**
     * 抖音是否存在
     * @param {string} douyin 
     * @returns {boolean}
     */
    douyinExist(douyin) {
        if (storage.getMachineType() === 1) {
            return machine.douyinExist(douyin);//永远不会结束
        }
        return false;
    },

    douyinExistUpdate(douyin) {
        if (storage.getMachineType() === 1) {
            return machine.douyinExistUpdate(douyin);//永远不会结束
        }
        return false;
    },

    /**
     * 视频是否已存在
     * @param {string} nickname 
     * @param {string} title 
     * @returns 
     */
    videoExist(nickname, title) {
        if (storage.getMachineType() === 1) {
            return machine.videoExist(nickname, title);//永远不会结束
        }
        return false;
    },

    /**
     * 账号是否超出频率
     * @param {string} nickname 
     * @returns {boolean}
     */
    accountFreGt(nickname) {
        let res;
        if (storage.getMachineType() === 1) {
            res = machine.accountFreGt(nickname);
        }

        if (res.code === 0) {
            return true;
        }
        return false;
    },

    /**
     * 任务时间
     * @returns {number}
     */
    taskCheck() {
        //查看是否到了时间，没有的话，直接返回flase
        let hour = this.configData.toker_run_hour;
        if (!hour.includes("" + (new Date()).getHours())) {
            return 101;//不在任务时间
        }

        return 0;
    },

    /**
     * 检查标题是否包含关键词
     * @param {object} rule 
     * @param {string} title 
     * @returns {boolean}
     */
    videoRulesCheckTitle(rule, title) {
        if (rule.toker_view_video_keywords) {
            let containWord = DyCommon.containsWord(rule.toker_view_video_keywords, title);
            Log.log(containWord);
            if (containWord) {
                return true;
            }
            return false;
        }
        return true;
    },

    /**
     * 视频规则是否符合
     * @param {object} rule 
     * @param {object} videoData 
     * @returns 
     */
    videoRulesCheck(rule, videoData) {
        if (rule.toker_view_video_keywords) {
            let containWord = DyCommon.containsWord(rule.toker_view_video_keywords, videoData.title);
            Log.log(containWord);
            if (!containWord) {
                return false;
            }
        }

        return true;
    },

    /**
     * 刷视频
     * @param {object} videoRules 
     * @param {boolean} isCity 
     * @returns {object}
     */
    refreshVideo(videoRules, isCity) {
        DyCommon.log('refresh video');
        let videoData;
        let noTitleCount = 5;

        while (true) {
            DyVideo.next();
            DyCommon.sleep(2000 + 1000 * Math.random());
            DyCommon.log('get title');
            let vContent = undefined;

            let vNickname;
            try {
                vNickname = DyVideo.getNickname();
            } catch (e) {
                Log.log('get title failed');
            }

            if (!vNickname) {
                if (noTitleCount-- <= 0) {
                    DyCommon.log('not title times gt 5');
                    throw new Error('may be exception');
                }
                DyVideo.videoSlow();
                continue;
            }
            noTitleCount = 5;

            try {
                vContent = DyVideo.getContent();
            } catch (e) {
                Log.log('get title failed', e);
            }
            DyCommon.log("title:" + vContent);
            statistics.viewVideo();//刷视频数量加1

            DyCommon.log('check the title contains keyword');
            if (!this.videoRulesCheckTitle(videoRules, vContent)) {
                DyCommon.log('not contains keyword');
                DyVideo.videoSlow();
                continue;
            }

            //直播间的话，无法获取标题，直接过滤了
            DyCommon.log('is or not living');
            if (DyVideo.isLiving()) {
                DyCommon.log('living, next video');
                DyVideo.videoSlow();
                continue;
            }

            DyCommon.log('get nickname');
            let unique = vNickname + '_' + vContent;
            if (this.titles.includes(unique)) {
                DyCommon.log('repeat video');
                continue;
            }

            if (this.titles.length >= 100) {
                this.titles.shift();
            }

            this.titles.push(unique);

            if (this.nicknames.includes(vNickname) || this.accountFreGt(vNickname)) {
                DyCommon.log(vNickname + ', operate too much,  or repeat nickname');
                continue;
            }

            videoData = DyVideo.getInfo({ nickname: vNickname, title: vContent, commentCount: true });
            //接下来是视频的参数和config比对， 不合适则刷下一个
            let tmp = this.videoRulesCheck(videoRules, videoData);
            if (!tmp) {
                DyCommon.log('video rules not match');
                continue;
            }
            break;
        }

        statistics.viewTargetVideo();//目标视频数量加1
        if (videoRules.toker_view_video_second > 0) {
            DyCommon.log('sleep random: ' + (videoRules.toker_view_video_second / 2) + '-' + videoRules.toker_view_video_second + 's');
            DyCommon.sleep(videoRules.toker_view_video_second * 1000 * (0.5 + 0.5 * Math.random()));
        }

        if (!this.nicknames.includes(videoData.nickname)) {
            this.nicknames.push(videoData.nickname);
            if (this.nicknames.length > 3000) {
                this.nicknames.shift();
            }
        }

        return videoData;
    },

    /**
     * 评论操作
     * @param {object} videoData 
     * @returns {boolean}
     */
    commentDeal(videoData) {
        let windowOpen = false;
        DyCommon.log("comment rate: " + this.configData.toker_comment_rate);
        if (this.configData.toker_comment_rate > Math.random() * 100) {
            DyCommon.log('ready to comment');
            //随机评论视频
            let msg = this.getMsg(0, videoData.title);
            Log.log('commentDeal', msg, videoData.commentCount);
            if (msg) {
                DyVideo.openComment(!!videoData.commentCount);
                windowOpen = true;
                DyComment.commentMsg(msg.msg);//操作  评论视频
                DyCommon.log('commented');
            }
        }

        Log.log('comment count: ', videoData.commentCount, this.configData.toker_comment_area_zan_rate, this.configData.toker_comment_area_zan_rate < Math.random() * 100);

        //如果一开始没有评论 这里直接返回到视频
        if (videoData.commentCount === 0 || this.configData.toker_comment_area_zan_rate < Math.random() * 100) {
            if (windowOpen) {
                DyCommon.sleep(300);
                DyCommon.back();
                DyCommon.log('closed comment window');
                DyCommon.sleep(1000);
            }

            return true;
        }

        if (!windowOpen) {
            Log.log('open comment window 2');
            DyVideo.openComment(!!videoData.commentCount);
        }

        //随机点赞 评论回复
        let contains = [];//防止重复的
        let rps = 5;//大于2 则退出
        let opCount = 5;

        while (rps-- > 0) {
            Log.log('get comment list - start');
            let comments = DyComment.getList();
            Log.log('got comment list already: ' + comments.length);
            if (comments.length === 0) {
                break;
            }

            for (let comment of comments) {
                //移除了comment.content
                if (contains.includes(comment.nickname)) {
                    continue;
                }

                contains.push(comment.nickname);
                try {
                    Log.log("click like tag");
                    if (!DyComment.clickZan(comment)) {
                        DyCommon.log('click like failed');
                        continue;
                    }
                    Log.log("click zan tag success");
                    opCount--;
                } catch (e) {
                    Log.log(e);
                    opCount--;
                }

                if (opCount <= 0) {
                    break;
                }
            }

            if (opCount <= 0) {
                break;
            }

            Log.log('scroll');
            DyComment.swipeTop();
            DyCommon.sleep(1000 + 1000 * Math.random());
        }

        Log.log('back already');
        DyCommon.sleep(300);
        DyCommon.back();
        //漏洞修复  如果此时还在评论页面，则再一次返回
        DyCommon.sleep(1000);
        DyComment.closeCommentWindow();
        DyCommon.sleep(500 + 500 * Math.random());
    },

    /**
     * 运行推荐营销或者同城营销
     * @param {number} type 
     * @returns {boolean|number}
     */
    run(type) {
        this.isCity = (type == 1) ? true : false;
        DyCommon.log('is city: ' + this.isCity);
        this.configData = machine.getTokerData(type);
        Log.log(this.configData);
        return this.runTask();//返回指定编码
    },

    /**
     * 运行任务
     * @returns {boolean|number}
     */
    runTask() {
        //进入主页，获取个人的账号信息 然后进入视频界面
        DyCommon.log('into tiktok home', 1000);
        DyIndex.intoHome();
        if (this.isCity) {
            let type = Storage.get('toker_city_type');
            DyCommon.log('type=' + type);
            DyIndex.intoLocal(parseInt(type));
        } else {
            let type = Storage.get('toker_view_video_type');
            DyCommon.log('type=' + type);
            DyIndex.intoRecommend(parseInt(type));
        }

        //开始刷视频
        while (true) {
            let code = this.taskCheck();
            Log.log('get code：' + code);
            if (0 !== code) {
                return code;
            }

            Log.log('begin get video data');
            let videoData = this.refreshVideo(this.configData, this.isCity);
            Log.log('is or not ad video');
            //看看是不是广告，是的话，不操作作者  /** 广告没标题，自动过滤 */   部分广告也有标题
            if (DyVideo.viewDetail()) {
                Log.log('is ad video');
                continue;
            }

            //看看是否可以点赞了
            if (this.configData.toker_zan_rate / 100 >= Math.random() && !DyVideo.isZan()) {
                DyCommon.log('clicked like tag');
                DyVideo.clickZan();///操作  视频点赞
            }

            //现在决定是否对视频作者作者进行操作
            //查看频率是否允许操作作者
            //Log.log('关注和点赞检查', this.focusFreCheck(this.taskConfig.focus_author_fre), this.privateMsgFreCheck(this.taskConfig.private_author_fre))
            let private_rate = Math.random() * 100;
            let focus_rate = Math.random() * 100;
            if (this.configData.toker_private_msg_rate > private_rate || this.configData.toker_focus_rate > focus_rate) {
                DyCommon.sleep(1000);
                DyVideo.intoLocalUserPage();
                let userData;
                try {
                    Log.log("view user data");
                    userData = DyUser.getUserInfo();///////////操作  进入用户主页
                    Log.log("view user data", userData);
                } catch (e) {
                    //看看是不是进入了广告
                    Log.log('get user data exception', e);
                    DyCommon.sleep(1500);
                }

                if (userData) {
                    Log.log('view the user data');
                } else {
                    DyCommon.back(2);//有时候返回一次没用
                    Log.log('exception, back');
                    DyCommon.sleep(1000);
                    continue;
                }

                let isPrivateAccount = userData.isPrivate;
                if (!isPrivateAccount && this.configData.toker_focus_rate > focus_rate) {
                    Log.log('focused success');
                    DyUser.focus();//操作  关注视频作者
                    DyCommon.sleep(1500 + 500 * Math.random());
                }

                if (!this.douyinExist(userData.douyin)) {
                    if (!isPrivateAccount && this.configData.toker_private_msg_rate > private_rate) {
                        let msg = this.getMsg(1, userData.nickname);
                        Log.log('would private msg, msg: ', msg);
                        if (msg) {
                            DyUser.privateMsg(msg.msg);//操作  私信视频作者
                            this.douyinExistUpdate(userData.douyin);
                        }
                    }
                }

                DyCommon.back();
                Log.log('backed the app home');
                DyCommon.sleep(1000 + 500 * Math.random());
            }

            //看看是否可以操作评论区了
            DyCommon.sleep(500);
            Log.log('begin to deal comments');
            this.commentDeal(videoData);
            Log.log('begin next video');
        }
    },
}

module.exports = iDy;
